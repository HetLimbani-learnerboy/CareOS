import React, { useState } from "react";

export default function ProfileManagement() {
  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@careos.com",
    phone: "9876543210",
    bloodGroup: "O+",
    emergencyContact: "Jane Doe (9876543211)"
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmission = (e) => {
    e.preventDefault();
    alert("Profile configurations compiled and validated locally inside state cache!");
  };

  return (
    <div className="view-fade-in">
      <div className="view-header">
        <h2>Profile Management</h2>
        <p>Review personal identity parameters, contact coordinates, and security nodes.</p>
      </div>

      <div className="data-panel-card">
        <form className="portal-interactive-form" onSubmit={handleFormSubmission}>
          <div className="form-double-column">
            <div className="form-input-node">
              <label>First Name</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleFormChange} />
            </div>
            <div className="form-input-node">
              <label>Last Name</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleFormChange} />
            </div>
          </div>

          <div className="form-double-column">
            <div className="form-input-node">
              <label>Email Contact Coordinates</label>
              <input type="email" name="email" value={formData.email} onChange={handleFormChange} />
            </div>
            <div className="form-input-node">
              <label>Contact Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleFormChange} />
            </div>
          </div>

          <div className="form-double-column">
            <div className="form-input-node">
              <label>Blood Group Reference</label>
              <input type="text" name="bloodGroup" value={formData.bloodGroup} disabled />
            </div>
            <div className="form-input-node">
              <label>Emergency Contact Proxies</label>
              <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleFormChange} />
            </div>
          </div>

          <button type="submit" className="form-save-action-btn">
            Commit Identity Modifications
          </button>
        </form>
      </div>
    </div>
  );
}