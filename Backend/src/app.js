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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly link the environment configuration wrapper
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const app = express();
const MONGO_URI = process.env.MONGODB_URL;

if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGODB_URL missing in environment variables");
}

/* ==========================================================================
   GLOBAL MIDDLEWARE CONFIGURATIONS
   ========================================================================== */
app.use(
  cors({
    // Replace with your Vercel frontend URL in production
    origin: process.env.CLIENT_URL || "http://localhost:5173", 
    credentials: true,
  })
);
app.use(express.json());

/* ==========================================================================
   LAZY DATABASE INITIALIZATION MIDDLEWARE (SERVERLESS COMPLIANT)
   ========================================================================== */
let isDbInitialized = false;

const connectAndInitializeDb = async (req, res, next) => {
  try {
    // If connection is ready and pipeline initialized, proceed immediately
    if (mongoose.connection.readyState === 1 && isDbInitialized) {
      return next();
    }

    // 1. Establish/reuse connection to MongoDB Atlas cluster
    if (mongoose.connection.readyState !== 1) {
      console.log("[Serverless Data Engine]: Connecting to MongoDB Atlas...");
      await mongoose.connect(MONGO_URI);
      console.log(`[Serverless Data Engine]: Connected to -> ${mongoose.connection.name}`);
    }

    // 2. Safely initialize schemas and structural pipelines once per container boot
    if (!isDbInitialized) {
      console.log("[Serverless Data Engine]: Verifying schemas and indexes...");
      await UserIdentity.init();
      await OtpVerification.init();
      await SystemCounter.init();

      // Enforce sequence counter definitions inside Atlas
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

// Apply database connection layer to your transactional authentication routes
app.use("/api/v1/auth", connectAndInitializeDb, authRoutes);

/* ==========================================================================
   ROUTING & CORE SYSTEM CONTROLLERS
   ========================================================================== */
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

// Global Error Handler
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

/* ==========================================================================
   LOCAL RECOVERY EMULATION (ONLY RUNS OUTSIDE VERCEL CONTEXT)
   ========================================================================== */
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 8000;
  
  const startLocalServer = async () => {
    try {
      await mongoose.connect(MONGO_URI);
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

/* ==========================================================================
   CRITICAL VERCEL ROUTING BRIDGE EXPORT
   ========================================================================== */
export default app;