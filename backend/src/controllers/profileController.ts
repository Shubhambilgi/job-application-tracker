import { Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/auth";
import { RowDataPacket } from "mysql2";

// GET /api/profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.user!.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// PUT /api/profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, password } = req.body;

    if (name) {
      await pool.query("UPDATE users SET name = ? WHERE id = ?", [name, req.user!.id]);
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
        passwordHash,
        req.user!.id,
      ]);
    }

    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
