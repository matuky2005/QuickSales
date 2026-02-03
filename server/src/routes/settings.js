import { Router } from "express";
import {
  getDollarSettings,
  getTicketSettings,
  updateDollarSettings,
  updateTicketSettings
} from "../controllers/settingsController.js";

const router = Router();

router.get("/dolar", getDollarSettings);
router.put("/dolar", updateDollarSettings);
router.get("/ticket", getTicketSettings);
router.put("/ticket", updateTicketSettings);

export default router;
