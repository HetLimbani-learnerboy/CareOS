import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dropStrayOtpIndex } from "./utils/dropStrayIndex.js";
import authRoutes from "./modules/auth/auth.routes.js";
import SystemCounter from "./modules/auth/counter.model.js";
import UserIdentity from "./modules/auth/userIdentity.model.js";
import patientRoutes from './modules/patients/patient.routes.js';
import OtpVerification from "./modules/auth/otpVerification.model.js";
import doctorAvailabilityRoutes from './modules/doctor/doctorAvailability.routes.js';
import patientBookingRoutes from './modules/patients/patientBooking.routes.js';
import receptionistRoutes from './modules/receptionist/receptionist.routes.js';
import doctorprescription from './modules/doctor/doctor.routes.js';
import labtechnicianroutes from './modules/lab_technician/labTechnician.routes.js';
import pharmacistroutes from './modules/pharmacist/pharmacist.routes.js';
import nurseroutes from './modules/nurse/nurseWard.routes.js';
import nurselabroutes from './modules/nurse/nurseLab.routes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const app = express();
const MONGO_URI = process.env.MONGODB_URL;

if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGODB_URL missing in environment variables");
}

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

let isDbInitialized = false;

const connectAndInitializeDb = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1 && isDbInitialized) {
      return next();
    }

    if (mongoose.connection.readyState !== 1) {
      console.log("[Serverless Data Engine]: Connecting to MongoDB Atlas...");

      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log(`[Serverless Data Engine]: Connected to -> ${mongoose.connection.name}`);
    }
    await dropStrayOtpIndex();

    if (!isDbInitialized) {
      console.log("[Serverless Data Engine]: Verifying schema base counters...");

      await SystemCounter.findOneAndUpdate(
        { _id: "user_identity_id" },
        { $setOnInsert: { sequence_value: 0 } },
        { upsert: true }
      );

      await SystemCounter.findOneAndUpdate(
        { _id: "otp_verification_id" },
        { $setOnInsert: { sequence_value: 0 } },
        { upsert: true }
      );

      isDbInitialized = true;
      console.log("[Serverless Data Engine]: Sync and counters verified.");
    }

    next();
  } catch (error) {
    console.error("[Database Serverless Init Failure]:", error.message);
    res.status(500).json({
      status: "error",
      message: "Database system pipeline failed to initialize within serverless context.",
    });
  }
};

app.use(connectAndInitializeDb);

app.use("/api/v1/auth", authRoutes);
app.use('/api/v1/patients', patientBookingRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/doctors', doctorAvailabilityRoutes);
app.use('/api/v1/doctors', doctorprescription);
app.use('/api/v1/receptionist', receptionistRoutes);
app.use('/api/v1/lab-technician', labtechnicianroutes);
app.use('/api/v1/pharmacist', pharmacistroutes);
app.use('/api/v1/nurse', nurseroutes);
app.use('/api/v1/nurse', nurselabroutes);

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CareOS Server Engine is running cleanly on Vercel Edge Serverless...'
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Resource [${req.originalUrl}] not found on this server`
  });
});

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 8000;

  const startLocalServer = async () => {
    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log(`[Local Development]: MongoDB Connected -> ${mongoose.connection.name}`);

      app.listen(PORT, () => {
        console.log(`[Local Development]: CareOS Backend Running On http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error("[Local Boot Error]:", err.message);
    }
  };

  startLocalServer();
}

export default app;