import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    ClipboardList,
    User,
    Search,
    AlertTriangle,
    Loader2,
    Pill,
    UserCheck,
    ChevronRight,
    ShoppingBag,
    XCircle,
    PackageCheck,
    PackageX,
    BadgeIndianRupee,
    Edit2
} from "lucide-react";
import "../style/PrescriptionDispensing.css";

export default function PrescriptionDispensing() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedPres, setSelectedPres] = useState(null);
    const [alternatives, setAlternatives] = useState([]);
    const [searchingAlts, setSearchingAlts] = useState(false);
    const [activeLookupItem, setActiveLookupItem] = useState(null);
    const [dispenseConfig, setDispenseConfig] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pharmacistEmail = useMemo(() => {
        const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

        try {
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            return userObj?.email?.trim().toLowerCase() || "pharmacist@careos.com";
        } catch {
            return "pharmacist@careos.com";
        }
    }, []);

    const authHeaders = useMemo(() => ({
        "Content-Type": "application/json",
        "x-user-email": pharmacistEmail
    }), [pharmacistEmail]);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await axios.get(`${API_BASE_URL}/api/v1/pharmacist/pharmacy/dispense-queue`, {
                headers: authHeaders
            });

            if (res.data?.status === "success") {
                const data = Array.isArray(res.data.data) ? res.data.data : [];
                setQueue(data);

                if (selectedPres) {
                    const updatedSelected = data.find((item) => item.prescriptionId === selectedPres.prescriptionId);
                    if (updatedSelected) {
                        setSelectedPres(updatedSelected);
                    }
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load active dispensing queue.");
            setQueue([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const getMedicineKey = (medicine) => medicine.medicine || medicine.medicineName || "";

    const getStockBadge = (medicine) => {
        if (medicine.stockStatus === "sufficient") {
            return {
                className: "stock-good",
                icon: <PackageCheck size={13} />,
                text: `Sufficient stock (${medicine.availableQuantity || 0})`
            };
        }

        if (medicine.stockStatus === "insufficient") {
            return {
                className: "stock-low",
                icon: <AlertTriangle size={13} />,
                text: `Low stock (${medicine.availableQuantity || 0}/${medicine.quantityNeeded || 1})`
            };
        }

        return {
            className: "stock-none",
            icon: <PackageX size={13} />,
            text: "Unavailable"
        };
    };

    const handleSelectPrescription = (prescription) => {
        const initialConfig = {};

        (prescription.medicines || []).forEach((medicine) => {
            const medicineName = getMedicineKey(medicine);
            const defaultQty = Number(medicine.quantityNeeded || medicine.days || 1);

            initialConfig[medicineName] = {
                chosenAlternate: "",
                patientAllowed: true,
                customQuantity: defaultQty,
                originalData: medicine
            };
        });

        setSelectedPres(prescription);
        setAlternatives([]);
        setActiveLookupItem(null);
        setDispenseConfig(initialConfig);
    };

    const handleQuantityChange = (medicineName, value) => {
        const numericValue = Math.max(1, parseInt(value, 10) || 1);
        setDispenseConfig((prev) => ({
            ...prev,
            [medicineName]: {
                ...prev[medicineName],
                customQuantity: numericValue
            }
        }));
    };

    const handleLookupAlternatives = async (medicine) => {
        const medicineName = getMedicineKey(medicine);
        const usecase = medicine.medicineUsecase || medicine.medicine_usecase || medicine.usecase || "";

        try {
            setActiveLookupItem(medicineName);
            setSearchingAlts(true);
            setAlternatives([]);

            const endpoint = usecase
                ? `${API_BASE_URL}/api/v1/pharmacist/pharmacy/medicines/search-by-usecase`
                : `${API_BASE_URL}/api/v1/pharmacist/pharmacy/medicines/search-alternatives`;

            const params = usecase
                ? { usecase, excludeMedicine: medicineName }
                : { composition: medicine.composition || medicineName };

            const res = await axios.get(endpoint, {
                params,
                headers: authHeaders
            });

            if (res.data?.status === "success") {
                setAlternatives(Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error sourcing matching alternatives.");
        } finally {
            setSearchingAlts(false);
        }
    };

    const applyAlternative = (originalName, alternateItem) => {
        const alternateName = alternateItem.medicineName || alternateItem.medicine_name;

        setDispenseConfig((prev) => ({
            ...prev,
            [originalName]: {
                ...prev[originalName],
                chosenAlternate: alternateName,
                patientAllowed: true
            }
        }));

        setAlternatives([]);
        setActiveLookupItem(null);
    };

    const clearAlternative = (medicineName) => {
        setDispenseConfig((prev) => ({
            ...prev,
            [medicineName]: {
                ...prev[medicineName],
                chosenAlternate: ""
            }
        }));
    };

    const toggleItemAllowance = (medicineName) => {
        setDispenseConfig((prev) => ({
            ...prev,
            [medicineName]: {
                ...prev[medicineName],
                patientAllowed: !prev[medicineName]?.patientAllowed
            }
        }));
    };

    const estimatedTotal = useMemo(() => {
        if (!selectedPres) return 0;

        return (selectedPres.medicines || []).reduce((sum, medicine) => {
            const medicineName = getMedicineKey(medicine);
            const config = dispenseConfig[medicineName];

            if (config?.patientAllowed === false) return sum;

            const targetQuantity = Number(config?.customQuantity ?? (medicine.quantityNeeded || medicine.days || 1));
            const alternateName = config?.chosenAlternate;

            if (alternateName) {
                const alt = alternatives.find((item) => (item.medicineName || item.medicine_name) === alternateName);
                return sum + Number(alt?.price || 0) * targetQuantity;
            }

            if (medicine.stockStatus === "sufficient") {
                return sum + Number(medicine.unitPrice || 0) * targetQuantity;
            }

            return sum;
        }, 0);
    }, [selectedPres, dispenseConfig, alternatives]);

    const handleCheckoutDispense = async () => {
        if (!selectedPres) return;

        try {
            setIsSubmitting(true);
            setError("");

            const substitutionsPayload = Object.keys(dispenseConfig).map((key) => ({
                originalMedicine: key,
                chosenAlternate: dispenseConfig[key].chosenAlternate,
                patientAllowed: dispenseConfig[key].patientAllowed,
                customQuantity: dispenseConfig[key].customQuantity
            }));

            const res = await axios.post(
                `${API_BASE_URL}/api/v1/pharmacist/pharmacy/dispense-secure/${selectedPres.prescriptionId}`,
                {
                    substitutions: substitutionsPayload,
                    pharmacistEmail
                },
                {
                    headers: authHeaders
                }
            );

            if (res.data?.status === "success") {
                setSelectedPres(null);
                setDispenseConfig({});
                setAlternatives([]);
                setActiveLookupItem(null);
                await fetchQueue();
            }
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred during fulfillment checkout.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="dispense-container">
            <div className="dispense-header">
                <h2 className="dispense-title">
                    <ClipboardList size={22} />
                    Real-Time Prescription Dispensing Queue
                </h2>
                <p className="dispense-subtitle">
                    Verify stock, adjust quantities for partial fulfillment, apply substitutions, and generate statements.
                </p>
            </div>

            {error && (
                <div className="dispense-error-banner">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="dispense-workspace-layout">
                <div className="dispense-queue-panel">
                    <div className="panel-title-bar">
                        <span>Awaiting Fulfillment ({queue.length})</span>
                    </div>

                    {loading ? (
                        <div className="queue-cards-stack">
                            {[1, 2, 3, 4].map((item) => (
                                <div className="queue-skeleton-node" key={item}>
                                    <div className="queue-skeleton-avatar" />
                                    <div className="queue-skeleton-lines">
                                        <div className="queue-skeleton-line queue-line-name" />
                                        <div className="queue-skeleton-line queue-line-email" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : queue.length === 0 ? (
                        <div className="queue-empty-placeholder">
                            <UserCheck size={34} />
                            <h3>Queue Cleared</h3>
                            <p>No outstanding prescriptions are pending fulfillment.</p>
                        </div>
                    ) : (
                        <div className="queue-cards-stack">
                            {queue.map((item) => {
                                const isCurrent = selectedPres?.prescriptionId === item.prescriptionId;
                                const stockWarnings = (item.medicines || []).filter((medicine) => medicine.stockStatus !== "sufficient").length;

                                return (
                                    <button
                                        type="button"
                                        key={item.prescriptionId}
                                        className={`queue-patient-node ${isCurrent ? "node-active" : ""} ${item.isReentryUpdate ? "node-reentry-flash" : ""}`}
                                        onClick={() => handleSelectPrescription(item)}
                                    >
                                        <div className="node-main-details">
                                            <div className="node-avatar">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <h4>{item.patientName || "Patient"}</h4>
                                                <small>{item.patientEmail}</small>
                                                <span className="node-rx-name">{item.prescriptionName}</span>
                                            </div>
                                        </div>

                                        <div className="node-right-accessory">
                                            {stockWarnings > 0 && <span className="stock-warning-tag">{stockWarnings} issue{stockWarnings === 1 ? "" : "s"}</span>}
                                            {item.isReentryUpdate && <span className="reentry-tag">Modified</span>}
                                            <ChevronRight size={16} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="dispense-canvas-panel">
                    {selectedPres ? (
                        <div className="canvas-active-workspace animate-fade-in">
                            <div className="workspace-patient-summary">
                                <div className="summary-meta-block">
                                    <span className="summary-lbl">Active Patient Profile</span>
                                    <h3>{selectedPres.patientName || "Patient"}</h3>
                                    <p>Email: {selectedPres.patientEmail} | Phone: {selectedPres.patientPhone || "N/A"}</p>
                                </div>

                                <div className="summary-meta-block text-right">
                                    <span className="summary-lbl">Diagnosing Practitioner</span>
                                    <h4>{selectedPres.doctorName || "Doctor"}</h4>
                                    <p>Diagnosis: <span className="text-rose-700 font-medium">{selectedPres.diagnosis || "N/A"}</span></p>
                                </div>
                            </div>

                            {selectedPres.notes && (
                                <div className="workspace-clinical-notes">
                                    <strong>Practitioner Directive Notes:</strong> {selectedPres.notes}
                                </div>
                            )}

                            <div className="workspace-medications-list-wrapper">
                                <h4 className="list-heading-title">Prescribed Pharmaceutical Line Items</h4>

                                <div className="medications-grid-stack">
                                    {(selectedPres.medicines || []).map((medicine) => {
                                        const medicineName = getMedicineKey(medicine);
                                        const config = dispenseConfig[medicineName] || { chosenAlternate: "", patientAllowed: true, customQuantity: 1 };
                                        const isExcluded = config.patientAllowed === false;
                                        const stockBadge = getStockBadge(medicine);
                                        const needsAlternative = medicine.stockStatus !== "sufficient";

                                        return (
                                            <div key={medicineName} className={`medication-interactive-card ${isExcluded ? "card-item-excluded" : ""}`}>
                                                <div className="med-card-top-row">
                                                    <div className="med-title-combo">
                                                        <Pill size={16} className={isExcluded ? "text-slate-400" : "text-sky-600"} />
                                                        <div>
                                                            <h5>{medicineName}</h5>
                                                            <small>Regimen: {medicine.dosage || "N/A"} (Prescribed Order: {medicine.quantityNeeded || medicine.days || 1})</small>
                                                        </div>
                                                    </div>

                                                    <div className="med-actions-column">
                                                        <span className={`stock-status-badge ${stockBadge.className}`}>
                                                            {stockBadge.icon}
                                                            {stockBadge.text}
                                                        </span>
                                                        <button
                                                            onClick={() => toggleItemAllowance(medicineName)}
                                                            className={`item-toggle-allowance-btn ${isExcluded ? "btn-include" : "btn-exclude"}`}
                                                            type="button"
                                                        >
                                                            {isExcluded ? "Re-Include Item" : "Skip Item"}
                                                        </button>
                                                    </div>
                                                </div>

                                                {!isExcluded && (
                                                    <div className="med-card-substitution-controls">

                                                        <div className="quantity-modifier-container">
                                                            <span className="control-lbl">Dispensing Qty (Units)</span>
                                                            <input
                                                                type="number"
                                                                className="qty-override-numeric-input"
                                                                min="1"
                                                                value={config.customQuantity}
                                                                onChange={(e) => handleQuantityChange(medicineName, e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="current-allocation-status">
                                                            <span className="control-lbl">Dispensing Decision</span>
                                                            <p className="allocated-name-text">
                                                                {config.chosenAlternate ? (
                                                                    <span className="text-emerald-700 font-semibold">
                                                                        Substituted with: {config.chosenAlternate}
                                                                    </span>
                                                                ) : medicine.stockStatus === "sufficient" ? (
                                                                    <span className="text-slate-600">Original medicine will be dispensed</span>
                                                                ) : (
                                                                    <span className="text-rose-700 font-semibold">Select an alternate or skip this item</span>
                                                                )}
                                                            </p>
                                                            {config.chosenAlternate && (
                                                                <button type="button" className="clear-alt-btn" onClick={() => clearAlternative(medicineName)}>
                                                                    Clear alternate
                                                                </button>
                                                            )}
                                                        </div>

                                                        {needsAlternative && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleLookupAlternatives(medicine)}
                                                                className="trigger-composition-search-btn"
                                                            >
                                                                <Search size={12} />
                                                                <span>Find Same Use Case Alternative</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {activeLookupItem === medicineName && (
                                                    <div className="inline-alternatives-lookup-drawer animate-slide-down">
                                                        <div className="drawer-head">
                                                            <span>Available same-use-case stock alternatives</span>
                                                            <button type="button" onClick={() => { setActiveLookupItem(null); setAlternatives([]); }}>
                                                                <XCircle size={14} />
                                                            </button>
                                                        </div>

                                                        {searchingAlts ? (
                                                            <div className="drawer-loading">
                                                                <Loader2 size={16} className="dispense-spin" />
                                                                <span>Scanning pharmacy inventory...</span>
                                                            </div>
                                                        ) : alternatives.length === 0 ? (
                                                            <p className="drawer-empty-txt">No matching in-stock alternate medicine found.</p>
                                                        ) : (
                                                            <div className="drawer-options-list">
                                                                {alternatives.map((alternate) => {
                                                                    const altName = alternate.medicineName || alternate.medicine_name;
                                                                    const altQty = alternate.availableQuantity || alternate.quantity || 0;

                                                                    return (
                                                                        <div key={alternate.medicineId || alternate._id} className="alt-option-row">
                                                                            <div>
                                                                                <strong>{altName}</strong>
                                                                                <small>{alternate.company || "Company N/A"} - Stock: {altQty} units | Price: ₹{alternate.price || 0}</small>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => applyAlternative(medicineName, alternate)}
                                                                                className="select-alt-action-btn"
                                                                            >
                                                                                Apply Switch
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="workspace-checkout-action-footer">
                                <div className="checkout-estimate-box">
                                    <BadgeIndianRupee size={16} />
                                    <div>
                                        <span>Visible Estimate</span>
                                        <strong>₹{estimatedTotal.toLocaleString("en-IN")}</strong>
                                    </div>
                                </div>

                                <p className="disclaimer-txt">
                                    Final invoice is generated by backend using actual dispensed medicines and updated stock.
                                </p>

                                <button
                                    type="button"
                                    onClick={handleCheckoutDispense}
                                    disabled={isSubmitting}
                                    className="execute-checkout-grand-btn"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={16} className="dispense-spin" />
                                    ) : (
                                        <ShoppingBag size={16} />
                                    )}
                                    <span>{isSubmitting ? "Processing Transaction..." : "Dispense & Generate Invoice"}</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="canvas-idle-placeholder">
                            <ClipboardList size={48} />
                            <h3>No Prescription Selected</h3>
                            <p>Select a prescription from the queue to verify stock, choose substitutions, and complete dispensing.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}