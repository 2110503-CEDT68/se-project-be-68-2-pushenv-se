import { Router } from "express";
import { notImplemented, sendSuccess } from "../../utils/http.js";

export const authRouter = Router();

authRouter.post("/register", (_request, response) =>
  sendSuccess(response, "Register route scaffolded", notImplemented("POST /auth/register"), 501),
);

authRouter.post("/login", (_request, response) =>
  sendSuccess(response, "Login route scaffolded", notImplemented("POST /auth/login"), 501),
);
