import { Routes, Route } from "react-router-dom";
import LandingPage from "./modules/landing/pages/LandingPage";
import GetConsult from "./modules/landing/common/GetConsult";
import PatientRegister from "./modules/auth/pages/PatientRegister";
import LoginPage from "./modules/auth/pages/LoginPage";
import PatientDashboardMain from "./modules/patient/pages/PatientDashboardMain";
import DoctorDashboardMain from "./modules/doctor/pages/DoctorDashboardMain";
import ReceptionistDashboardMain from "./modules/receptionist/page/DashboardOverview";
import LabTechnicianDashboardMain from "./modules/lab_technician/page/LabTechnicianDashboardMain";
import PharmasictDashboardMain from "./modules/pharmacist/pages/PharmasictDashboardMain";
import NurseDashboardMain from './modules/nurse/pages/NurseDashboardMain';
import ForgotPassword from "./modules/auth/pages/ForgotPassword";
import ProtectedRoute from "./modules/auth/components/ProtectedRoute";
import ApiDocs from "./modules/landing/pages/ApiDocs";

function App() {
  return (
    <div className="w-full">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/getconsult" element={<GetConsult />} />
        <Route path="/patientregister" element={<PatientRegister />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/api-docs" element={<ApiDocs />} />

        <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
          <Route path="/patient-dashboard" element={<PatientDashboardMain />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
          <Route path="/doctor-dashboard" element={<DoctorDashboardMain />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["receptionist"]} />}>
          <Route path="/receptionist-dashboard" element={<ReceptionistDashboardMain />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["lab_technician"]} />}>
          <Route path="/lab_technician-dashboard" element={<LabTechnicianDashboardMain />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["pharmacist"]} />}>
          <Route path="/pharmacist-dashboard" element={<PharmasictDashboardMain />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["nurse"]} />}>
          <Route path="/nurse-dashboard" element={<NurseDashboardMain />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;