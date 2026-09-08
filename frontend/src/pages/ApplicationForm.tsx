import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { Application, Interview } from "../types";

const emptyForm = {
  company_name: "",
  job_title: "",
  job_link: "",
  status: "applied" as Application["status"],
  applied_date: new Date().toISOString().slice(0, 10),
  notes: "",
};

const ApplicationForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [newInterview, setNewInterview] = useState({
    round_name: "",
    interview_date: "",
    mode: "online" as Interview["mode"],
    status: "scheduled" as Interview["status"],
    notes: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      api.get(`/applications/${id}`).then((res) => {
        const app = res.data;
        setForm({
          company_name: app.company_name,
          job_title: app.job_title,
          job_link: app.job_link || "",
          status: app.status,
          applied_date: app.applied_date?.slice(0, 10),
          notes: app.notes || "",
        });
      });
      api.get(`/applications/${id}/interviews`).then((res) => setInterviews(res.data));
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isEdit) {
        await api.put(`/applications/${id}`, form);
      } else {
        await api.post("/applications", form);
      }
      navigate("/applications");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save application");
    }
  };

  const handleAddInterview = async () => {
    if (!newInterview.round_name || !newInterview.interview_date) return;
    try {
      await api.post(`/applications/${id}/interviews`, newInterview);
      const res = await api.get(`/applications/${id}/interviews`);
      setInterviews(res.data);
      setNewInterview({ round_name: "", interview_date: "", mode: "online", status: "scheduled", notes: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInterview = async (interviewId: number) => {
    try {
      await api.delete(`/interviews/${interviewId}`);
      setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">
      <h1>{isEdit ? "Edit Application" : "New Application"}</h1>
      {error && <div className="error-banner">{error}</div>}

      <form className="card-form" onSubmit={handleSubmit}>
        <label>Company Name</label>
        <input name="company_name" value={form.company_name} onChange={handleChange} required />

        <label>Job Title</label>
        <input name="job_title" value={form.job_title} onChange={handleChange} required />

        <label>Job Link</label>
        <input name="job_link" value={form.job_link} onChange={handleChange} placeholder="https://..." />

        <label>Status</label>
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="applied">Applied</option>
          <option value="interviewing">Interviewing</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>

        <label>Applied Date</label>
        <input type="date" name="applied_date" value={form.applied_date} onChange={handleChange} required />

        <label>Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={4} />

        <button type="submit" className="btn btn-primary">
          {isEdit ? "Save Changes" : "Create Application"}
        </button>
      </form>

      {isEdit && (
        <div className="interviews-section">
          <h2>Interview Rounds</h2>

          {interviews.length === 0 ? (
            <p>No interview rounds recorded yet.</p>
          ) : (
            <ul className="interview-list">
              {interviews.map((iv) => (
                <li key={iv.id} className="interview-item">
                  <div>
                    <strong>{iv.round_name}</strong> — {new Date(iv.interview_date).toLocaleString()}
                    <span className={`badge badge-${iv.status}`}>{iv.status}</span>
                    <span className="tag">{iv.mode}</span>
                  </div>
                  <button className="link-btn" onClick={() => handleDeleteInterview(iv.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="card-form inline-form">
            <input
              placeholder="Round name (e.g. Technical Round 1)"
              value={newInterview.round_name}
              onChange={(e) => setNewInterview({ ...newInterview, round_name: e.target.value })}
            />
            <input
              type="datetime-local"
              value={newInterview.interview_date}
              onChange={(e) => setNewInterview({ ...newInterview, interview_date: e.target.value })}
            />
            <select
              value={newInterview.mode}
              onChange={(e) => setNewInterview({ ...newInterview, mode: e.target.value as Interview["mode"] })}
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="phone">Phone</option>
            </select>
            <button type="button" className="btn btn-secondary" onClick={handleAddInterview}>
              + Add Round
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationForm;
