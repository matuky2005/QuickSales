import { Router } from "express";
import {
  getBrandReport,
  getCustomerReport,
  getDailyReport,
  getSalesItemsReport
} from "../controllers/reportsController.js";

const router = Router();

router.get("/daily", getDailyReport);
router.get("/by-brand", getBrandReport);
router.get("/by-customer", getCustomerReport);
router.get("/sales-items", getSalesItemsReport);

export default router;
