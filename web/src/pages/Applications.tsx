import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { Application } from "../types";
import { useAuth } from "../context/AuthContext";

type SortOption =
  | "newest"
  | "oldest"
  | "company-asc"
  | "company-desc"
  | "job-asc"
  | "job-desc";

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

const formatStatus = (status: Application["status"]) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

const Applications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    Application["status"] | "all"
  >("all");
  const [sortOption, setSortOption] =
    useState<SortOption>("newest");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const endpoint = `/applications${
        showAll ? "?all=true" : ""
      }`;

      const response = await api.get(endpoint);

      setApplications(response.data);
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "Failed to load applications. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();

    // fetchData depends on showAll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll]);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setDeletingId(id);

    try {
      await api.delete(`/applications/${id}`);

      setApplications((previous) =>
        previous.filter(
          (application) => application.id !== id
        )
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

  const visibleApplications = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    const filtered = applications.filter((application) => {
      const companyName =
        application.company_name.toLowerCase();

      const jobTitle =
        application.job_title.toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        companyName.includes(normalizedSearch) ||
        jobTitle.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

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
          return a.company_name.localeCompare(
            b.company_name
          );

        case "company-desc":
          return b.company_name.localeCompare(
            a.company_name
          );

        case "job-asc":
          return a.job_title.localeCompare(b.job_title);

        case "job-desc":
          return b.job_title.localeCompare(a.job_title);

        default:
          return 0;
      }
    });
  }, [
    applications,
    searchTerm,
    statusFilter,
    sortOption,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortOption("newest");
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    sortOption !== "newest";

  if (loading) {
    return (
      <div className="page-loading">
        Loading applications...
      </div>
    );
  }

  return (
    <div className="page applications-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="applications-header">
        <div className="applications-header-content">
          <span className="applications-eyebrow">
            JOB SEARCH
          </span>

          <h1>Applications</h1>

          <p className="applications-description">
            Manage and track every job application in one place.
          </p>
        </div>

        <div className="applications-header-actions">

          {user?.role === "admin" && (
            <label className="applications-admin-toggle">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(event) =>
                  setShowAll(event.target.checked)
                }
              />

              <span>Show all users</span>
            </label>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchData}
            disabled={deletingId !== null}
          >
            Refresh
          </button>

          <Link
            to="/applications/new"
            className="btn btn-primary"
          >
            + Add Application
          </Link>
        </div>
      </header>

      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {/* ======================================================
          SUMMARY
          ====================================================== */}

      <section className="applications-summary">

        <div className="applications-summary-main">
          <span className="applications-summary-label">
            Total applications
          </span>

          <strong className="applications-summary-count">
            {applications.length}
          </strong>
        </div>

        <div className="applications-summary-result">
          Showing{" "}
          <strong>{visibleApplications.length}</strong>{" "}
          of{" "}
          <strong>{applications.length}</strong>
        </div>

      </section>

      {/* ======================================================
          FILTERS
          ====================================================== */}

      {applications.length > 0 && (
        <section
          className="applications-toolbar"
          aria-label="Application filters"
        >

          <div className="applications-search">
            <label htmlFor="application-search">
              Search applications
            </label>

            <input
              id="application-search"
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search company or job title..."
            />
          </div>

          <div className="applications-filter">
            <label htmlFor="status-filter">
              Status
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
              <option value="all">
                All statuses
              </option>

              <option value="applied">
                Applied
              </option>

              <option value="interviewing">
                Interviewing
              </option>

              <option value="offer">
                Offer
              </option>

              <option value="rejected">
                Rejected
              </option>

              <option value="withdrawn">
                Withdrawn
              </option>
            </select>
          </div>

          <div className="applications-filter">
            <label htmlFor="sort-applications">
              Sort by
            </label>

            <select
              id="sort-applications"
              value={sortOption}
              onChange={(event) =>
                setSortOption(
                  event.target.value as SortOption
                )
              }
            >
              <option value="newest">
                Newest first
              </option>

              <option value="oldest">
                Oldest first
              </option>

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
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary applications-clear-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}

        </section>
      )}

      {/* ======================================================
          EMPTY DATABASE
          ====================================================== */}

      {applications.length === 0 ? (

        <section className="applications-empty-state">

          <div className="applications-empty-icon">
            +
          </div>

          <span className="applications-empty-eyebrow">
            GET STARTED
          </span>

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

        </section>

      ) : visibleApplications.length === 0 ? (

        /* ====================================================
           NO FILTER RESULTS
           ==================================================== */

        <section className="applications-empty-state">

          <div className="applications-empty-icon">
            ?
          </div>

          <span className="applications-empty-eyebrow">
            NO RESULTS
          </span>

          <h2>No matching applications</h2>

          <p>
            Try changing your search term or status filter.
          </p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearFilters}
          >
            Clear filters
          </button>

        </section>

      ) : (

        /* ====================================================
           APPLICATION TABLE
           ==================================================== */

        <section className="applications-table-card">

          <div className="applications-table-header">

            <div>
              <span className="applications-table-eyebrow">
                APPLICATIONS
              </span>

              <h2>Your applications</h2>

              <p>
                Review your applications and manage their
                current status.
              </p>
            </div>

            <span className="applications-table-count">
              {visibleApplications.length}{" "}
              {visibleApplications.length === 1
                ? "application"
                : "applications"}
            </span>

          </div>

          <div className="table-wrapper">

            <table className="table applications-table">

              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Job</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {visibleApplications.map(
                  (application) => (
                    <tr key={application.id}>

                      <td>
                        <div className="application-company">
                          <strong>
                            {application.company_name}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <span className="application-role">
                          {application.job_title}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge badge-${application.status}`}
                        >
                          {formatStatus(
                            application.status
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="application-date">
                          {formatDate(
                            application.applied_date
                          )}
                        </span>
                      </td>

                      <td>
                        {application.job_link ? (
                          <a
                            className="application-job-link"
                            href={application.job_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View job ↗
                          </a>
                        ) : (
                          <span className="application-no-link">
                            —
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="application-actions">

                          <Link
                            className="application-view-link"
                            to={`/applications/${application.id}`}
                          >
                            View / Edit
                          </Link>

                          <button
                            type="button"
                            className="application-delete-button"
                            onClick={() =>
                              handleDelete(
                                application.id
                              )
                            }
                            disabled={
                              deletingId !== null
                            }
                          >
                            {deletingId ===
                            application.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>
      )}

    </div>
  );
};

export default Applications;