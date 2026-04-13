import { Router } from "express";
import { getHealth } from "../controllers/health.controller.js";
import { getDashboard } from "../controllers/dashboard.controller.js";
import { listJobs, updateJobs } from "../controllers/jobs.controller.js";
import { handleValidation, jobsListValidators } from "../middleware/validateQuery.js";

const router = Router();

router.get("/health", getHealth);

router.get("/api/dashboard", getDashboard);

router.get("/api/jobs", jobsListValidators, handleValidation, listJobs);

router.post("/api/jobs/update", updateJobs);

export default router;
