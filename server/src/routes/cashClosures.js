import { Router } from "express";
import { createCashClosure, getCashClosure } from "../controllers/cashClosuresController.js";

const router = Router();

router.post("/", createCashClosure);
router.get("/", getCashClosure);

export default router;
