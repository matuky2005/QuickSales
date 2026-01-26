import { Router } from "express";
import {
  addPayment,
  cancelSale,
  createSale,
  listSales,
  markCadeteRendido,
  updateSale
} from "../controllers/salesController.js";

const router = Router();

router.post("/", createSale);
router.get("/", listSales);
router.patch("/:id", updateSale);
router.post("/:id/payments", addPayment);
router.patch("/:id/cadete-rendido", markCadeteRendido);
router.patch("/:id/cancel", cancelSale);

export default router;
