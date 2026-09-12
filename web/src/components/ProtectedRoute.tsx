// ReactNode allows this component to accept any valid React content
// as its protected child component.
import React, { ReactNode } from "react";

// Navigate lets us redirect unauthenticated users to the login page.
import { Navigate } from "react-router-dom";

// Authentication state comes from our centralized AuthContext.
import { useAuth } from "../context/AuthContext";

/*
 * ProtectedRoute is a route guard.
 *
 * Its job is simple:
 *
 * 1. Wait until authentication state has been checked.
 * 2. If there is no logged-in user → redirect to Login.
 * 3. If the user is authenticated → render the requested page.
 */
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  /*
   * AuthContext may need a moment to restore the user's session
   * from localStorage and/or verify it with the backend.
   *
   * We must wait before deciding whether the user is authenticated.
   */
  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  /*
   * No authenticated user means this is a private route being
   * accessed without a valid session.
   *
   * "replace" prevents the protected URL from remaining in the
   * browser history after the redirect.
   */
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /*
   * The user is authenticated, so render the protected page.
   */
  return <>{children}</>;
};

export default ProtectedRoute;