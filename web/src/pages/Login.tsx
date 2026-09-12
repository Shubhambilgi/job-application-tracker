// React hook used to store form values and UI state.
import React, { useState } from "react";

// Link → navigates to Register without reloading the page.
// useNavigate → redirects the user after successful login.
import { Link, useNavigate } from "react-router-dom";

// Our authentication context.
// The login function handles authentication with the backend.
import { useAuth } from "../context/AuthContext";

// Converts an unknown API error into a message we can safely display.
const getErrorMessage = (error: unknown, fallback: string) => {
  // Axios errors normally contain a response object.
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return fallback;
};

const Login = () => {
  // Stores the email entered by the user.
  const [email, setEmail] = useState("");

  // Stores the password entered by the user.
  const [password, setPassword] = useState("");

  // Stores an error message that should be displayed to the user.
  const [error, setError] = useState("");

  // Tracks whether the login request is currently running.
  // This prevents duplicate submissions.
  const [loading, setLoading] = useState(false);

  // Gets the login function from our authentication context.
  const { login } = useAuth();

  // Allows us to redirect the user after successful authentication.
  const navigate = useNavigate();

  // Handles submission of the login form.
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevents the browser from performing a normal page reload.
    e.preventDefault();

    // Remove any previous error before starting a new request.
    setError("");

    // Basic frontend validation.
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    // A simple browser-compatible email format check.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // Send the credentials through our AuthContext.
      // The context is responsible for communicating with the backend.
      await login(normalizedEmail, password);

      // Login succeeded, so move the user to the dashboard.
      navigate("/dashboard");
    } catch (err: unknown) {
      // Show the backend's message when available.
      setError(
        getErrorMessage(
          err,
          "Login failed. Please check your email and password."
        )
      );
    } finally {
      // Re-enable the form after the request finishes.
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>

        <p className="subtitle">
          Sign in to manage your job applications.
        </p>

        {/* Only render the error container when an error exists. */}
        {error && <div className="error-banner">{error}</div>}

        <label htmlFor="login-email">Email</label>

        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={loading}
        />

        <label htmlFor="login-password">Password</label>

        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          disabled={loading}
        />

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;