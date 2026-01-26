import { Router } from "express";
import {
  createInitialDebt,
  createOrGetCustomer,
  getCustomerStatement,
  listCustomers
} from "../controllers/customersController.js";

const router = Router();

router.post("/", createOrGetCustomer);
router.get("/", listCustomers);
router.get("/:id/statement", getCustomerStatement);
router.post("/:id/initial-debt", createInitialDebt);

export default router;
