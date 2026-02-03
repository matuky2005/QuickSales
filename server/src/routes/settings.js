import { Router } from "express";
import { getDollarSettings, updateDollarSettings } from "../controllers/settingsController.js";

const router = Router();

router.get("/dolar", getDollarSettings);
router.put("/dolar", updateDollarSettings);

export default router;
