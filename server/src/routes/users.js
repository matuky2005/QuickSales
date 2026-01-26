import { Router } from "express";
import { createUser, listUsers, updateUser } from "../controllers/usersController.js";

const router = Router();

router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id", updateUser);

export default router;
