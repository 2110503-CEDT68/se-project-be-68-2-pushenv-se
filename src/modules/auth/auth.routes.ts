import { Router } from "express";
import { notImplemented, sendSuccess } from "../../utils/http.js";
import { register, login } from "../../controllers/auth.controller.js";
import { requireAuth } from "../../middlewares/auth.js";

export const authRouter = Router();

authRouter.post("/register", requireAuth, register);

authRouter.post("/login", requireAuth, login);
