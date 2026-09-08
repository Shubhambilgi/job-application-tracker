import React, { useEffect, useState } from "react";
import api from "../api/axios";

const Profile = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/profile").then((res) => {
      setName(res.data.name);
      setEmail(res.data.email);
      setRole(res.data.role);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await api.put("/profile", { name, ...(password ? { password } : {}) });
      setMessage("Profile updated successfully");
      setPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="page">
      <h1>Profile</h1>
      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

      <form className="card-form" onSubmit={handleSubmit}>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />

        <label>Email</label>
        <input value={email} disabled />

        <label>Role</label>
        <input value={role} disabled />

        <label>New Password (leave blank to keep current)</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />

        <button type="submit" className="btn btn-primary">Save Changes</button>
      </form>
    </div>
  );
};

export default Profile;
