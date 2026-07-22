import {
  processCareOSAIChat,
  listUserChatSessions,
  getChatSessionById,
  renameChatSession,
  deleteChatSession
} from "../service/ai.service.js";

// Resolve the authenticated identity strictly from server-trusted auth (req.user set by
// your auth middleware), falling back to headers only if you don't yet have JWT middleware
// wired on this route. Never trust req.body for identity — a client could impersonate
// another user's email otherwise.
const resolveIdentity = (req) => ({
  email: req.user?.email || req.headers["x-user-email"] || "",
  role: req.user?.role || req.headers["x-user-role"] || "Staff"
});

export const handleAIChatRequest = async (req, res, next) => {
  try {
    const { prompt, sessionId } = req.body;
    const { email, role } = resolveIdentity(req);

    if (!email) {
      return res.status(401).json({ status: "fail", message: "You must be logged in to use the CareOS AI Assistant." });
    }
    if (!prompt) {
      return res.status(400).json({ status: "fail", message: "Prompt is required." });
    }

    const data = await processCareOSAIChat({ sessionId, prompt, userEmail: email, userRole: role });

    return res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const handleListSessions = async (req, res, next) => {
  try {
    const { email } = resolveIdentity(req);
    if (!email) {
      return res.status(401).json({ status: "fail", message: "You must be logged in to view chat history." });
    }
    const data = await listUserChatSessions(email);
    return res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const handleGetSession = async (req, res, next) => {
  try {
    const { email } = resolveIdentity(req);
    if (!email) {
      return res.status(401).json({ status: "fail", message: "You must be logged in to view chat history." });
    }
    const data = await getChatSessionById(req.params.sessionId, email);
    return res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const handleRenameSession = async (req, res, next) => {
  try {
    const { email } = resolveIdentity(req);
    if (!email) {
      return res.status(401).json({ status: "fail", message: "You must be logged in." });
    }
    const data = await renameChatSession(req.params.sessionId, email, req.body.title);
    return res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const handleDeleteSession = async (req, res, next) => {
  try {
    const { email } = resolveIdentity(req);
    if (!email) {
      return res.status(401).json({ status: "fail", message: "You must be logged in." });
    }
    const data = await deleteChatSession(req.params.sessionId, email);
    return res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};