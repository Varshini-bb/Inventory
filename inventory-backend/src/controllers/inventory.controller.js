import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";

const DEAD_STOCK_DAYS = 60;

// Add product
export const addProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
};

// Stock IN / OUT
export const updateStock = async (req, res) => {
  const { productId, type, quantity, note } = req.body;

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Not found" });

  if (type === "OUT") {
    product.quantity -= quantity;
    product.lastSoldAt = new Date();
  } else {
    product.quantity += quantity;
  }

  await product.save();

  await StockMovement.create({ productId, type, quantity, note });

  res.json(product);
};

// Dashboard data
export const getDashboard = async (req, res) => {
  const products = await Product.find();

  const lowStock = products.filter(
    p => p.quantity < p.lowStockThreshold
  );

  const deadStock = products.filter(p => {
    if (!p.lastSoldAt) return true;
    const days =
      (Date.now() - new Date(p.lastSoldAt)) / (1000 * 60 * 60 * 24);
    return days > DEAD_STOCK_DAYS;
  });

  res.json({
    totalProducts: products.length,
    lowStockCount: lowStock.length,
    deadStockCount: deadStock.length,
  });
};

// Get inventory list
export const getInventory = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

export const getStockHistory = async (req, res) => {
  const history = await StockMovement.find({
    productId: req.params.productId
  }).sort({ createdAt: -1 });

  res.json(history);
};

