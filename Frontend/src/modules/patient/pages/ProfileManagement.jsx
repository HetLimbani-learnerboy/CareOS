import React, { useState, useEffect } from "react";
import axios from "axios";
import { User, Phone, Calendar, Shield, Heart, MapPin, Camera, Save } from "lucide-react";
import "../style/ProfileManagement.css";

export default function ProfileManagement() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [calculatedAge, setCalculatedAge] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });

    const [formData, setFormData] = useState({
        first_name: "", last_name: "", email: "",
        phone: "", profile_image: "",
        birth_date: "", gender: "Male", blood_group: "", address: "",
        emergency_contact_name1: "", emergency_contact_phoneno1: "", emergency_contact_relation1: "",
        emergency_contact_name2: "", emergency_contact_phoneno2: "", emergency_contact_relation2: "",
        insurance_provider: "", insurance_policynumber: ""
    });

    useEffect(() => {
        const fetchProfilePayload = async () => {
            try {
                const localUserString = localStorage.getItem("user") || sessionStorage.getItem("user");
                let storedEmail = "";

                let parsedUser = null;

                if (localUserString) {
                    parsedUser = JSON.parse(localUserString);
                    storedEmail = parsedUser?.email;
                }

                if (!storedEmail) {
                    setMessage({ type: "error", text: "Session error: Active user email not found in browser storage." });
                    setLoading(false);
                    return;
                }

                const res = await axios.get(`${API_BASE_URL}/api/v1/patients/profile?email=${encodeURIComponent(storedEmail)}`);

                const { identity, medical } = res.data.data;

                const loadedData = {
                    first_name: identity?.firstName || parsedUser?.firstName || "",
                    last_name: identity?.lastName || parsedUser?.lastName || "",
                    email: identity?.email || storedEmail,
                    phone: identity?.phone || "",
                    profile_image: identity?.profile_image || "",
                    birth_date: medical?.birth_date ? medical.birth_date.split("T")[0] : "",
                    gender: medical?.gender || "Male",
                    blood_group: medical?.blood_group || "",
                    address: medical?.address || "",
                    emergency_contact_name1: medical?.emergency_contact_name1 || "",
                    emergency_contact_phoneno1: medical?.emergency_contact_phoneno1 || "",
                    emergency_contact_relation1: medical?.emergency_contact_relation1 || "",
                    emergency_contact_name2: medical?.emergency_contact_name2 || "",
                    emergency_contact_phoneno2: medical?.emergency_contact_phoneno2 || "",
                    emergency_contact_relation2: medical?.emergency_contact_relation2 || "",
                    insurance_provider: medical?.insurance_provider || "",
                    insurance_policynumber: medical?.insurance_policynumber || ""
                };

                setFormData(loadedData);
                if (loadedData.birth_date) evalAge(loadedData.birth_date);
            } catch (err) {
                setMessage({ type: "error", text: "Failed to compile profile data schemas from backend variables." });
            } finally {
                setLoading(false);
            }
        };
        fetchProfilePayload();
    }, [API_BASE_URL]);

    const evalAge = (birthString) => {
        if (!birthString) return;
        const today = new Date();
        const birthDate = new Date(birthString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        setCalculatedAge(age >= 0 ? `${age} Years Old` : "Invalid Date");
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === "birth_date") evalAge(value);
    };

    const triggerImageUpload = () => {
        const fallbackUrl = prompt("Enter online asset image URL mockup path:", formData.profile_image);
        if (fallbackUrl !== null) {
            setFormData(prev => ({ ...prev, profile_image: fallbackUrl }));
        }
    };

    const handleProfileFormSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage({ type: "", text: "" });

            await axios.put(`${API_BASE_URL}/api/v1/patients/profile`, formData);

            setMessage({ type: "success", text: "All record updates committed successfully!" });
            alert("Profile information updated successfully.");
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.message || "Internal mutation error." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="profile-loading">Assembling Patient Data Records...</div>;

    return (
        <div className="profile-management-view">
            <form onSubmit={handleProfileFormSubmit} className="profile-form-wrapper">

                <div className="profile-hero-card">
                    <div className="avatar-uploader-container">
                        {formData.profile_image ? (
                            <img src={formData.profile_image} alt="Patient Avatar" className="avatar-circle-img" />
                        ) : (
                            <div className="avatar-fallback-initials">
                                {formData.first_name ? formData.first_name[0] : ""}{formData.last_name ? formData.last_name[0] : ""}
                            </div>
                        )}
                        <button type="button" onClick={triggerImageUpload} className="avatar-edit-overlay" title="Modify Image">
                            <Camera size={14} /> Edit
                        </button>
                    </div>

                    <div className="hero-meta-details">
                        <h2>{formData.first_name} {formData.last_name}</h2>
                        <p className="hero-subtext-email">{formData.email}</p>
                        {calculatedAge && <span className="hero-age-badge">{calculatedAge}</span>}
                    </div>
                </div>

                {message.text && (
                    <div className={`profile-alert ${message.type === "error" ? "error-style" : "success-style"}`}>
                        {message.text}
                    </div>
                )}

                <div className="profile-form-section">
                    <div className="section-title-header"><User size={16} /> Identity Parameters</div>
                    <div className="form-grid-layout">
                        <div className="input-field-block field-disabled">
                            <label>First Name</label>
                            <input type="text" value={formData.first_name} readOnly />
                        </div>
                        <div className="input-field-block field-disabled">
                            <label>Last Name</label>
                            <input type="text" value={formData.last_name} readOnly />
                        </div>
                        <div className="input-field-block field-disabled">
                            <label>Email Address</label>
                            <input type="email" value={formData.email} readOnly />
                        </div>
                        <div className="input-field-block">
                            <label>Contact Number <span className="req-asterisk">*</span></label>
                            <div className="input-icon-group">
                                <Phone size={14} className="inner-icon" />
                                <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-form-section">
                    <div className="section-title-header"><Calendar size={16} /> Demographics & Clinical Metrics</div>
                    <div className="form-grid-layout">
                        <div className="input-field-block">
                            <label>Date of Birth <span className="req-asterisk">*</span></label>
                            <input type="date" name="birth_date" required value={formData.birth_date} onChange={handleInputChange} />
                        </div>
                        <div className="input-field-block">
                            <label>Gender <span className="req-asterisk">*</span></label>
                            <select name="gender" value={formData.gender} onChange={handleInputChange}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="input-field-block">
                            <label>Blood Group <span className="req-asterisk">*</span></label>
                            <input type="text" name="blood_group" required placeholder="O+" maxLength={5} value={formData.blood_group} onChange={handleInputChange} />
                        </div>
                        <div className="input-field-block full-width-grid">
                            <label>Residential Address <span className="req-asterisk">*</span></label>
                            <div className="input-icon-group">
                                <MapPin size={14} className="inner-icon" />
                                <input type="text" name="address" required placeholder="Street Line..." maxLength={200} value={formData.address} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-form-section">
                    <div className="section-title-header"><Heart size={16} /> Emergency Contact Matrix</div>

                    <h4 className="nested-sub-label-heading">Primary Contact (Required)</h4>
                    <div className="form-grid-layout">
                        <div className="input-field-block">
                            <label>Full Name <span className="req-asterisk">*</span></label>
                            <input type="text" name="emergency_contact_name1" required value={formData.emergency_contact_name1} onChange={handleInputChange} />
                        </div>
                        <div className="input-field-block">
                            <label>Phone Number <span className="req-asterisk">*</span></label>
                            <input type="tel" name="emergency_contact_phoneno1" required value={formData.emergency_contact_phoneno1} onChange={handleInputChange} />
                        </div>
                        <div className="input-field-block">
                            <label>Relationship <span className="req-asterisk">*</span></label>
                            <input type="text" name="emergency_contact_relation1" required placeholder="e.g. Spouse" value={formData.emergency_contact_relation1} onChange={handleInputChange} />
                        </div>
                    </div>

                    <h4 className="nested-sub-label-heading" style={{ marginTop: '16px' }}>Secondary Contact (Optional)</h4>
                    <div className="form-grid-layout">
                        <div className="input-field-block">
                            <label>Full Name</label>
                            <input type="text" name="emergency_contact_name2" value={formData.emergency_contact_name2} onChange={handleInputChange} />
                        </div>
                        <div className="input-field-block">
                            <label>Phone Number</label>
                            <input type="tel" name="emergency_contact_phoneno2" value={formData.emergency_contact_phoneno2} onChange={handleInputChange} />
                        </div>
                        <div className="input-field-block">
                            <label>Relationship</label>
                            <input type="text" name="emergency_contact_relation2" value={formData.emergency_contact_relation2} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>

                <div className="profile-form-section">
                    <div className="section-title-header"><Shield size={16} /> Insurance Framework Context</div>
                    <div className="form-grid-layout">
                        <div className="input-field-block">
                            <label>Insurance Provider</label>
                            <input type="text" name="insurance_provider" placeholder="Provider Name" value={formData.insurance_provider} onChange={handleInputChange} />
                        </div>
                        <div className="input-field-block">
                            <label>Policy Number</label>
                            <input type="text" name="insurance_policynumber" placeholder="Policy ID" value={formData.insurance_policynumber} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={saving} className="profile-save-action-btn">
                    <Save size={16} /> {saving ? "Saving Changes..." : "Commit Profile Changes"}
                </button>

            </form>
        </div>
    );
}