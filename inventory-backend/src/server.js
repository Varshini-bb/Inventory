import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import inventoryRoutes from "./routes/inventory.routes.js";
import notificationService from "./services/notificationService.js";
import emailService from "./services/emailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
const uploadsPath = path.join(__dirname, "../public/uploads");
app.use("/uploads", (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsPath));

console.log("📁 Serving static files from:", uploadsPath);

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/inventory");

mongoose.connection.on("connected", async () => {
  console.log("✅ Connected to MongoDB");
  
  // Initialize email service
  try {
    await emailService.initialize();
    console.log("✅ Email service initialized");
  } catch (error) {
    console.error("❌ Email service initialization failed:", error.message);
  }
  
  // Run initial notification check (optional, can be commented out)
  setTimeout(async () => {
    try {
      console.log("🔔 Running initial notification check...");
      await notificationService.runAllChecks();
    } catch (error) {
      console.error("❌ Initial notification check failed:", error.message);
    }
  }, 2000);
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

// Routes - All routes under /api
app.use("/api", inventoryRoutes);

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// Setup Cron Jobs
// Run notification checks every hour
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Running hourly notification check...');
  try {
    await notificationService.runAllChecks();
  } catch (error) {
    console.error('❌ Hourly notification check failed:', error.message);
  }
});

// Run notification checks every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Running daily notification check...');
  try {
    await notificationService.runAllChecks();
  } catch (error) {
    console.error('❌ Daily notification check failed:', error.message);
  }
});

console.log('📅 Cron jobs scheduled:');
console.log('   - Hourly checks: Every hour');
console.log('   - Daily checks: 9:00 AM every day');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadsPath}`);
  console.log(`🖼️  Test image access: http://localhost:${PORT}/uploads/test.jpg`);
  console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
  console.log(`🔔 Notifications: http://localhost:${PORT}/api/notifications`);
});