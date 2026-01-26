import { Router } from "express";
import {
  createOrGetProduct,
  deleteProduct,
  importProducts,
  listBrands,
  listProducts,
  setProductStatus,
  updateProduct
} from "../controllers/productsController.js";

const router = Router();

router.post("/", createOrGetProduct);
router.post("/import", importProducts);
router.get("/brands", listBrands);
router.get("/", listProducts);
router.patch("/:id/status", setProductStatus);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
