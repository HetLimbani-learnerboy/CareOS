import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import {
    Bot, Send, User, Sparkles, RefreshCw, AlertCircle, Plus, X, Loader2,
    Shield, ChevronRight, Activity, MessageSquare, Trash2, Pencil, Check
} from "lucide-react";
import "./CareOSAssistantPage.css";

export default function CareOSAssistantPage() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const userObj = useMemo(() => {
        try {
            const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }, []);

    const userRole = userObj?.role || "Staff";
    const userEmail = userObj?.email || "";
    const userName = [userObj?.firstName, userObj?.lastName].filter(Boolean).join(" ") || userObj?.name || "CareOS User";
    const isAuthenticated = Boolean(userEmail);

    const [messages, setMessages] = useState([]);
    const [inputPrompt, setInputPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const chatBottomRef = useRef(null);

    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [loadingSessionThread, setLoadingSessionThread] = useState(false);
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState("");

    const authHeaders = useMemo(
        () => ({ "x-user-email": userEmail, "x-user-role": userRole }),
        [userEmail, userRole]
    );

    const scrollToBottom = () => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const welcomeMessage = useCallback(
        () => ({
            role: "assistant",
            content: `Hello ${userName}! 👋 I am your CareOS AI Assistant. I am trained exclusively on hospital operational workflows, patient records, billing ledgers, pharmacy, and clinical tasks. How can I assist you today?`
        }),
        [userName]
    );

    const fetchSessions = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            setLoadingSessions(true);
            const res = await axios.get(`${API_BASE_URL}/api/v1/ai/sessions`, { headers: authHeaders });
            if (res.data?.status === "success") {
                setSessions(Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch {
            setSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    }, [API_BASE_URL, authHeaders, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSessions();
            setMessages([welcomeMessage()]);
        } else {
            setMessages([welcomeMessage()]);
        }
    }, [isAuthenticated]);

    const loadSessionThread = async (sessionId) => {
        if (!isAuthenticated) return;
        try {
            setLoadingSessionThread(true);
            setErrorMsg("");
            const res = await axios.get(`${API_BASE_URL}/api/v1/ai/sessions/${sessionId}`, { headers: authHeaders });
            if (res.data?.status === "success" && res.data.data) {
                const thread = res.data.data;
                setActiveSessionId(thread._id);
                setMessages(
                    thread.messages?.length
                        ? thread.messages.map((m) => ({ role: m.role, content: m.content }))
                        : [welcomeMessage()]
                );
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to load that chat thread.");
        } finally {
            setLoadingSessionThread(false);
        }
    };

    const handleNewChat = () => {
        setActiveSessionId(null);
        setMessages([welcomeMessage()]);
        setErrorMsg("");
    };

    const handleDeleteSession = async (sessionId, e) => {
        e.stopPropagation();
        if (!isAuthenticated) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/v1/ai/sessions/${sessionId}`, { headers: authHeaders });
            setSessions((prev) => prev.filter((s) => s._id !== sessionId));
            if (activeSessionId === sessionId) handleNewChat();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to delete chat.");
        }
    };

    const startRename = (session, e) => {
        e.stopPropagation();
        setRenamingId(session._id);
        setRenameValue(session.title);
    };

    const commitRename = async (sessionId, e) => {
        e.stopPropagation();
        if (!renameValue.trim()) {
            setRenamingId(null);
            return;
        }
        try {
            await axios.patch(
                `${API_BASE_URL}/api/v1/ai/sessions/${sessionId}`,
                { title: renameValue.trim() },
                { headers: authHeaders }
            );
            setSessions((prev) => prev.map((s) => (s._id === sessionId ? { ...s, title: renameValue.trim() } : s)));
        } catch {
        } finally {
            setRenamingId(null);
        }
    };

    const roleSuggestions = useMemo(() => {
        const common = ["How do I check system health?", "Explain CareOS security policies"];
        switch (String(userRole).toLowerCase()) {
            case "receptionist":
                return [
                    "How do I process an unpaid invoice?",
                    "How do I pull up today's visited patient queue?",
                    "Explain draft vs finalized bill records"
                ];
            case "doctor":
                return [
                    "How do I issue a prescription for an admitted patient?",
                    "Where do I log clinical treatment plans?",
                    "How to request laboratory diagnostic reports?"
                ];
            case "pharmacist":
                return [
                    "How do I mark prescription items as dispensed?",
                    "How are prepaid pharmacy invoices tracked?",
                    "Where do I verify medicine quantities?"
                ];
            case "lab_technician":
            case "labtechnician":
                return [
                    "How do I upload completed lab test results?",
                    "Where do I track diagnostic report history?",
                    "Explain lab status pipeline tags"
                ];
            case "nurse":
                return [
                    "How do I record ward room administration status?",
                    "Where do I check pending lab collection tasks?",
                    "How do I update patient vital signs?"
                ];
            default:
                return [
                    "How do I view my scheduled appointments?",
                    "Where do I download my hospital billing statements?",
                    ...common
                ];
        }
    }, [userRole]);

    const handleSendMessage = async (e, customPrompt = null) => {
        if (e) e.preventDefault();
        const promptToSend = (customPrompt ?? inputPrompt).trim();
        if (!promptToSend || loading) return;

        setErrorMsg("");
        setInputPrompt("");

        const updatedMessages = [...messages, { role: "user", content: promptToSend }];
        setMessages(updatedMessages);
        setLoading(true);

        try {
            if (!isAuthenticated) {
                setErrorMsg("You're not logged in — this chat is temporary and won't be saved.");
            }

            const response = await axios.post(
                `${API_BASE_URL}/api/v1/ai/chat`,
                {
                    prompt: promptToSend,
                    sessionId: activeSessionId
                },
                { headers: authHeaders }
            );

            if (response.data?.status === "success" && response.data.data?.reply) {
                const { reply, sessionId, title } = response.data.data;
                setMessages([...updatedMessages, { role: "assistant", content: reply }]);

                if (isAuthenticated) {
                    if (!activeSessionId && sessionId) {
                        setActiveSessionId(sessionId);
                        setSessions((prev) => [
                            { _id: sessionId, title: title || "New Chat", lastMessageAt: new Date().toISOString() },
                            ...prev
                        ]);
                    } else {
                        setSessions((prev) => {
                            const rest = prev.filter((s) => s._id !== sessionId);
                            const current = prev.find((s) => s._id === sessionId);
                            return [{ ...(current || { _id: sessionId, title }), lastMessageAt: new Date().toISOString() }, ...rest];
                        });
                    }
                }
            } else {
                throw new Error("Invalid response received from CareOS AI Service.");
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to reach CareOS AI engine.");
        } finally {
            setLoading(false);
        }
    };

    const handleClearChat = () => {
        handleNewChat();
    };

    return (
        <div className="ai-page-root pr-fade-in">
            <header className="ai-header-bar">
                <div className="ai-brand-group">
                    <div className="ai-logo-icon">
                        <Bot size={22} />
                    </div>
                    <div>
                        <h1>CareOS Operational AI</h1>
                        <p>Domain-Restricted Clinical & Hospital Systems Assistant</p>
                    </div>
                </div>

                <div className="ai-header-controls">
                    <div className="ai-user-badge">
                        <Shield size={14} />
                        <span>{String(userRole).toUpperCase()}</span>
                    </div>
                    <button className="ai-reset-btn" onClick={handleClearChat} title="Start New Chat">
                        <Plus size={15} />
                        <span>New Chat</span>
                    </button>
                </div>
            </header>

            <div className="ai-workspace-container ai-workspace-with-history">
                {/* Chat History Sidebar */}
                {isAuthenticated && (
                    <aside className="ai-history-pane">
                        <div className="ai-history-head">
                            <MessageSquare size={15} />
                            <h4>Chat History</h4>
                            <button className="ai-history-refresh" onClick={fetchSessions} title="Refresh history">
                                <RefreshCw size={13} className={loadingSessions ? "ai-spin" : ""} />
                            </button>
                        </div>
                        <div className="ai-history-list">
                            {loadingSessions ? (
                                <div className="ai-history-loading">
                                    <Loader2 size={16} className="ai-spin" />
                                </div>
                            ) : sessions.length === 0 ? (
                                <p className="ai-history-empty">No previous chats yet.</p>
                            ) : (
                                sessions.map((s) => (
                                    <div
                                        key={s._id}
                                        className={`ai-history-item ${activeSessionId === s._id ? "ai-history-active" : ""}`}
                                        onClick={() => loadSessionThread(s._id)}
                                    >
                                        {renamingId === s._id ? (
                                            <div className="ai-history-rename-row" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    value={renameValue}
                                                    onChange={(e) => setRenameValue(e.target.value)}
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === "Enter" && commitRename(s._id, e)}
                                                />
                                                <button onClick={(e) => commitRename(s._id, e)}>
                                                    <Check size={13} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="ai-history-title">{s.title || "New Chat"}</span>
                                                <div className="ai-history-actions">
                                                    <button onClick={(e) => startRename(s, e)} title="Rename">
                                                        <Pencil size={12} />
                                                    </button>
                                                    <button onClick={(e) => handleDeleteSession(s._id, e)} title="Delete">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>
                )}

                {/* Sidebar Info & Role Action Chips */}
                <aside className="ai-sidebar-pane">
                    <div className="ai-info-card">
                        <div className="ai-info-head">
                            <Sparkles size={16} />
                            <h3>System Boundaries</h3>
                        </div>
                        <p>
                            This AI assistant is configured strictly for <strong>CareOS Operational Queries</strong>. It will not answer off-topic questions outside hospital workflows.
                        </p>
                        {!isAuthenticated && (
                            <p className="ai-guest-notice">
                                <AlertCircle size={13} /> You're browsing as a guest — chat history won't be saved. Log in to keep your conversations.
                            </p>
                        )}
                    </div>

                    <div className="ai-suggestions-section">
                        <h4>
                            <Activity size={15} /> Recommended Actions ({String(userRole)})
                        </h4>
                        <div className="ai-chips-list">
                            {roleSuggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="ai-chip-btn"
                                    onClick={() => handleSendMessage(null, suggestion)}
                                    disabled={loading}
                                >
                                    <span>{suggestion}</span>
                                    <ChevronRight size={14} />
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Chat Feed & Input Form */}
                <main className="ai-chat-main">
                    {errorMsg && (
                        <div className="ai-error-banner">
                            <AlertCircle size={16} />
                            <span>{errorMsg}</span>
                            <button type="button" onClick={() => setErrorMsg("")}>
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {loadingSessionThread ? (
                        <div className="ai-thread-loading">
                            <Loader2 size={28} className="ai-spin" />
                            <p>Loading conversation...</p>
                        </div>
                    ) : (
                        <div className="ai-chat-feed">
                            {messages.map((msg, index) => {
                                const isUser = msg.role === "user";
                                return (
                                    <div key={index} className={`ai-message-row ${isUser ? "ai-row-user" : "ai-row-bot"}`}>
                                        <div className={`ai-avatar ${isUser ? "avatar-user" : "avatar-bot"}`}>
                                            {isUser ? <User size={16} /> : <Bot size={16} />}
                                        </div>
                                        <div className={`ai-bubble ${isUser ? "bubble-user" : "bubble-bot"}`}>
                                            <div className="ai-bubble-sender">{isUser ? userName : "CareOS AI System"}</div>
                                            <div className="ai-bubble-text">{msg.content}</div>
                                        </div>
                                    </div>
                                );
                            })}

                            {loading && (
                                <div className="ai-message-row ai-row-bot">
                                    <div className="ai-avatar avatar-bot">
                                        <Bot size={16} />
                                    </div>
                                    <div className="ai-bubble bubble-bot ai-loading-bubble">
                                        <Loader2 size={18} className="ai-spin" />
                                        <span>Consulting CareOS operational knowledge engine...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatBottomRef} />
                        </div>
                    )}

                    <form onSubmit={handleSendMessage} className="ai-input-form">
                        <input
                            type="text"
                            placeholder="Ask CareOS AI about patient queues, billing, prescriptions, lab reports..."
                            value={inputPrompt}
                            onChange={(e) => setInputPrompt(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" className="ai-send-btn" disabled={!inputPrompt.trim() || loading}>
                            <Send size={16} />
                            <span>Send</span>
                        </button>
                    </form>
                </main>
            </div>
        </div>
    );
}