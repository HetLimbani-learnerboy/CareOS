import react from "react";


export default function NurseDashboard() {
    return (
        <div className="flex">
        <NurseSlidebar />
        <div className="flex-1 p-4">
            <h1 className="text-2xl font-bold mb-4">Nurse Dashboard</h1>
            <h2>Welcome to the Nurse Dashboard</h2>
        </div>
        </div>
    );
    }
