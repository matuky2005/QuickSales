import { Router } from "express";
import { createCreditNote, listCreditNotes } from "../controllers/creditNotesController.js";

const router = Router();

router.post("/", createCreditNote);
router.get("/", listCreditNotes);

export default router;
