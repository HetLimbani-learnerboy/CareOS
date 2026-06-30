import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    FlaskConical,
    User,
    Activity,
    Loader2,
    ClipboardList,
    RefreshCw,
    AlertCircle,
    Search
} from "lucide-react";
import "../style/EligiblePatients.css";

export default function EligiblePatients({ onTaskClaimed }) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claimLoading, setClaimLoading] = useState({});
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const getLabUserEmail = () => {
        const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

        try {
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            return userObj?.email?.trim().toLowerCase() || "lab@careos.com";
        } catch {
            return "lab@careos.com";
        }
    };

    const fetchEligiblePatients = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const res = await axios.get(`${API_BASE_URL}/api/v1/lab-technician/eligible-patients`, {
                headers: {
                    "x-user-email": getLabUserEmail(),
                    "Content-Type": "application/json"
                }
            });

            const allData = Array.isArray(res.data?.data) ? res.data.data : [];
            setPatients(allData.filter((task) => task.ownershipStatus === "available"));
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch eligible patient rosters.");
            setPatients([]);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchEligiblePatients();
    }, [fetchEligiblePatients]);

    const filteredPatients = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) return patients;

        return patients.filter((patient) => {
            const labTests = Array.isArray(patient.labTests) ? patient.labTests.join(" ") : "";

            return (
                String(patient.patientName || "").toLowerCase().includes(term) ||
                String(patient.patientEmail || "").toLowerCase().includes(term) ||
                String(patient.doctorName || "").toLowerCase().includes(term) ||
                String(patient.diagnosis || "").toLowerCase().includes(term) ||
                labTests.toLowerCase().includes(term)
            );
        });
    }, [patients, searchTerm]);

    const handleClaim = async (prescriptionId) => {
        try {
            setClaimLoading((prev) => ({ ...prev, [prescriptionId]: true }));

            await axios.post(
                `${API_BASE_URL}/api/v1/lab-technician/claim-task`,
                { prescriptionId },
                {
                    headers: {
                        "x-user-email": getLabUserEmail()
                    }
                }
            );

            setPatients((prev) => prev.filter((patient) => patient.prescriptionId !== prescriptionId));

            if (onTaskClaimed) {
                onTaskClaimed();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to assign lab task.");
        } finally {
            setClaimLoading((prev) => ({ ...prev, [prescriptionId]: false }));
        }
    };

    const SkeletonGrid = () => (
        <div className="lab-patients-grid">
            {[1, 2, 3, 4, 5, 6].map((item) => (
                <div className="lab-skeleton-card" key={item}>
                    <div className="lab-skeleton-top">
                        <div>
                            <div className="lab-skeleton-line lab-skeleton-name" />
                            <div className="lab-skeleton-line lab-skeleton-email" />
                        </div>
                        <div className="lab-skeleton-pill" />
                    </div>
                    <div className="lab-skeleton-line lab-skeleton-label" />
                    <div className="lab-skeleton-line lab-skeleton-wide" />
                    <div className="lab-skeleton-line lab-skeleton-label" />
                    <div className="lab-skeleton-line lab-skeleton-mid" />
                    <div className="lab-skeleton-pills-row">
                        <div className="lab-skeleton-test" />
                        <div className="lab-skeleton-test" />
                        <div className="lab-skeleton-test" />
                    </div>
                    <div className="lab-skeleton-footer">
                        <div className="lab-skeleton-line lab-skeleton-ref" />
                        <div className="lab-skeleton-button" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="lab-eligible-container">
            <div className="lab-eligible-header">
                <div className="lab-title-block">
                    <h2 className="lab-eligible-title">
                        <FlaskConical className="lab-icon-sky" size={24} />
                        Available Diagnostic Requests
                    </h2>
                    <p className="lab-eligible-subtitle">
                        Claim open diagnostic requests and begin lab testing workflows.
                    </p>
                </div>

                <button onClick={fetchEligiblePatients} className="lab-sync-btn" disabled={loading} type="button">
                    <RefreshCw size={14} className={loading ? "lab-spin-anim" : ""} />
                    Sync
                </button>
            </div>

            <div className="lab-toolbar-row">
                <div className="lab-search-box">
                    <Search size={16} className="lab-icon-slate" />
                    <input
                        type="text"
                        placeholder="Search patient, doctor, diagnosis, or lab panel"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="lab-count-chip">
                    {filteredPatients.length} Open Request{filteredPatients.length === 1 ? "" : "s"}
                </div>
            </div>

            {error && (
                <div className="lab-error-alert">
                    <AlertCircle size={16} />
                    <span className="lab-error-text">{error}</span>
                </div>
            )}

            {loading ? (
                <SkeletonGrid />
            ) : filteredPatients.length === 0 ? (
                <div className="lab-empty-state">
                    <Activity size={38} className="lab-pulse-anim" />
                    <h3>No Diagnostic Requests</h3>
                    <p>No outstanding diagnostic requests match the current view.</p>
                </div>
            ) : (
                <div className="lab-patients-grid">
                    {filteredPatients.map((patient, index) => {
                        const labTests = Array.isArray(patient.labTests) ? patient.labTests : [];
                        const prescriptionId = patient.prescriptionId || "";
                        const refCode = prescriptionId ? prescriptionId.slice(-6).toUpperCase() : "N/A";
                        const isClaiming = !!claimLoading[prescriptionId];

                        return (
                            <div
                                key={prescriptionId || `${patient.patientEmail}-${index}`}
                                className="lab-patient-card animate-slide-in-card"
                            >
                                <div className="lab-card-header">
                                    <div className="lab-patient-meta">
                                        <div className="lab-user-row">
                                            <User className="lab-icon-slate" size={16} />
                                            <span className="lab-patient-name">{patient.patientName || "Patient"}</span>
                                        </div>
                                        <span className="lab-patient-email">{patient.patientEmail || "No email available"}</span>
                                    </div>
                                    <span className="lab-badge-available">Available</span>
                                </div>

                                <div className="lab-info-block">
                                    <span className="lab-meta-label">Diagnosis Context</span>
                                    <p className="lab-meta-value">{patient.diagnosis || "Routine monitoring profile."}</p>
                                </div>

                                <div className="lab-info-block">
                                    <span className="lab-meta-label">Prescribing Practitioner</span>
                                    <p className="lab-meta-value lab-font-semibold">{patient.doctorName || "Doctor"}</p>
                                </div>

                                <div className="lab-panels-block">
                                    <span className="lab-meta-label">Required Lab Panels</span>
                                    <div className="lab-pill-flex">
                                        {labTests.length > 0 ? (
                                            labTests.map((test, idx) => (
                                                <span key={`${test}-${idx}`} className="lab-test-pill">
                                                    {test}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="lab-test-pill lab-muted-pill">No panels listed</span>
                                        )}
                                    </div>
                                </div>

                                <div className="lab-card-footer">
                                    <span className="lab-ref-code">Ref: {refCode}</span>
                                    <button
                                        onClick={() => handleClaim(prescriptionId)}
                                        disabled={isClaiming || !prescriptionId}
                                        className="lab-claim-btn"
                                        type="button"
                                    >
                                        {isClaiming ? (
                                            <Loader2 size={14} className="lab-spin-anim" />
                                        ) : (
                                            <ClipboardList size={14} />
                                        )}
                                        <span>{isClaiming ? "Assigning..." : "Assign to Me"}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}