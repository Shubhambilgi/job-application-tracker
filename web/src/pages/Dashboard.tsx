import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";
import { Application, Interview } from "../types";
import { useAuth } from "../context/AuthContext";

const statusOrder: Application["status"][] = [
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
];

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

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

const formatInterviewDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const Dashboard = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const applicationsResponse = await api.get("/applications");

      const applicationData: Application[] = applicationsResponse.data;

      setApplications(applicationData);

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

  useEffect(() => {
    void fetchDashboardData();

    // fetchDashboardData is intentionally omitted because it is
    // recreated on each render and this effect should run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const recentApplications = useMemo(() => {
    return [...applications]
      .sort(
        (a, b) =>
          new Date(b.applied_date).getTime() -
          new Date(a.applied_date).getTime()
      )
      .slice(0, 5);
  }, [applications]);

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

  const getApplicationForInterview = (applicationId: number) => {
    return applications.find(
      (application) => application.id === applicationId
    );
  };

  const dashboardStats = [
    {
      label: "Applications",
      value: applications.length,
      className: "stat-primary",
    },
    {
      label: "Interviews",
      value: interviews.length,
      className: "stat-warning",
    },
    {
      label: "Interviewing",
      value: counts.interviewing || 0,
      className: "stat-info",
    },
    {
      label: "Offers",
      value: counts.offer || 0,
      className: "stat-success",
    },
  ];

  if (loading) {
    return (
      <div className="page-loading">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      {/* ======================================================
          DASHBOARD HEADER
          ====================================================== */}

      <section className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Job search dashboard</p>

          <h1>Welcome back, {user?.name}</h1>

          <p className="subtitle">
            Track your applications, interviews, and opportunities in one place.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void fetchDashboardData(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <Link to="/applications/new" className="btn btn-primary">
            + Add Application
          </Link>
        </div>
      </section>

      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {/* ======================================================
          KEY METRICS
          ====================================================== */}

      <section className="dashboard-section">
        <div className="stats-grid dashboard-stats">
          {dashboardStats.map((stat) => (
            <div
              className={`stat-card dashboard-stat-card ${stat.className}`}
              key={stat.label}
            >
              <span className="stat-label">{stat.label}</span>

              <span className="stat-number">{stat.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          APPLICATION PIPELINE
          ====================================================== */}

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Pipeline</p>

            <h2>Application overview</h2>

            <p className="subtitle">
              See how your applications are progressing.
            </p>
          </div>

          <Link to="/applications" className="section-link">
            View all applications →
          </Link>
        </div>

        <div className="pipeline-grid">
          {statusOrder.map((status) => (
            <div className="pipeline-card" key={status}>
              <div className="pipeline-card-header">
                <span
                  className={`pipeline-dot pipeline-dot-${status}`}
                />

                <span>{formatStatus(status)}</span>
              </div>

              <strong>{counts[status] || 0}</strong>

              <span>
                {counts[status] === 1 ? "application" : "applications"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          RECENT APPLICATIONS
          ====================================================== */}

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Latest activity</p>

            <h2>Recent applications</h2>

            <p className="subtitle">
              Your five most recently submitted applications.
            </p>
          </div>

          <Link to="/applications" className="section-link">
            View all →
          </Link>
        </div>

        {recentApplications.length === 0 ? (
          <div className="empty-state dashboard-empty-state">
            <h3>No applications yet</h3>

            <p>
              Start tracking your job search by adding your first application.
            </p>

            <Link to="/applications/new" className="btn btn-primary">
              + Add Your First Application
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table dashboard-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {recentApplications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <strong>{application.company_name}</strong>
                    </td>

                    <td>{application.job_title}</td>

                    <td>
                      <span
                        className={`badge badge-${application.status}`}
                      >
                        {formatStatus(application.status)}
                      </span>
                    </td>

                    <td>{formatDate(application.applied_date)}</td>

                    <td>
                      <Link
                        to={`/applications/${application.id}`}
                        className="table-link"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ======================================================
          UPCOMING INTERVIEWS
          ====================================================== */}

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Next steps</p>

            <h2>Upcoming interviews</h2>

            <p className="subtitle">
              Your next scheduled interview rounds.
            </p>
          </div>
        </div>

        {upcomingInterviews.length === 0 ? (
          <div className="empty-state dashboard-empty-state">
            <h3>No upcoming interviews</h3>

            <p>
              Scheduled interview rounds will appear here.
            </p>

            {applications.length > 0 && (
              <Link to="/applications" className="btn btn-secondary">
                View Applications
              </Link>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table dashboard-table">
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
                  const application = getApplicationForInterview(
                    interview.application_id
                  );

                  return (
                    <tr key={interview.id}>
                      <td>
                        <strong>
                          {application?.company_name || "Unknown company"}
                        </strong>
                      </td>

                      <td>
                        {application?.job_title || "Unknown role"}
                      </td>

                      <td>
                        <strong>{interview.round_name}</strong>
                      </td>

                      <td>
                        {formatInterviewDate(interview.interview_date)}
                      </td>

                      <td>
                        <span className="tag">{interview.mode}</span>
                      </td>

                      <td>
                        {application ? (
                          <Link
                            to={`/applications/${application.id}`}
                            className="table-link"
                          >
                            View →
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
      </section>

      {/* ======================================================
          QUICK ACTIONS
          ====================================================== */}

      <section className="quick-actions-card">
        <div>
          <p className="section-eyebrow">Shortcuts</p>

          <h2>Quick actions</h2>

          <p className="subtitle">
            Keep your job search moving with frequently used actions.
          </p>
        </div>

        <div className="quick-actions">
          <Link to="/applications/new" className="btn btn-primary">
            + Add Application
          </Link>

          <Link to="/applications" className="btn btn-secondary">
            View Applications
          </Link>

          <Link to="/profile" className="btn btn-secondary">
            View Profile
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;