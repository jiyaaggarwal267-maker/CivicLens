import { Router } from "express";
import { getMapIssues } from "../controllers/map.controller";

const router = Router();

router.get("/issues", getMapIssues);

export default router;
