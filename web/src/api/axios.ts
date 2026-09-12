// Axios is used to communicate with our Express backend API.
import axios from "axios";

/*
 * Create one reusable Axios instance for the entire frontend.
 *
 * VITE_API_URL comes from the frontend environment file.
 *
 * Local development:
 *   VITE_API_URL=http://localhost:5000
 *
 * The "/api" prefix is added here so individual API calls can
 * simply use paths such as "/applications" or "/auth/login".
 */
const api = axios.create({
  baseURL: `${
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  }/api`,

  headers: {
    "Content-Type": "application/json",
  },
});

/*
 * REQUEST INTERCEPTOR
 *
 * This function runs before every API request.
 *
 * Instead of manually adding the JWT to every request:
 *
 *   api.get("/applications", {
 *     headers: {
 *       Authorization: `Bearer ${token}`
 *     }
 *   })
 *
 * we automatically attach it here.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/*
 * RESPONSE INTERCEPTOR
 *
 * This function runs after the backend responds.
 *
 * A 401 response usually means the authentication token is
 * missing, invalid, or expired.
 *
 * Instead of handling this separately in every page, we handle
 * authentication failure centrally here.
 */
api.interceptors.response.use(
  /*
   * Successful responses pass through unchanged.
   */
  (response) => response,

  /*
   * Failed responses are handled here.
   */
  (error) => {
    if (error.response?.status === 401) {
      /*
       * Remove the invalid session from localStorage.
       */
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      /*
       * Redirect the user to Login if they are not already
       * on the login page.
       *
       * window.location.href performs a full browser navigation,
       * which also resets the current React authentication state.
       */
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    /*
     * Reject the error so the calling page can still handle
     * the error when necessary.
     */
    return Promise.reject(error);
  }
);

export default api;