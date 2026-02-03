import { Router } from "express";
import {
  createInitialDebt,
  createOrGetCustomer,
  deleteCustomer,
  getCustomerOverview,
  getCustomerStatement,
  listCustomers,
  updateCustomer
} from "../controllers/customersController.js";

const router = Router();

router.post("/", createOrGetCustomer);
router.get("/", listCustomers);
router.get("/:id/overview", getCustomerOverview);
router.get("/:id/statement", getCustomerStatement);
router.post("/:id/initial-debt", createInitialDebt);
router.patch("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
