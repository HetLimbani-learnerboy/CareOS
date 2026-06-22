import React, { useState, useEffect } from "react";
import axios from "axios";
import { User, Award, Briefcase, Phone, MapPin, FileText, Save, CheckCircle } from "lucide-react";
import "../style/DoctorProfileManagement.css";

export default function DoctorProfileManagement() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    specialization: "",
    qualification: "",
    experience_start_date: "",
    consultation_fee: 0,
    clinic_address: "",
    bio: ""
  });

  useEffect(() => {
    const localUserString = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (localUserString) {
      const parsed = JSON.parse(localUserString);
      if (parsed?.email) setEmail(parsed.email);
    }
  }, []);

  useEffect(() => {
    if (!email) return;

    const fetchProfileData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/doctors/profile?email=${encodeURIComponent(email)}`);
        const { user, profile } = res.data.data;
        
        setFormData({
          first_name: user?.firstName || "",
          last_name: user?.lastName || "",
          phone: user?.phone || "",
          specialization: profile?.specialization || "",
          qualification: profile?.qualification || "",
          experience_start_date: profile?.experience_start_date ? profile.experience_start_date.split('T')[0] : "",
          consultation_fee: profile?.consultation_fee || 0,
          clinic_address: profile?.clinic_address || "",
          bio: profile?.bio || ""
        });
      } catch (err) {
        console.error("Error reading clinical profile parameters.", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [email, API_BASE_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/api/v1/doctors/profile`, { ...formData, email });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to commit profile updates.", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && formData.first_name === "") {
    return <div className="profile-loading">Fetching Cloud Practitioner Ledger Metrics...</div>;
  }

  return (
    <div className="dr-profile-wrapper animate-fade-in">
      <div className="dr-profile-header">
        <h2>Practitioner Credentials Management</h2>
        <p>Modify public clinic information entries, specializations matrix arrays, and direct configuration fields.</p>
      </div>

      {success && (
        <div className="profile-success-toast">
          <CheckCircle size={16} /> Clinical credentials synchronized successfully.
        </div>
      )}

      <form className="dr-profile-form-grid" onSubmit={handleSubmit}>
        
        <div className="form-card-column main-inputs">
          <div className="section-legend-header"><User size={16}/> Base System Accounts (Identity Data)</div>
          
          <div className="inputs-dual-flex-row">
            <div className="profile-input-node">
              <label>First Name</label>
              <input type="text" value={formData.first_name} disabled className="disabled-field" />
            </div>
            <div className="profile-input-node">
              <label>Last Name</label>
              <input type="text" value={formData.last_name} disabled className="disabled-field" />
            </div>
          </div>

          <div className="inputs-dual-flex-row">
            <div className="profile-input-node">
              <label>Account Email</label>
              <input type="email" value={email} disabled className="disabled-field" />
            </div>
            <div className="profile-input-node">
              <label><Phone size={12}/> Contact Cell Number</label>
              <input type="text" name="phone" required value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          <div className="section-legend-header"><Award size={16}/> Clinical Competency & Core Domain</div>
          
          <div className="inputs-dual-flex-row">
            <div className="profile-input-node">
              <label>Specialization Structure</label>
              <input type="text" name="specialization" required placeholder="e.g., General Medicine, Cardiology" value={formData.specialization} onChange={handleChange} />
            </div>
            <div className="profile-input-node">
              <label>Qualification Standards</label>
              <input type="text" name="qualification" required placeholder="e.g., MBBS, MD, FRCP" value={formData.qualification} onChange={handleChange} />
            </div>
          </div>

          <div className="inputs-dual-flex-row">
            <div className="profile-input-node">
              <label><Briefcase size={12}/> Experience Commencement Date</label>
              <input type="date" name="experience_start_date" required value={formData.experience_start_date} onChange={handleChange} />
            </div>
            <div className="profile-input-node">
              <label style={{ gap: "2px" }}><span>₹</span> Base Standard Consultation Fee (INR)</label>
              <input type="number" name="consultation_fee" required value={formData.consultation_fee} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="form-card-column supplementary-inputs">
          <div className="section-legend-header"><MapPin size={16}/> Practice Facility Address</div>
          <div className="profile-input-node">
            <textarea name="clinic_address" required rows="3" placeholder="Enter explicit hospital or room office details..." value={formData.clinic_address} onChange={handleChange} />
          </div>

          <div className="section-legend-header"><FileText size={16}/> Practitioner Narrative Professional Bio</div>
          <div className="profile-input-node">
            <textarea name="bio" rows="6" placeholder="Draft summary definitions outlining background milestones, treatments profiles..." value={formData.bio} onChange={handleChange} />
          </div>

          <button type="submit" className="profile-save-cta-btn" disabled={loading}>
            <Save size={16} /> Save Profile Records
          </button>
        </div>

      </form>
    </div>
  );
}