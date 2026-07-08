import React, { useState, useEffect } from "react";
import axios from "axios";
import { Mail, User, Clock, FileText, Send, CheckCircle, AlertCircle, Loader2, MessageSquare, RefreshCw } from "lucide-react";
import "../style/ConsultingManager.css";

export default function ConsultingManager() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

    const getUserData = () => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return "";
        try {
            const userObj = JSON.parse(storedUser);
            return userObj?.email?.trim().toLowerCase();
        } catch {
            return "";
        }
    };

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/v1/receptionist/consultation/list`, {
                headers: { "x-user-email": getUserData() }
            });
            if (res.data?.status === "success") {
                setRequests(res.data.data || []);
            }
        } catch (err) {
            setError("Failed to fetch inbound consultancy tickets ledger.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, currentStatus, newStatus) => {
        if (currentStatus === newStatus) return;
        try {
            setUpdatingId(id);
            const res = await axios.patch(
                `${API_BASE_URL}/api/v1/receptionist/consultation/${id}/status`,
                { status: newStatus },
                { headers: { "x-user-email": getUserData() } }
            );
            if (res.data?.status === "success") {
                setRequests((prev) =>
                    prev.map((req) => (req._id === id ? { ...req, status: newStatus } : req))
                );
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to alter configuration pipeline status state.");
        } finally {
            setUpdatingId(null);
        }
    };

    useEffect(() => {
        fetchConsultations();
    }, []);

    return (
        <div className="cm-container">
            <div className="cm-header">
                <h2><MessageSquare size={22} /> Inbound Consultancy Strategy Channels</h2>
                <p>Review customer corporate infrastructure migration specs and send outbound confirmation replies directly.</p>
            </div>

            {error && <div className="cm-error"><AlertCircle size={16} /> {error}</div>}

            {loading ? (
                <div className="cm-loading"><Loader2 className="cm-spin" /></div>
            ) : requests.length === 0 ? (
                <div className="cm-empty">No consultancy request logs found in your database pipeline.</div>
            ) : (
                <div className="cm-list-stack">
                    {requests.map((item) => (
                        <div key={item._id} className={`cm-card-node ${item.status === "Responded" ? "resolved" : item.status === "Archived" ? "archived" : "pending"}`}>
                            <div className="cm-card-header">
                                <div className="cm-user-info">
                                    <div className="cm-avatar"><User size={14} /></div>
                                    <div>
                                        <h4>{item.firstName} {item.lastName}</h4>
                                        <span>{item.email}</span>
                                    </div>
                                </div>
                                <div className="cm-status-interactive-wrapper">
                                    {updatingId === item._id ? (
                                        <Loader2 size={14} className="cm-spin text-sky-600" />
                                    ) : (
                                        <select
                                            value={item.status}
                                            onChange={(e) => handleStatusChange(item._id, item.status, e.target.value)}
                                            className="cm-inline-status-select"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Responded">Responded</option>
                                            <option value="Archived">Archived</option>
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="cm-message-body">
                                <h5>Inquiry System Targets Specs:</h5>
                                <p>{item.message}</p>
                            </div>

                            <div className="cm-card-footer">
                                <div className="cm-time"><Clock size={12} /> Received: {new Date(item.createdAt).toLocaleDateString()}</div>
                                <div className="cm-actions-group">
                                    <button
                                        onClick={() => {
                                            const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(item.email)}`;
                                            window.open(gmailLink, "_blank", "noopener,noreferrer");
                                        }}
                                        className="cm-btn-reply"
                                    >
                                        <Send size={12} />
                                        Email Reply
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}