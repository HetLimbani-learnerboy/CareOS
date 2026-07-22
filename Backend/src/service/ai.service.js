import mongoose from "mongoose";
import Groq from "groq-sdk";
import ChatSession from "../utils/chatSession.model.js";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const CAREOS_SYSTEM_PROMPT = `
You are the official CareOS Healthcare & Hospital Operations AI Assistant.
Your sole job is to assist hospital staff (Doctors, Receptionists, Pharmacists, Lab Technicians, Nurses, Administrators) and Patients with CareOS operations.

OPERATIONAL BOUNDARIES & GUARDRAILS:
1. ONLY answer questions related to CareOS hospital management, patient profiles, appointment queues, billing ledgers, pharmacy dispensing, lab history tracking, medical admissions, ward management, and clinical workflows.
2. If the user asks a question completely unrelated to healthcare, medicine, or CareOS hospital operations (e.g., general software coding outside CareOS, movies, sports, finance, general trivia), politely decline by stating:
   "I am the CareOS AI Assistant and am restricted to answering CareOS hospital operations and healthcare-related inquiries only."
3. Keep responses structured, professional, clear, and easy to read.
`;

const objectId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid chat session id.");
    return new mongoose.Types.ObjectId(id);
};

const deriveTitle = (text) => {
    const clean = String(text || "").trim().replace(/\s+/g, " ");
    if (!clean) return "New Chat";
    return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean;
};

const MAX_HISTORY_TURNS = 20; // last N messages sent to the model, keeps token usage bounded

/**
 * Fetch all chat sessions (list view: id, title, lastMessageAt) for a user.
 * Requires an authenticated email — no email, no data, ever.
 */
export const listUserChatSessions = async (userEmail) => {
    const email = String(userEmail || "").trim().toLowerCase();
    if (!email) throw new Error("Authenticated user email is required to load chat history.");

    const sessions = await ChatSession.find({ userEmail: email })
        .select("_id title lastMessageAt createdAt")
        .sort({ lastMessageAt: -1 })
        .lean();

    return sessions;
};

/**
 * Fetch a single chat session's full message thread, scoped to the requesting user
 * so no one can read another user's session by guessing an id.
 */
export const getChatSessionById = async (sessionId, userEmail) => {
    const email = String(userEmail || "").trim().toLowerCase();
    if (!email) throw new Error("Authenticated user email is required to load chat history.");

    const session = await ChatSession.findOne({ _id: objectId(sessionId), userEmail: email }).lean();
    if (!session) throw new Error("Chat session not found for this user.");
    return session;
};

/**
 * Core chat turn handler.
 * - If sessionId is provided, appends to that existing session (continuing it).
 * - If not, creates a brand-new session ("New Chat" flow).
 * - Always persists both the user message and the assistant reply.
 * - Never stores anything without a verified user email (no anonymous persistence).
 */
export const processCareOSAIChat = async ({ sessionId, prompt, userEmail, userRole }) => {
    const email = String(userEmail || "").trim().toLowerCase();
    if (!email) throw new Error("A logged-in user email is required to use the CareOS AI Assistant.");
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        throw new Error("Prompt is required.");
    }

    let session;
    if (sessionId) {
        session = await ChatSession.findOne({ _id: objectId(sessionId), userEmail: email });
        if (!session) throw new Error("Chat session not found for this user.");
    } else {
        session = new ChatSession({
            userEmail: email,
            userRole: userRole || "Staff",
            title: deriveTitle(prompt),
            messages: []
        });
    }

    const recentHistory = session.messages.slice(-MAX_HISTORY_TURNS);

    const messages = [
        {
            role: "system",
            content: `${CAREOS_SYSTEM_PROMPT}\nActive User Session: Role=${userRole || "Staff"}, Email=${email}`
        },
        ...recentHistory.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: prompt }
    ];

    const chatCompletion = await groq.chat.completions.create({
        messages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 1024
    });

    const replyContent =
        chatCompletion.choices?.[0]?.message?.content || "I am unable to process your request at this moment.";

    session.messages.push({ role: "user", content: prompt, createdAt: new Date() });
    session.messages.push({ role: "assistant", content: replyContent, createdAt: new Date() });
    session.lastMessageAt = new Date();
    if (!sessionId) session.title = deriveTitle(prompt);

    await session.save();

    return {
        sessionId: session._id,
        title: session.title,
        reply: replyContent,
        lastMessageAt: session.lastMessageAt
    };
};

export const renameChatSession = async (sessionId, userEmail, title) => {
    const email = String(userEmail || "").trim().toLowerCase();
    if (!email) throw new Error("Authenticated user email is required.");

    const session = await ChatSession.findOneAndUpdate(
        { _id: objectId(sessionId), userEmail: email },
        { title: deriveTitle(title) },
        { new: true }
    );
    if (!session) throw new Error("Chat session not found for this user.");
    return session;
};


export const deleteChatSession = async (sessionId, userEmail) => {
    const email = String(userEmail || "").trim().toLowerCase();
    if (!email) throw new Error("Authenticated user email is required.");

    const result = await ChatSession.findOneAndDelete({ _id: objectId(sessionId), userEmail: email });
    if (!result) throw new Error("Chat session not found for this user.");
    return { deleted: true, sessionId };
};