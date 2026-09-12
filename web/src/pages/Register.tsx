// React hook used to store form values and UI state.
import React, { useState } from "react";

// Link → moves between authentication pages.
// useNavigate → redirects the user after successful registration.
import { Link, useNavigate } from "react-router-dom";

// Authentication context contains the registration logic.
import { useAuth } from "../context/AuthContext";

// Converts an unknown API error into a message that can be shown to the user.
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

const Register = () => {
  // Stores the user's name.
  const [name, setName] = useState("");

  // Stores the user's email.
  const [email, setEmail] = useState("");

  // Stores the password entered by the user.
  const [password, setPassword] = useState("");

  // Stores validation or API errors.
  const [error, setError] = useState("");

  // Tracks whether the registration request is running.
  // This prevents duplicate form submissions.
  const [loading, setLoading] = useState(false);

  // Gets the registration function from AuthContext.
  const { register } = useAuth();

  // Allows us to redirect after successful registration.
  const navigate = useNavigate();

  // Handles registration form submission.
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent the browser's default form submission/reload.
    e.preventDefault();

    // Remove an error from a previous submission.
    setError("");

    // Remove accidental spaces from the name and email.
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();

    // Basic name validation.
    if (!normalizedName) {
      setError("Name is required.");
      return;
    }

    if (normalizedName.length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    // Basic email validation.
    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Password validation.
    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // AuthContext handles the actual API request and authentication state.
      await register(normalizedName, normalizedEmail, password);

      // Registration succeeded, so move the user to the dashboard.
      navigate("/dashboard");
    } catch (err: unknown) {
      // Display the backend message when available.
      setError(
        getErrorMessage(
          err,
          "Registration failed. Please try again."
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
        <h2>Create Account</h2>

        <p className="subtitle">
          Create an account to start tracking your job search.
        </p>

        {/* Only display the error container when an error exists. */}
        {error && <div className="error-banner">{error}</div>}

        <label htmlFor="register-name">Name</label>

        <input
          id="register-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          autoComplete="name"
          required
          disabled={loading}
        />

        <label htmlFor="register-email">Email</label>

        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={loading}
        />

        <label htmlFor="register-password">Password</label>

        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
          required
          minLength={6}
          disabled={loading}
        />

        <p className="form-hint">
          Password must contain at least 6 characters.
        </p>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p>
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;