import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { Application } from "../types";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/applications");
        setApplications(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const counts = applications.reduce<Record<string, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const statusOrder = ["applied", "interviewing", "offer", "rejected", "withdrawn"];

  if (loading) return <div className="page-loading">Loading dashboard...</div>;

  return (
    <div className="page">
      <h1>Welcome, {user?.name}</h1>
      <p className="subtitle">Here's a snapshot of your job search.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-number">{applications.length}</span>
          <span className="stat-label">Total Applications</span>
        </div>
        {statusOrder.map((status) => (
          <div className="stat-card" key={status}>
            <span className="stat-number">{counts[status] || 0}</span>
            <span className="stat-label">{status[0].toUpperCase() + status.slice(1)}</span>
          </div>
        ))}
      </div>

      <h2>Recent Applications</h2>
      {applications.length === 0 ? (
        <p>No applications yet. Add one from the Applications tab.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>Applied On</th>
            </tr>
          </thead>
          <tbody>
            {applications.slice(0, 5).map((app) => (
              <tr key={app.id}>
                <td>{app.company_name}</td>
                <td>{app.job_title}</td>
                <td>
                  <span className={`badge badge-${app.status}`}>{app.status}</span>
                </td>
                <td>{new Date(app.applied_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Dashboard;
