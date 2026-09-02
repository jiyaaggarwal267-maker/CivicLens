import { Router } from "express";
import { upload } from "../middleware/upload";
import { createReport, listMyReports } from "../controllers/reports.controller";

const router = Router();

router.get("/", listMyReports);
router.post("/", upload.single("image"), createReport);

export default router;
