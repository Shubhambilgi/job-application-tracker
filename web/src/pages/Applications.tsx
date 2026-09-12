// React hooks.
// useEffect → loads applications when the page opens or showAll changes.
// useMemo → efficiently calculates filtered and sorted applications.
import React, { useEffect, useMemo, useState } from "react";

// Link lets us navigate between pages without reloading the application.
import { Link } from "react-router-dom";

// Axios instance configured for our backend API.
import api from "../api/axios";

// TypeScript type describing an application.
import { Application } from "../types";

// Gives us access to the currently logged-in user.
import { useAuth } from "../context/AuthContext";

// Available sorting options for the applications list.
type SortOption =
  | "newest"
  | "oldest"
  | "company-asc"
  | "company-desc"
  | "job-asc"
  | "job-desc";

// Converts an unknown API error into a useful message for the UI.
const getErrorMessage = (error: unknown, fallback: string) => {
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

const Applications = () => {
  // Stores the applications received from the backend.
  const [applications, setApplications] = useState<Application[]>([]);

  // Controls the loading state while data is being fetched.
  const [loading, setLoading] = useState(true);

  // Admins can switch between their own applications and all users'
  // applications.
  const [showAll, setShowAll] = useState(false);

  // Search text entered by the user.
  const [searchTerm, setSearchTerm] = useState("");

  // Selected status filter.
  const [statusFilter, setStatusFilter] = useState<
    Application["status"] | "all"
  >("all");

  // Controls the order of applications in the table.
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  // Stores an API error that should be shown to the user.
  const [error, setError] = useState("");

  // Stores which application is currently being deleted.
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Gets the logged-in user from our authentication context.
  const { user } = useAuth();

  // Fetch applications from the backend.
  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      // The backend supports ?all=true for admins.
      // Normal users only receive their own applications.
      const endpoint = `/applications${showAll ? "?all=true" : ""}`;

      const response = await api.get(endpoint);

      // Store the backend response in React state.
      setApplications(response.data);
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "Failed to load applications. Please try again."
        )
      );
    } finally {
      // This runs whether the request succeeds or fails.
      setLoading(false);
    }
  };

  // Load applications when the page opens.
  // Admins also trigger another request when Show All changes.
  useEffect(() => {
    void fetchData();

    // fetchData depends on showAll.
    // We intentionally control this effect using showAll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll]);

  // Delete an application.
  const handleDelete = async (id: number) => {
    // Confirmation protects against accidental deletion.
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setDeletingId(id);

    try {
      // Delete the application from the database.
      await api.delete(`/applications/${id}`);

      // Remove it from local state immediately.
      // This avoids making another GET request.
      setApplications((previous) =>
        previous.filter((application) => application.id !== id)
      );
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "Failed to delete the application. Please try again."
        )
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
   * Search, filtering and sorting happen on the data already loaded
   * from the backend.
   *
   * useMemo avoids repeating this calculation when unrelated state
   * changes, such as deleting/loading state.
   */
  const visibleApplications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    // First filter the applications.
    const filtered = applications.filter((application) => {
      const companyName = application.company_name.toLowerCase();
      const jobTitle = application.job_title.toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        companyName.includes(normalizedSearch) ||
        jobTitle.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Then sort the filtered applications.
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return (
            new Date(b.applied_date).getTime() -
            new Date(a.applied_date).getTime()
          );

        case "oldest":
          return (
            new Date(a.applied_date).getTime() -
            new Date(b.applied_date).getTime()
          );

        case "company-asc":
          return a.company_name.localeCompare(b.company_name);

        case "company-desc":
          return b.company_name.localeCompare(a.company_name);

        case "job-asc":
          return a.job_title.localeCompare(b.job_title);

        case "job-desc":
          return b.job_title.localeCompare(a.job_title);

        default:
          return 0;
      }
    });
  }, [applications, searchTerm, statusFilter, sortOption]);

  // Reset search, filtering and sorting controls.
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortOption("newest");
  };

  // Used to decide whether the Clear Filters button is needed.
  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    sortOption !== "newest";

  // Initial loading state.
  if (loading) {
    return (
      <div className="page-loading">
        Loading applications...
      </div>
    );
  }

  return (
    <div className="page">
      {/* --------------------------------------------------------
          PAGE HEADER
          -------------------------------------------------------- */}
      <div className="page-header">
        <div>
          <h1>Applications</h1>

          <p className="subtitle">
            {visibleApplications.length} of {applications.length}{" "}
            {applications.length === 1
              ? "application"
              : "applications"}
          </p>
        </div>

        <div className="page-header-actions">
          {/* Only admins can request applications from all users. */}
          {user?.role === "admin" && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(event) =>
                  setShowAll(event.target.checked)
                }
              />

              Show all users' applications
            </label>
          )}

          {/* Allows the user to manually reload backend data. */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchData}
            disabled={loading || deletingId !== null}
          >
            Refresh
          </button>

          {/* Main page action. */}
          <Link
            to="/applications/new"
            className="btn btn-primary"
          >
            + Add Application
          </Link>
        </div>
      </div>

      {/* API errors should be visible instead of only appearing
          in the browser console. */}
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {/* --------------------------------------------------------
          SEARCH / FILTER / SORT
          -------------------------------------------------------- */}
      {applications.length > 0 && (
        <section className="card-form" aria-label="Application filters">
          <h2>Find Applications</h2>

          <label htmlFor="application-search">
            Search
          </label>

          <input
            id="application-search"
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search by company or job title..."
          />

          <label htmlFor="status-filter">
            Filter by Status
          </label>

          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | Application["status"]
                  | "all"
              )
            }
          >
            <option value="all">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="interviewing">
              Interviewing
            </option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>

          <label htmlFor="sort-applications">
            Sort By
          </label>

          <select
            id="sort-applications"
            value={sortOption}
            onChange={(event) =>
              setSortOption(event.target.value as SortOption)
            }
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="company-asc">
              Company A → Z
            </option>
            <option value="company-desc">
              Company Z → A
            </option>
            <option value="job-asc">
              Job title A → Z
            </option>
            <option value="job-desc">
              Job title Z → A
            </option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </section>
      )}

      {/* --------------------------------------------------------
          EMPTY STATES
          -------------------------------------------------------- */}

      {/* No applications exist in the database. */}
      {applications.length === 0 ? (
        <div className="empty-state">
          <h2>No applications yet</h2>

          <p>
            Start tracking your job search by adding your
            first application.
          </p>

          <Link
            to="/applications/new"
            className="btn btn-primary"
          >
            + Add Your First Application
          </Link>
        </div>
      ) : visibleApplications.length === 0 ? (
        /* Applications exist, but the current filters found
           no matching results. */
        <div className="empty-state">
          <h2>No matching applications</h2>

          <p>
            Try changing your search term or status filter.
          </p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* ------------------------------------------------------
           APPLICATION TABLE
           ------------------------------------------------------ */

        /*
         * table-wrapper provides horizontal scrolling on small
         * screens so the table remains usable on mobile.
         */
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Applied On</th>
                <th>Job Link</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleApplications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <strong>
                      {application.company_name}
                    </strong>
                  </td>

                  <td>{application.job_title}</td>

                  <td>
                    <span
                      className={`badge badge-${application.status}`}
                    >
                      {application.status}
                    </span>
                  </td>

                  <td>
                    {new Date(
                      application.applied_date
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    {application.job_link ? (
                      <a
                        href={application.job_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Job
                      </a>
                    ) : (
                      <span>—</span>
                    )}
                  </td>

                  <td className="table-actions">
                    <Link
                      to={`/applications/${application.id}`}
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      className="link-btn"
                      onClick={() =>
                        handleDelete(application.id)
                      }
                      disabled={deletingId !== null}
                    >
                      {deletingId === application.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Applications;