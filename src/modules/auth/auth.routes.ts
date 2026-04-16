import { Router } from "express";
import { register, login, getAuthProfile, updateAuthProfile, changePassword } from "../../controllers/auth.controller.js";
import { requireAuth } from "../../middlewares/auth.js";
import { upload } from "../../utils/uploads.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);

authRouter.get("/me", requireAuth, getAuthProfile);
authRouter.put("/me", requireAuth, upload.single("avatar"), updateAuthProfile);
authRouter.post("/change-password", requireAuth, changePassword);
