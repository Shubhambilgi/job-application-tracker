import { Router } from "express";
import { updateInterview, deleteInterview } from "../controllers/interviewController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.put("/:id", updateInterview);
router.delete("/:id", deleteInterview);

export default router;
