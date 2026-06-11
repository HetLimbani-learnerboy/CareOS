import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./modules/auth/auth.routes.js";
import SystemCounter from "./modules/auth/counter.model.js";
import UserIdentity from "./modules/auth/userIdentity.model.js";
import OtpVerification from "./modules/auth/otpVerification.model.js";

const errorHandler = (err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const app = express();
const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGODB_URL;

if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGODB_URL missing in .env");
  process.exit(1);
}

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/v1/auth", authRoutes);

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CareOS Server Engine is running cleanly...'
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Resource [${req.originalUrl}] not found on this server`
  });
});

app.use(errorHandler);

async function initializeDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected Successfully -> ${mongoose.connection.name}`);

    console.log("Compiling database schema configurations and indexes...");
    await UserIdentity.init();
    await OtpVerification.init();
    await SystemCounter.init();

    console.log("Enforcing initialization of system counters...");
    await SystemCounter.findOneAndUpdate(
      { _id: "user_identity_id" },
      { $setOnInsert: { sequence_value: 0 } },
      { upsert: true, returnDocument: "after" }
    );

    await SystemCounter.findOneAndUpdate(
      { _id: "otp_verification_id" },
      { $setOnInsert: { sequence_value: 0 } },
      { upsert: true, returnDocument: "after" }
    );

    console.log("Executing physical structural synchronization down database modules...");

    // Skip email verification for temporary marker user
    try {
      const tempUser = await UserIdentity.create({
        firstName: "Database",
        lastName: "Initializer",
        email: "init_marker@careos.internal",
        countryCode: "+91",
        phone: "0000000000",
        password: "TemporaryInitializationPassword123!",
        is_verified: true
      });
      await UserIdentity.deleteOne({ _id: tempUser._id });

      const tempOtp = await OtpVerification.create({
        email: "init_marker@careos.internal",
        otp_hash: "temporary_hash",
        expires_at: new Date(Date.now() + 1000)
      });
      await OtpVerification.deleteOne({ _id: tempOtp._id });

      console.log("Database collections and auto-increment pipelines are permanently visible on disk.");
    } catch (initError) {
      console.warn("[Database Initialization] Temporary marker creation skipped - collections may already exist");
    }

    app.listen(PORT, () => {
      console.log(`CareOS Backend Running On http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Application startup failed due to structural failure:", error.message);
    process.exit(1);
  }
}

initializeDatabase();