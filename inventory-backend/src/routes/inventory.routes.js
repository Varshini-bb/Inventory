import express from "express";
import {
  addProduct,
  updateStock,
  getDashboard,
  getInventory,
    getStockHistory
} from "../controllers/inventory.controller.js";

const router = express.Router();

router.post("/products", addProduct);
router.post("/stock", updateStock);
router.get("/dashboard", getDashboard);
router.get("/products", getInventory);
router.get("/stock/:productId", getStockHistory);
export default router;
