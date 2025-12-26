import "dotenv/config"; 


import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import inventoryRoutes from "./routes/inventory.routes.js";
import { startScheduledTasks } from "./services/scheduler.service.js";
import { initializeEmailService } from "./services/email.service.js";
import { initializePushService } from "./services/push.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
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

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/inventory");

mongoose.connection.on("connected", () => {
  console.log("✅ Connected to MongoDB");

  // Initialize services
  initializeEmailService();
  initializePushService();
  console.log("✅ Email and Push services initialized");

  // Start scheduled tasks
  startScheduledTasks();
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

// Routes
app.use("/api", inventoryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadsPath}`);
  console.log(`🔔 API available at: http://localhost:${PORT}/api`);
});