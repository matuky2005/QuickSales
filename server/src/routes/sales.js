import { Router } from "express";
import {
  addPayment,
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

export default router;
