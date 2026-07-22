import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ChatSessionSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    userRole: { type: String, default: "Staff", trim: true },
    title: { type: String, default: "New Chat", trim: true },
    messages: { type: [ChatMessageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ChatSessionSchema.index({ userEmail: 1, lastMessageAt: -1 });

export default mongoose.model("ChatSession", ChatSessionSchema);