import { Router } from "express";
import { createOrGetCustomer, listCustomers } from "../controllers/customersController.js";

const router = Router();

router.post("/", createOrGetCustomer);
router.get("/", listCustomers);

export default router;
