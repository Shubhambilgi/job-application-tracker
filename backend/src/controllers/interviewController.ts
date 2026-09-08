import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/auth";
import { RowDataPacket } from "mysql2";

const assertOwnsApplication = async (
  applicationId: string | number,
  userId: number,
  role: string
) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM applications WHERE id = ?",
    [applicationId]
  );
  const application = rows[0];
  if (!application) return { ok: false, code: 404, message: "Application not found" };
  if (application.user_id !== userId && role !== "admin") {
    return { ok: false, code: 403, message: "Access forbidden" };
  }
  return { ok: true, application };
};

// GET /api/applications/:appId/interviews
export const getInterviews = async (req: AuthRequest, res: Response) => {
  try {
    const { appId } = req.params;
    const check = await assertOwnsApplication(appId, req.user!.id, req.user!.role);
    if (!check.ok) return res.status(check.code!).json({ message: check.message });

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM interviews WHERE application_id = ? ORDER BY interview_date ASC",
      [appId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
};

// POST /api/applications/:appId/interviews
export const createInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { appId } = req.params;
    const check = await assertOwnsApplication(appId, req.user!.id, req.user!.role);
    if (!check.ok) return res.status(check.code!).json({ message: check.message });

    const { round_name, interview_date, mode, status, notes } = req.body;

    if (!round_name || !interview_date) {
      return res.status(400).json({ message: "round_name and interview_date are required" });
    }

    const [result]: any = await pool.query(
      `INSERT INTO interviews (application_id, round_name, interview_date, mode, status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [appId, round_name, interview_date, mode || "online", status || "scheduled", notes || null]
    );

    res.status(201).json({ id: result.insertId, message: "Interview created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create interview" });
  }
};

// PUT /api/interviews/:id
export const updateInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM interviews WHERE id = ?",
      [id]
    );
    const interview = rows[0];
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    const check = await assertOwnsApplication(interview.application_id, req.user!.id, req.user!.role);
    if (!check.ok) return res.status(check.code!).json({ message: check.message });

    const { round_name, interview_date, mode, status, notes } = req.body;

    await pool.query(
      `UPDATE interviews SET round_name = ?, interview_date = ?, mode = ?, status = ?, notes = ?
       WHERE id = ?`,
      [
        round_name ?? interview.round_name,
        interview_date ?? interview.interview_date,
        mode ?? interview.mode,
        status ?? interview.status,
        notes ?? interview.notes,
        id,
      ]
    );

    res.json({ message: "Interview updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update interview" });
  }
};

// DELETE /api/interviews/:id
export const deleteInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM interviews WHERE id = ?",
      [id]
    );
    const interview = rows[0];
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    const check = await assertOwnsApplication(interview.application_id, req.user!.id, req.user!.role);
    if (!check.ok) return res.status(check.code!).json({ message: check.message });

    await pool.query("DELETE FROM interviews WHERE id = ?", [id]);
    res.json({ message: "Interview deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete interview" });
  }
};
