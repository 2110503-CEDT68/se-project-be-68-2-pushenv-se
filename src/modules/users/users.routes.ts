import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { getMe, updateMe, deleteMe } from "./../../controllers/user.controller.js";
import { upload } from "./../../utils/uploads.js";

export const usersRouter = Router();

// usersRouter.use(requireAuth, requireRole(["user"]));

usersRouter.get("/me", getMe);

usersRouter.put("/me", upload.single("avatar"), updateMe);

usersRouter.delete("/me", deleteMe);