import { Router } from "express";
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../controllers/applicationController";
import {
  getInterviews,
  createInterview,
} from "../controllers/interviewController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getApplications);
router.post("/", createApplication);
router.get("/:id", getApplicationById);
router.put("/:id", updateApplication);
router.delete("/:id", deleteApplication);

// Nested interview routes
router.get("/:appId/interviews", getInterviews);
router.post("/:appId/interviews", createInterview);

export default router;
