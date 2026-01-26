import { Router } from "express";
import { getDolarRates } from "../controllers/exchangeRatesController.js";

const router = Router();

router.get("/dolar", getDolarRates);

export default router;
