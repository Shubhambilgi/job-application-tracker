import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { Application } from "../types";
import { useAuth } from "../context/AuthContext";

const Applications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/applications${showAll ? "?all=true" : ""}`);
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this application?")) return;
    try {
      await api.delete(`/applications/${id}`);
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="page-loading">Loading applications...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Applications</h1>
        <div className="page-header-actions">
          {user?.role === "admin" && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              Show all users' applications
            </label>
          )}
          <Link to="/applications/new" className="btn btn-primary">
            + Add Application
          </Link>
        </div>
      </div>

      {applications.length === 0 ? (
        <p>No applications found.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>Applied On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>{app.company_name}</td>
                <td>{app.job_title}</td>
                <td>
                  <span className={`badge badge-${app.status}`}>{app.status}</span>
                </td>
                <td>{new Date(app.applied_date).toLocaleDateString()}</td>
                <td className="table-actions">
                  <Link to={`/applications/${app.id}`}>Edit</Link>
                  <button className="link-btn" onClick={() => handleDelete(app.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Applications;
