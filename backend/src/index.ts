import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { testConnection } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/authRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import interviewRoutes from "./routes/interviewRoutes";
import profileRoutes from "./routes/profileRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/profile", profileRoutes);

app.use(errorHandler);

const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();
