import React from "react";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/*
 * Navbar is displayed only when a user is authenticated.
 *
 * It provides:
 * - Application branding
 * - Main navigation
 * - Current user's name and role
 * - Logout functionality
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /*
   * Logout removes the current authentication session.
   * After logout, the user is redirected to the login page.
   */
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  /*
   * Public pages such as Login and Register do not need
   * the authenticated navigation bar.
   */
  if (!user) {
    return null;
  }

  return (
    <nav className="navbar" aria-label="Main navigation">
      {/* Brand links back to the dashboard. */}
      <Link to="/dashboard" className="navbar-brand">
        Job Tracker
      </Link>

      <div className="navbar-links">
        {/*
         * NavLink is used instead of Link because it can detect
         * which route is currently active.
         *
         * The "active" class can later be styled in CSS.
         */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/applications"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Applications
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Profile
        </NavLink>

        {/* Displays basic information about the logged-in user. */}
        <span className="navbar-user">
          {user.name} ({user.role})
        </span>

        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-secondary"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;