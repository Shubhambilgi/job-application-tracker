import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/auth";
import { RowDataPacket } from "mysql2";

// GET /api/applications - list current user's applications (or all, if admin + ?all=true)
export const getApplications = async (req: AuthRequest, res: Response) => {
  try {
    const isAdminAll = req.user!.role === "admin" && req.query.all === "true";

    const [rows] = isAdminAll
      ? await pool.query<RowDataPacket[]>(
          `SELECT a.*, u.name AS applicant_name, u.email AS applicant_email
           FROM applications a JOIN users u ON a.user_id = u.id
           ORDER BY a.applied_date DESC`
        )
      : await pool.query<RowDataPacket[]>(
          "SELECT * FROM applications WHERE user_id = ? ORDER BY applied_date DESC",
          [req.user!.id]
        );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

// GET /api/applications/:id
export const getApplicationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM applications WHERE id = ?",
      [id]
    );

    const application = rows[0];

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.user_id !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ message: "Access forbidden" });
    }

    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch application" });
  }
};

// POST /api/applications
export const createApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { company_name, job_title, job_link, status, applied_date, notes } = req.body;

    if (!company_name || !job_title || !applied_date) {
      return res.status(400).json({ message: "company_name, job_title, and applied_date are required" });
    }

    const [result]: any = await pool.query(
      `INSERT INTO applications (user_id, company_name, job_title, job_link, status, applied_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user!.id, company_name, job_title, job_link || null, status || "applied", applied_date, notes || null]
    );

    res.status(201).json({ id: result.insertId, message: "Application created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create application" });
  }
};

// PUT /api/applications/:id
export const updateApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM applications WHERE id = ?",
      [id]
    );
    const application = rows[0];

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.user_id !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ message: "Access forbidden" });
    }

    const { company_name, job_title, job_link, status, applied_date, notes } = req.body;

    await pool.query(
      `UPDATE applications
       SET company_name = ?, job_title = ?, job_link = ?, status = ?, applied_date = ?, notes = ?
       WHERE id = ?`,
      [
        company_name ?? application.company_name,
        job_title ?? application.job_title,
        job_link ?? application.job_link,
        status ?? application.status,
        applied_date ?? application.applied_date,
        notes ?? application.notes,
        id,
      ]
    );

    res.json({ message: "Application updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update application" });
  }
};

// DELETE /api/applications/:id
export const deleteApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM applications WHERE id = ?",
      [id]
    );
    const application = rows[0];

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.user_id !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ message: "Access forbidden" });
    }

    await pool.query("DELETE FROM applications WHERE id = ?", [id]);
    res.json({ message: "Application deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete application" });
  }
};
