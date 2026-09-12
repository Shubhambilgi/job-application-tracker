import React, { useEffect, useMemo, useState } from "react";

// Link allows navigation without a full browser refresh.
import { Link } from "react-router-dom";

// Axios instance configured to communicate with our backend.
import api from "../api/axios";

// TypeScript types used by this page.
import { Application, Interview } from "../types";

// Authentication context gives us the logged-in user's information.
import { useAuth } from "../context/AuthContext";

// Keep the dashboard status order in one place.
const statusOrder: Application["status"][] = [
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
];

// Converts an API error into a message that can be shown to the user.
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

// Converts "interviewing" into "Interviewing".
const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Formats a date for normal dashboard display.
const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

// Formats an interview date and time.
const formatInterviewDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const Dashboard = () => {
  // Applications returned by the backend.
  const [applications, setApplications] = useState<Application[]>([]);

  // Interviews belonging to the user's applications.
  const [interviews, setInterviews] = useState<Interview[]>([]);

  // Controls the initial dashboard loading state.
  const [loading, setLoading] = useState(true);

  // Controls manual refresh.
  const [refreshing, setRefreshing] = useState(false);

  // Stores errors that should be displayed to the user.
  const [error, setError] = useState("");

  // Authentication context provides the logged-in user's information.
  const { user } = useAuth();

  /*
   * Loads applications first and then their interview records.
   *
   * The current backend exposes interviews through the application
   * routes, so we request the interviews belonging to each application.
   */
  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      // Get the current user's applications.
      const applicationsResponse = await api.get("/applications");

      const applicationData: Application[] =
        applicationsResponse.data;

      setApplications(applicationData);

      /*
       * The backend currently exposes:
       * GET /applications/:id/interviews
       *
       * Promise.all makes these requests run concurrently instead
       * of waiting for each request one after another.
       */
      if (applicationData.length > 0) {
        const interviewResponses = await Promise.all(
          applicationData.map((application) =>
            api.get(`/applications/${application.id}/interviews`)
          )
        );

        const allInterviews = interviewResponses.flatMap(
          (response) => response.data as Interview[]
        );

        setInterviews(allInterviews);
      } else {
        setInterviews([]);
      }
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "Failed to load dashboard data. Please try again."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
   * Load the dashboard when the component first mounts.
   *
   * The cleanup flag prevents state updates if the component is
   * removed before an asynchronous request finishes.
   */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled) {
        return;
      }

      await fetchDashboardData();
    };

    void load();

    return () => {
      cancelled = true;
    };

    // fetchDashboardData is intentionally omitted because it is
    // recreated on each render and this effect should run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Calculates how many applications exist in each status.
   *
   * Example:
   * {
   *   applied: 4,
   *   interviewing: 2,
   *   offer: 1
   * }
   */
  const counts = useMemo(() => {
    return applications.reduce<Record<string, number>>(
      (accumulator, application) => {
        accumulator[application.status] =
          (accumulator[application.status] || 0) + 1;

        return accumulator;
      },
      {}
    );
  }, [applications]);

  /*
   * Creates a separate sorted array so the original React state
   * is never mutated by Array.sort().
   */
  const recentApplications = useMemo(() => {
    return [...applications]
      .sort(
        (a, b) =>
          new Date(b.applied_date).getTime() -
          new Date(a.applied_date).getTime()
      )
      .slice(0, 5);
  }, [applications]);

  /*
   * Only future interviews with "scheduled" status belong here.
   *
   * Sorting puts the nearest upcoming interview first.
   */
  const upcomingInterviews = useMemo(() => {
    const now = new Date();

    return [...interviews]
      .filter((interview) => {
        const interviewDate = new Date(interview.interview_date);

        return (
          interview.status === "scheduled" &&
          !Number.isNaN(interviewDate.getTime()) &&
          interviewDate.getTime() >= now.getTime()
        );
      })
      .sort(
        (a, b) =>
          new Date(a.interview_date).getTime() -
          new Date(b.interview_date).getTime()
      )
      .slice(0, 5);
  }, [interviews]);

  // Finds the application belonging to a particular interview.
  const getApplicationForInterview = (applicationId: number) => {
    return applications.find(
      (application) => application.id === applicationId
    );
  };

  if (loading) {
    return (
      <div className="page-loading">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="page">
      {/* ======================================================
          DASHBOARD HEADER
          ====================================================== */}

      <div className="page-header">
        <div>
          <h1>Welcome, {user?.name}</h1>

          <p className="subtitle">
            Here's a snapshot of your job search.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void fetchDashboardData(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <Link
            to="/applications/new"
            className="btn btn-primary"
          >
            + Add Application
          </Link>
        </div>
      </div>

      {/* API errors are displayed directly in the UI. */}
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {/* ======================================================
          APPLICATION STATISTICS
          ====================================================== */}

      <div className="stats-grid">
        {/* Total applications. */}
        <div className="stat-card">
          <span className="stat-number">
            {applications.length}
          </span>

          <span className="stat-label">
            Total Applications
          </span>
        </div>

        {/* Individual application status counts. */}
        {statusOrder.map((status) => (
          <div className="stat-card" key={status}>
            <span className="stat-number">
              {counts[status] || 0}
            </span>

            <span className="stat-label">
              {formatStatus(status)}
            </span>
          </div>
        ))}

        {/* Total interview rounds. */}
        <div className="stat-card">
          <span className="stat-number">
            {interviews.length}
          </span>

          <span className="stat-label">
            Interview Rounds
          </span>
        </div>
      </div>

      {/* ======================================================
          RECENT APPLICATIONS
          ====================================================== */}

      <div className="section-header">
        <div>
          <h2>Recent Applications</h2>

          <p className="subtitle">
            Your five most recently applied positions.
          </p>
        </div>

        <Link to="/applications">
          View All
        </Link>
      </div>

      {recentApplications.length === 0 ? (
        <div className="empty-state">
          <h3>No applications yet</h3>

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
      ) : (
        /*
         * table-wrapper allows horizontal scrolling on small
         * screens without breaking the table layout.
         */
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Applied On</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {recentApplications.map((application) => (
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
                      {formatStatus(application.status)}
                    </span>
                  </td>

                  <td>
                    {formatDate(application.applied_date)}
                  </td>

                  <td>
                    <Link
                      to={`/applications/${application.id}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================
          UPCOMING INTERVIEWS
          ====================================================== */}

      <div className="section-header">
        <div>
          <h2>Upcoming Interviews</h2>

          <p className="subtitle">
            Your next scheduled interview rounds.
          </p>
        </div>
      </div>

      {upcomingInterviews.length === 0 ? (
        <div className="empty-state">
          <h3>No upcoming interviews</h3>

          <p>
            Scheduled interview rounds will appear here.
          </p>

          {applications.length > 0 && (
            <Link
              to="/applications"
              className="btn btn-secondary"
            >
              View Applications
            </Link>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Round</th>
                <th>Date & Time</th>
                <th>Mode</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {upcomingInterviews.map((interview) => {
                const application =
                  getApplicationForInterview(
                    interview.application_id
                  );

                return (
                  <tr key={interview.id}>
                    <td>
                      <strong>
                        {application?.company_name ||
                          "Unknown company"}
                      </strong>
                    </td>

                    <td>
                      {application?.job_title ||
                        "Unknown role"}
                    </td>

                    <td>
                      <strong>
                        {interview.round_name}
                      </strong>
                    </td>

                    <td>
                      {formatInterviewDate(
                        interview.interview_date
                      )}
                    </td>

                    <td>
                      <span className="tag">
                        {interview.mode}
                      </span>
                    </td>

                    <td>
                      {application ? (
                        <Link
                          to={`/applications/${application.id}`}
                        >
                          View
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================
          QUICK ACTIONS
          ====================================================== */}

      <div className="card-form">
        <h3>Quick Actions</h3>

        <div className="page-header-actions">
          <Link
            to="/applications/new"
            className="btn btn-primary"
          >
            + Add Application
          </Link>

          <Link
            to="/applications"
            className="btn btn-secondary"
          >
            View Applications
          </Link>

          <Link
            to="/profile"
            className="btn btn-secondary"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;