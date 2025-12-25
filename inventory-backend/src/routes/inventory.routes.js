import express from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  uploadImages,
  deleteImage,
  generateBarcode,
  getDashboard,
  getLowStockReport,
  getStockValueReport,
  getStockMovementsReport,
  exportToCSV,
} from "../controllers/inventory.controller.js";
import notificationRoutes from "./notification.routes.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../public/uploads");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `product-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// Dashboard
router.get("/dashboard", getDashboard);

// Reports
router.get("/reports/low-stock", getLowStockReport);
router.get("/reports/stock-value", getStockValueReport);
router.get("/reports/stock-movements", getStockMovementsReport);
router.get("/reports/export-csv", exportToCSV);

// Products CRUD
router.get("/products", getProducts);
router.get("/products/:id", getProduct);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Product actions
router.post("/products/:id/duplicate", duplicateProduct);
router.post("/products/:id/images", upload.array("images", 5), uploadImages);
router.delete("/products/:id/images/:imageUrl", deleteImage);
router.post("/products/:id/generate-barcode", generateBarcode);

// Notifications routes
router.use("/", notificationRoutes);

export default router;