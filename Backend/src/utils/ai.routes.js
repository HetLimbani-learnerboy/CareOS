import express from "express";
import {
    handleAIChatRequest,
    handleListSessions,
    handleGetSession,
    handleRenameSession,
    handleDeleteSession
} from "./ai.controller.js";
// import { protectRoute } from "../middleware/auth.middleware.js"; // uncomment and wire to your real auth

const router = express.Router();

// All routes require an authenticated user (protectRoute should populate req.user).
// If you don't have protectRoute wired here yet, resolveIdentity() in the controller
// falls back to the x-user-email / x-user-role headers the frontend already sends.
router.post("/chat", /* protectRoute, */ handleAIChatRequest);
router.get("/sessions", /* protectRoute, */ handleListSessions);
router.get("/sessions/:sessionId", /* protectRoute, */ handleGetSession);
router.patch("/sessions/:sessionId", /* protectRoute, */ handleRenameSession);
router.delete("/sessions/:sessionId", /* protectRoute, */ handleDeleteSession);

export default router;