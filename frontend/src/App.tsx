// React is required for JSX and React components.
import React from "react";

// React Router handles client-side navigation without full page reloads.
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Authentication context.
// AuthProvider makes the logged-in user available throughout the application.
import { AuthProvider, useAuth } from "./context/AuthContext";

// Protects routes that should only be accessible to authenticated users.
import ProtectedRoute from "./components/ProtectedRoute";

// Navigation bar shown across the application.
import Navbar from "./components/Navbar";

// Public authentication pages.
import Login from "./pages/Login";
import Register from "./pages/Register";

// Protected application pages.
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import ApplicationForm from "./pages/ApplicationForm";
import Profile from "./pages/Profile";

/*
 * AppRoutes contains the actual route definitions.
 *
 * It is kept separate from App so that it can safely use
 * authentication state provided by AuthProvider.
 */
const AppRoutes = () => {
  // Gets the currently authenticated user.
  // If user is null, nobody is logged in.
  const { user } = useAuth();

  return (
    <BrowserRouter>
      {/* Navbar is available throughout the application. */}
      <Navbar />

      <Routes>
        {/* -------------------------------------------------
            PUBLIC AUTHENTICATION ROUTES
            ------------------------------------------------- */}

        <Route
          path="/login"
          element={
            user ? (
              // Logged-in users should not see the login page.
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/register"
          element={
            user ? (
              // Logged-in users should not create another account
              // from the registration page.
              <Navigate to="/dashboard" replace />
            ) : (
              <Register />
            )
          }
        />

        {/* -------------------------------------------------
            PROTECTED APPLICATION ROUTES
            ------------------------------------------------- */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <Applications />
            </ProtectedRoute>
          }
        />

        {/* Route used when creating a new application. */}
        <Route
          path="/applications/new"
          element={
            <ProtectedRoute>
              <ApplicationForm />
            </ProtectedRoute>
          }
        />

        {/* Route used when editing an existing application.
        
            Example:
            /applications/5

            The :id part is a dynamic route parameter.
        */}
        <Route
          path="/applications/:id"
          element={
            <ProtectedRoute>
              <ApplicationForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* -------------------------------------------------
            FALLBACK ROUTE
            -------------------------------------------------

            If the user enters an unknown URL, send them to
            the appropriate starting page.
        */}
        <Route
          path="*"
          element={
            <Navigate
              to={user ? "/dashboard" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

/*
 * App is the root component of the frontend.
 *
 * AuthProvider wraps the entire routing system so every page
 * and protected route can access authentication state.
 */
const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;