import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import GetConsult from "./components/Consultancy/GetConsult";
import PatientRegister from "./components/common/PatientRegister";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <div className="w-full">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/getconsult" element={<GetConsult/>}/>
        <Route path='/patientregister' element={<PatientRegister/>}/>
        <Route path="/login" element={<LoginPage/>}/>
      </Routes>
      </div>
  );
}

export default App;