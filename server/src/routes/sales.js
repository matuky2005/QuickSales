import { Router } from "express";
import { createSale, markCadeteRendido } from "../controllers/salesController.js";

const router = Router();

router.post("/", createSale);
router.patch("/:id/cadete-rendido", markCadeteRendido);

export default router;
