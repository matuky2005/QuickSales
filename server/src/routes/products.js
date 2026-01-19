import { Router } from "express";
import { createOrGetProduct, listProducts, updateProduct } from "../controllers/productsController.js";

const router = Router();

router.post("/", createOrGetProduct);
router.get("/", listProducts);
router.patch("/:id", updateProduct);

export default router;
