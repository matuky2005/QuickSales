import { Router } from "express";
import {
  createOrGetProduct,
  deleteProduct,
  listBrands,
  listProducts,
  setProductStatus,
  updateProduct
} from "../controllers/productsController.js";

const router = Router();

router.post("/", createOrGetProduct);
router.get("/brands", listBrands);
router.get("/", listProducts);
router.patch("/:id/status", setProductStatus);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
