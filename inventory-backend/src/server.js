import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import inventoryRoutes from "./routes/inventory.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public/uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Connect to MongoDB - Remove deprecated options
mongoose.connect("mongodb://localhost:27017/inventory");

mongoose.connection.on("connected", () => {
  console.log("✅ Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

// Routes
app.use("/api", inventoryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});