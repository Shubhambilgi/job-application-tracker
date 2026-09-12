// React hooks.
// useEffect → loads the profile when the page opens.
// useState → stores profile data and UI state.
import React, { useEffect, useState } from "react";

// Axios instance configured for our backend API.
import api from "../api/axios";

// Converts an unknown API error into a message that can be displayed safely.
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

const Profile = () => {
  // Stores the user's editable name.
  const [name, setName] = useState("");

  // Email is displayed but not edited by this page.
  const [email, setEmail] = useState("");

  // Role is also displayed as read-only information.
  const [role, setRole] = useState("");

  // Stores a new password when the user wants to change it.
  const [password, setPassword] = useState("");

  // Success message shown after a successful update.
  const [message, setMessage] = useState("");

  // Error message shown when loading or updating fails.
  const [error, setError] = useState("");

  // Controls the initial profile-loading state.
  const [loading, setLoading] = useState(true);

  // Controls the save/update request.
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Prevent state updates if the component is unmounted
    // before the API request finishes.
    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setError("");

      try {
        // GET retrieves the currently authenticated user's profile.
        const res = await api.get("/profile");

        if (cancelled) {
          return;
        }

        // Populate the form with backend data.
        setName(res.data.name || "");
        setEmail(res.data.email || "");
        setRole(res.data.role || "");
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            getErrorMessage(
              err,
              "Failed to load your profile. Please try again."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    // Cleanup function runs when the component is unmounted.
    return () => {
      cancelled = true;
    };
  }, []);

  // Handles profile form submission.
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent the browser from reloading the page.
    e.preventDefault();

    // Clear messages from a previous submission.
    setMessage("");
    setError("");

    // Remove accidental spaces from the user's name.
    const normalizedName = name.trim();

    // Basic frontend validation.
    if (!normalizedName) {
      setError("Name is required.");
      return;
    }

    if (normalizedName.length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    // Password is optional.
    // We only validate it when the user actually entered one.
    if (password && password.length < 6) {
      setError("New password must contain at least 6 characters.");
      return;
    }

    setSaving(true);

    try {
      // Start with the fields that are always allowed to change.
      const payload: {
        name: string;
        password?: string;
      } = {
        name: normalizedName,
      };

      // Only send password when the user entered a new one.
      //
      // This avoids accidentally replacing the existing password
      // with an empty value.
      if (password) {
        payload.password = password;
      }

      // PUT updates the authenticated user's profile.
      await api.put("/profile", payload);

      // Show a success message after the backend confirms the update.
      setMessage("Profile updated successfully.");

      // Clear the password field after a successful update.
      // We should never leave a password sitting in the form unnecessarily.
      setPassword("");
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "Failed to update your profile. Please try again."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // Show a dedicated loading state while the profile is being fetched.
  if (loading) {
    return <div className="page-loading">Loading profile...</div>;
  }

  return (
    <div className="page">
      <h1>Profile</h1>

      <p className="subtitle">
        Manage your account information and password.
      </p>

      {/* Success feedback after a successful update. */}
      {message && <div className="success-banner">{message}</div>}

      {/* API or validation errors. */}
      {error && <div className="error-banner">{error}</div>}

      <form className="card-form" onSubmit={handleSubmit}>
        <label htmlFor="profile-name">Name</label>

        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          autoComplete="name"
          required
          disabled={saving}
        />

        <label htmlFor="profile-email">Email</label>

        <input
          id="profile-email"
          type="email"
          value={email}
          disabled
          autoComplete="email"
        />

        <p className="form-hint">
          Email cannot be changed from the profile page.
        </p>

        <label htmlFor="profile-role">Role</label>

        <input
          id="profile-role"
          type="text"
          value={role}
          disabled
        />

        <label htmlFor="profile-password">
          New Password
        </label>

        <input
          id="profile-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Leave blank to keep your current password"
          autoComplete="new-password"
          minLength={6}
          disabled={saving}
        />

        <p className="form-hint">
          Leave this field blank if you do not want to change your
          password. Minimum 6 characters.
        </p>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default Profile;