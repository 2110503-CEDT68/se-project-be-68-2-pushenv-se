import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { notImplemented, sendSuccess } from "../../utils/http.js";
import { getMe } from "./../../controllers/user.js";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole(["user"]));

usersRouter.get("/me", getMe);

usersRouter.put("/me", (_request, response) =>
  sendSuccess(response, "Update user profile scaffolded", notImplemented("PUT /users/me"), 501),
);

usersRouter.delete("/me", (_request, response) =>
  sendSuccess(response, "Delete user account scaffolded", notImplemented("DELETE /users/me"), 501),
);
