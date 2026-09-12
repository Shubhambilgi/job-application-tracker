import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import api from "../api/axios";
import { User } from "../types";

/*
 * These are the authentication operations available
 * to the rest of the application.
 *
 * Any component using useAuth() can access these values.
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;

  // Authenticate an existing user.
  login: (email: string, password: string) => Promise<void>;

  // Create a new user account and authenticate them.
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;

  // Remove the current authentication session.
  logout: () => void;
}

/*
 * Context stores authentication state globally.
 *
 * undefined is used as the initial value so useAuth()
 * can detect if it is accidentally used outside AuthProvider.
 */
const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

/*
 * AuthProvider makes authentication state available
 * to the entire frontend application.
 */
export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  // Stores the currently authenticated user.
  // null means there is no logged-in user.
  const [user, setUser] = useState<User | null>(null);

  /*
   * loading prevents protected routes from making an
   * authentication decision before session restoration finishes.
   */
  const [loading, setLoading] = useState(true);

  /*
   * When the application starts, try to restore the previous
   * authentication session from localStorage.
   */
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      /*
       * No stored authentication data means there is no
       * previous session to restore.
       */
      if (!token || !storedUser) {
        setLoading(false);
        return;
      }

      try {
        /*
         * Parse the stored user to make sure localStorage
         * contains valid JSON.
         *
         * The backend response is still treated as the
         * source of truth for the current user.
         */
        JSON.parse(storedUser) as User;

        /*
         * Ask the backend to verify the stored JWT and return
         * the current authenticated user.
         *
         * This prevents us from trusting localStorage alone.
         */
        const response = await api.get<User>("/auth/me");

        setUser(response.data);

        /*
         * Keep localStorage synchronized with the latest
         * user information returned by the backend.
         */
        localStorage.setItem(
          "user",
          JSON.stringify(response.data)
        );
      } catch {
        /*
         * If the token is invalid, expired, or the stored user
         * data is corrupted, remove the session completely.
         */
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        /*
         * Authentication checking is finished regardless of
         * whether session restoration succeeded or failed.
         */
        setLoading(false);
      }
    };

    void restoreSession();
  }, []);

  /*
   * Login:
   *
   * 1. Send credentials to the backend.
   * 2. Receive JWT + user information.
   * 3. Store the session locally.
   * 4. Update React state.
   */
  const login = async (
    email: string,
    password: string
  ) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    localStorage.setItem("token", response.data.token);

    localStorage.setItem(
      "user",
      JSON.stringify(response.data.user)
    );

    setUser(response.data.user);
  };

  /*
   * Register:
   *
   * The backend creates the account and immediately returns
   * authentication information, so the user is logged in
   * without needing a separate login step.
   */
  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    localStorage.setItem("token", response.data.token);

    localStorage.setItem(
      "user",
      JSON.stringify(response.data.user)
    );

    setUser(response.data.user);
  };

  /*
   * Logout removes both pieces of client-side session data
   * and resets React authentication state.
   */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/*
 * Custom hook used by components that need authentication data.
 *
 * Example:
 *
 * const { user, logout } = useAuth();
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  /*
   * This catches an architectural mistake where useAuth()
   * is used outside of AuthProvider.
   */
  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
};