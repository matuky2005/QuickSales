import { Router } from "express";
import {
  createOrGetCustomer,
  getCustomerStatement,
  listCustomers
} from "../controllers/customersController.js";

const router = Router();

router.post("/", createOrGetCustomer);
router.get("/", listCustomers);
router.get("/:id/statement", getCustomerStatement);

export default router;
