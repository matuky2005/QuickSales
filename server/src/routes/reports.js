import { Router } from "express";
import { getBrandReport, getDailyReport } from "../controllers/reportsController.js";

const router = Router();

router.get("/daily", getDailyReport);
router.get("/by-brand", getBrandReport);

export default router;
