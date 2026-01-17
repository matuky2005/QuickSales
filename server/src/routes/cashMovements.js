import { Router } from "express";
import { createCashMovement, listCashMovements } from "../controllers/cashMovementsController.js";

const router = Router();

router.post("/", createCashMovement);
router.get("/", listCashMovements);

export default router;
