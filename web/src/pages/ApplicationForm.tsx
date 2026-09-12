// Imports React functionality.
// useState → stores changing data.
// useEffect → runs code when the component loads or dependencies change.
import React, { useEffect, useState } from "react";

// React Router hooks.
// useNavigate → moves the user between pages.
// useParams → reads dynamic values such as the application ID from the URL.
import { useNavigate, useParams } from "react-router-dom";

// Our configured Axios instance for communicating with the backend API.
import api from "../api/axios";

// TypeScript types for application and interview data.
import { Application, Interview } from "../types";

// Default values used when creating a new application.
const emptyForm = {
  company_name: "",
  job_title: "",
  job_link: "",
  status: "applied" as Application["status"],
  applied_date: new Date().toISOString().slice(0, 10),
  notes: "",
};

// Default values used when adding a new interview round.
const emptyInterview = {
  round_name: "",
  interview_date: "",
  mode: "online" as Interview["mode"],
  status: "scheduled" as Interview["status"],
  notes: "",
};

// Converts an unknown API error into a message that we can show to the user.
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

// Converts an API date into the format required by datetime-local inputs.
const formatDateTimeLocal = (value: string) => {
  const normalized = value.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return normalized.slice(0, 16);
  }

  const pad = (number: number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Converts an interview date into a readable format for the user.
const formatInterviewDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const ApplicationForm = () => {
  // Gets the application ID from a URL such as /applications/5.
  const { id } = useParams();

  // If an ID exists, we are editing an existing application.
  const isEdit = Boolean(id);

  // Allows us to navigate to another route programmatically.
  const navigate = useNavigate();

  // Stores application form values.
  const [form, setForm] = useState(emptyForm);

  // Stores all interview rounds for this application.
  const [interviews, setInterviews] = useState<Interview[]>([]);

  // Stores the values currently entered in the interview form.
  const [newInterview, setNewInterview] = useState(emptyInterview);

  // Stores the ID of the interview currently being edited.
  // null means that we are adding a new interview.
  const [editingInterviewId, setEditingInterviewId] = useState<number | null>(
    null
  );

  // Different loading states make the UI more informative.
  const [loading, setLoading] = useState(isEdit);
  const [savingApplication, setSavingApplication] = useState(false);
  const [savingInterview, setSavingInterview] = useState(false);
  const [deletingInterviewId, setDeletingInterviewId] = useState<number | null>(
    null
  );

  // Stores an error message that can be displayed to the user.
  const [error, setError] = useState("");

  useEffect(() => {
    // New applications do not need data from the backend.
    if (!isEdit || !id) {
      setLoading(false);
      return;
    }

    // Prevents state updates if the component is removed before
    // the API request finishes.
    let cancelled = false;

    const loadApplication = async () => {
      setLoading(true);
      setError("");

      try {
        // Both requests are independent, so we can run them together.
        const [applicationResponse, interviewsResponse] = await Promise.all([
          api.get(`/applications/${id}`),
          api.get(`/applications/${id}/interviews`),
        ]);

        if (cancelled) {
          return;
        }

        const app = applicationResponse.data;

        // Put the existing application data into the form.
        setForm({
          company_name: app.company_name || "",
          job_title: app.job_title || "",
          job_link: app.job_link || "",
          status: app.status,
          applied_date: app.applied_date?.slice(0, 10) || "",
          notes: app.notes || "",
        });

        // Store the application's interview rounds.
        setInterviews(interviewsResponse.data);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            getErrorMessage(err, "Failed to load application details.")
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadApplication();

    // Cleanup function runs when the component is unmounted.
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  // Handles changes in application inputs.
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Validates application data before sending it to the backend.
  const validateApplication = () => {
    if (!form.company_name.trim()) {
      return "Company name is required.";
    }

    if (!form.job_title.trim()) {
      return "Job title is required.";
    }

    if (!form.applied_date) {
      return "Applied date is required.";
    }

    // Validate the job link only when the user entered one.
    if (form.job_link.trim()) {
      try {
        const url = new URL(form.job_link.trim());

        if (url.protocol !== "http:" && url.protocol !== "https:") {
          return "Job link must use http:// or https://.";
        }
      } catch {
        return "Please enter a valid job link.";
      }
    }

    return "";
  };

  // Validates interview data before creating or updating it.
  const validateInterview = () => {
    if (!newInterview.round_name.trim()) {
      return "Interview round name is required.";
    }

    if (!newInterview.interview_date) {
      return "Interview date and time are required.";
    }

    const date = new Date(newInterview.interview_date);

    if (Number.isNaN(date.getTime())) {
      return "Please enter a valid interview date and time.";
    }

    return "";
  };

  // Resets the interview form back to add mode.
  const resetInterviewForm = () => {
    setNewInterview({ ...emptyInterview });
    setEditingInterviewId(null);
  };

  // Creates a new application or updates an existing one.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateApplication();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSavingApplication(true);

    try {
      // Trim unnecessary spaces before sending data to the backend.
      const payload = {
        ...form,
        company_name: form.company_name.trim(),
        job_title: form.job_title.trim(),
        job_link: form.job_link.trim(),
        notes: form.notes.trim(),
      };

      if (isEdit) {
        // PUT is used because we are updating an existing application.
        await api.put(`/applications/${id}`, payload);
      } else {
        // POST is used because we are creating a new application.
        await api.post("/applications", payload);
      }

      // Return to the applications list after saving.
      navigate("/applications");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save application."));
    } finally {
      setSavingApplication(false);
    }
  };

  // Creates a new interview round.
  const handleAddInterview = async () => {
    setError("");

    const validationError = validateInterview();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!id) {
      setError("Save the application before adding an interview.");
      return;
    }

    setSavingInterview(true);

    try {
      const payload = {
        ...newInterview,
        round_name: newInterview.round_name.trim(),
        notes: newInterview.notes.trim(),
      };

      // POST creates a new interview record.
      await api.post(`/applications/${id}/interviews`, payload);

      // Reload interviews so the UI always reflects backend data.
      const response = await api.get(`/applications/${id}/interviews`);

      setInterviews(response.data);

      // Return the interview form to its default add state.
      resetInterviewForm();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to add interview round."));
    } finally {
      setSavingInterview(false);
    }
  };

  // Loads an existing interview into the form for editing.
  const startEditInterview = (interview: Interview) => {
    setError("");

    // Store the ID so we know which interview should be updated.
    setEditingInterviewId(interview.id);

    // Fill the form with the selected interview's current values.
    setNewInterview({
      round_name: interview.round_name,
      interview_date: formatDateTimeLocal(interview.interview_date),
      mode: interview.mode,
      status: interview.status,
      notes: interview.notes || "",
    });
  };

  // Updates an existing interview round.
  const handleUpdateInterview = async () => {
    setError("");

    const validationError = validateInterview();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (editingInterviewId === null) {
      return;
    }

    setSavingInterview(true);

    try {
      const payload = {
        ...newInterview,
        round_name: newInterview.round_name.trim(),
        notes: newInterview.notes.trim(),
      };

      // PUT updates the selected interview.
      await api.put(`/interviews/${editingInterviewId}`, payload);

      if (id) {
        // Reload the list after updating so frontend state matches the backend.
        const response = await api.get(`/applications/${id}/interviews`);
        setInterviews(response.data);
      }

      // Return to add mode after successful editing.
      resetInterviewForm();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update interview round."));
    } finally {
      setSavingInterview(false);
    }
  };

  // Deletes an interview after asking the user for confirmation.
  const handleDeleteInterview = async (interviewId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this interview round?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setDeletingInterviewId(interviewId);

    try {
      // DELETE removes the interview from the backend.
      await api.delete(`/interviews/${interviewId}`);

      // Immediately remove it from the UI after successful deletion.
      setInterviews((prev) =>
        prev.filter((interview) => interview.id !== interviewId)
      );

      // If the deleted interview was being edited, reset the form.
      if (editingInterviewId === interviewId) {
        resetInterviewForm();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to remove interview round."));
    } finally {
      setDeletingInterviewId(null);
    }
  };

  return (
    <div className="page">
      <h1>{isEdit ? "Edit Application" : "New Application"}</h1>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="card-form">
          <p>Loading application...</p>
        </div>
      ) : (
        <>
          <form className="card-form" onSubmit={handleSubmit}>
            <label>Company Name</label>

            <input
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              placeholder="e.g. Microsoft"
              required
              disabled={savingApplication}
            />

            <label>Job Title</label>

            <input
              name="job_title"
              value={form.job_title}
              onChange={handleChange}
              placeholder="e.g. Software Developer"
              required
              disabled={savingApplication}
            />

            <label>Job Link</label>

            <input
              name="job_link"
              value={form.job_link}
              onChange={handleChange}
              placeholder="https://..."
              disabled={savingApplication}
            />

            <label>Status</label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              disabled={savingApplication}
            >
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>

            <label>Applied Date</label>

            <input
              type="date"
              name="applied_date"
              value={form.applied_date}
              onChange={handleChange}
              required
              disabled={savingApplication}
            />

            <label>Notes</label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Add useful notes about this application..."
              disabled={savingApplication}
            />

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingApplication}
            >
              {savingApplication
                ? "Saving..."
                : isEdit
                ? "Save Changes"
                : "Create Application"}
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
                        <strong>{iv.round_name}</strong>

                        <div>
                          {formatInterviewDate(iv.interview_date)}
                        </div>

                        <span className={`badge badge-${iv.status}`}>
                          {iv.status}
                        </span>

                        <span className="tag">{iv.mode}</span>

                        {iv.notes && (
                          <p>
                            <strong>Notes:</strong> {iv.notes}
                          </p>
                        )}
                      </div>

                      <div>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => startEditInterview(iv)}
                          disabled={
                            savingInterview ||
                            deletingInterviewId !== null
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => handleDeleteInterview(iv.id)}
                          disabled={
                            savingInterview ||
                            deletingInterviewId !== null
                          }
                        >
                          {deletingInterviewId === iv.id
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="card-form inline-form">
                <h3>
                  {editingInterviewId !== null
                    ? "Edit Interview Round"
                    : "Add Interview Round"}
                </h3>

                <input
                  placeholder="Round name (e.g. Technical Round 1)"
                  value={newInterview.round_name}
                  onChange={(e) =>
                    setNewInterview({
                      ...newInterview,
                      round_name: e.target.value,
                    })
                  }
                  disabled={savingInterview}
                  required
                />

                <input
                  type="datetime-local"
                  value={newInterview.interview_date}
                  onChange={(e) =>
                    setNewInterview({
                      ...newInterview,
                      interview_date: e.target.value,
                    })
                  }
                  disabled={savingInterview}
                  required
                />

                <select
                  value={newInterview.mode}
                  onChange={(e) =>
                    setNewInterview({
                      ...newInterview,
                      mode: e.target.value as Interview["mode"],
                    })
                  }
                  disabled={savingInterview}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="phone">Phone</option>
                </select>

                <select
                  value={newInterview.status}
                  onChange={(e) =>
                    setNewInterview({
                      ...newInterview,
                      status: e.target.value as Interview["status"],
                    })
                  }
                  disabled={savingInterview}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <textarea
                  placeholder="Interview notes..."
                  value={newInterview.notes}
                  onChange={(e) =>
                    setNewInterview({
                      ...newInterview,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                  disabled={savingInterview}
                />

                {editingInterviewId !== null ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleUpdateInterview}
                      disabled={savingInterview}
                    >
                      {savingInterview ? "Saving..." : "Save Interview"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetInterviewForm}
                      disabled={savingInterview}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddInterview}
                    disabled={savingInterview}
                  >
                    {savingInterview ? "Adding..." : "+ Add Round"}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ApplicationForm;