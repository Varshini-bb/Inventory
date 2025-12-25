import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  addProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  updateStock,
  getDashboard,
  getInventory,
  getStockHistory,
  uploadImages,
  deleteImage,
  generateBarcode,
} from "../controllers/inventory.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads directory:", uploadsDir);
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `product-${Date.now()}${path.extname(file.originalname)}`;
    console.log("📸 Uploading file:", uniqueName);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      console.log("✅ File accepted:", file.originalname);
      return cb(null, true);
    } else {
      console.log("❌ File rejected:", file.originalname);
      cb(new Error("Images only! Allowed: jpeg, jpg, png, gif, webp"));
    }
  },
});

// Dashboard
router.get("/dashboard", getDashboard);

// Products
router.get("/products", getInventory);
router.get("/products/:id", getProduct);
router.post("/products", addProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.post("/products/:id/duplicate", duplicateProduct);

// Product Images - Add error handling
router.post("/products/:id/images", (req, res, next) => {
  console.log("📤 Image upload request received for product:", req.params.id);
  
  upload.array("images", 5)(req, res, (err) => {
    if (err) {
      console.error("❌ Multer error:", err.message);
      return res.status(400).json({ error: err.message });
    }
    
    console.log("📁 Files received:", req.files?.length || 0);
    next();
  });
}, uploadImages);

router.delete("/products/:id/images/:imageUrl", deleteImage);

// Barcode
router.post("/products/:id/generate-barcode", generateBarcode);

// Stock Management
router.post("/stock", updateStock);
router.get("/stock/:productId", getStockHistory);

export default router;