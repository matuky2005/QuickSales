import { Router } from "express";
import { createOrGetProduct, listProducts } from "../controllers/productsController.js";

const router = Router();

router.post("/", createOrGetProduct);
router.get("/", listProducts);

export default router;
