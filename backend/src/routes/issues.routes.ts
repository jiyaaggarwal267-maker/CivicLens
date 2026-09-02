import { Router } from "express";
import { upload } from "../middleware/upload";
import {
  listIssues,
  getIssue,
  addReportToIssue,
  assignDepartment,
  updateStatus,
  addResolution,
  runVerification,
  submitFeedback,
  getStats,
} from "../controllers/issues.controller";

const router = Router();

router.get("/", listIssues);
router.get("/stats", getStats);
router.get("/:id", getIssue);
router.post("/:id/reports", upload.single("image"), addReportToIssue);
router.post("/:id/assign", assignDepartment);
router.patch("/:id/status", updateStatus);
router.post("/:id/resolution", upload.single("image"), addResolution);
router.post("/:id/verify", runVerification);
router.post("/:id/feedback", submitFeedback);

export default router;
