import { Routes, Route } from "react-router-dom";
import LandingPage from "./modules/landing/pages/LandingPage";
import GetConsult from "./modules/landing/common/GetConsult";
import PatientRegister from "./modules/auth/pages/PatientRegister";
import LoginPage from "./modules/auth/pages/LoginPage";
import PatientDashboardMain from "./modules/patient/pages/PatientDashboardMain";
import DoctorDashboardMain from "./modules/doctor/pages/DoctorDashboardMain";
import ReceptionistDashboardMain from "./modules/receptionist/page/DashboardOverview";
import LabTechnicianDashboardMain from "./modules/lab_technician/page/LabTechnicianDashboardMain";
import ForgotPassword from "./modules/auth/pages/ForgotPassword";

function App() {
  return (
    <div className="w-full">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/getconsult" element={<GetConsult />} />
        <Route path='/patientregister' element={<PatientRegister />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/patient-dashboard" element={<PatientDashboardMain/>}/>
        <Route path="/doctor-dashboard" element={<DoctorDashboardMain/>}/>
        <Route path="/receptionist-dashboard" element={<ReceptionistDashboardMain/>}/>
        <Route path="/lab_technician-dashboard" element={<LabTechnicianDashboardMain/>}/>
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </div>
  );
}

export default App;