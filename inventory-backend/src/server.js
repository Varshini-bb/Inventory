import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import inventoryRoutes from "./routes/inventory.routes.js";
import { startScheduledTasks } from "./services/scheduler.service.js";
import { initializeEmailService } from "./services/email.Service.js";
import { initializePushService } from "./services/push.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(__dirname, "../public/uploads");
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(uploadsPath)
);
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(" MONGO_URI is not defined");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(" Connected to MongoDB");

    // Initialize services AFTER DB connection
    initializeEmailService();
    initializePushService();
    console.log(" Email & Push services initialized");

    startScheduledTasks();
    console.log(" Scheduled tasks started");
  })
  .catch((err) => {
    console.error(" MongoDB connection error:", err);
    process.exit(1);
  });

/* =========================
   ROUTES
========================= */
app.use("/api", inventoryRoutes);

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Upload directory: ${uploadsPath}`);
  console.log(` API available at /api`);
});
