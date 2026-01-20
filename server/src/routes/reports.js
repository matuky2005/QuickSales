import { Router } from "express";
import { getBrandReport, getCustomerReport, getDailyReport } from "../controllers/reportsController.js";

const router = Router();

router.get("/daily", getDailyReport);
router.get("/by-brand", getBrandReport);
router.get("/by-customer", getCustomerReport);

export default router;
