import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get single product
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create product
export const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    // Create initial stock movement if quantity > 0
    if (product.quantity > 0) {
      const movement = new StockMovement({
        product: product._id,
        type: "IN",
        quantity: product.quantity,
        note: "Initial stock",
      });
      await movement.save();
    }

    res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete associated images
    if (product.images && product.images.length > 0) {
      product.images.forEach((imagePath) => {
        const fullPath = path.join(__dirname, "../../public", imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    // Delete stock movements
    await StockMovement.deleteMany({ product: req.params.id });

    // Delete product
    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Duplicate product
export const duplicateProduct = async (req, res) => {
  try {
    const original = await Product.findById(req.params.id);

    if (!original) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Create duplicate with modified SKU and zero quantity
    const duplicate = new Product({
      ...original.toObject(),
      _id: undefined,
      name: `${original.name} (Copy)`,
      sku: `${original.sku}-COPY-${Date.now()}`,
      quantity: 0,
      images: [],
      primaryImage: null,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await duplicate.save();
    res.status(201).json(duplicate);
  } catch (error) {
    console.error("Duplicate product error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Upload images
export const uploadImages = async (req, res) => {
  try {
    console.log("Upload images request received");
    console.log("Files:", req.files);
    console.log("Product ID:", req.params.id);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Add new image paths
    const newImages = req.files.map((file) => `/uploads/${file.filename}`);
    product.images = [...(product.images || []), ...newImages];

    // Set first image as primary if no primary image exists
    if (!product.primaryImage && newImages.length > 0) {
      product.primaryImage = newImages[0];
    }

    await product.save();
    console.log("Product updated with images:", product);

    res.json(product);
  } catch (error) {
    console.error("Upload images error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete image
export const deleteImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const imageUrl = decodeURIComponent(req.params.imageUrl);
    const imagePath = path.join(__dirname, "../../public", imageUrl);

    // Delete file from filesystem
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Remove from product images array
    product.images = product.images.filter((img) => img !== imageUrl);

    // Update primary image if deleted
    if (product.primaryImage === imageUrl) {
      product.primaryImage = product.images.length > 0 ? product.images[0] : null;
    }

    await product.save();
    res.json(product);
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Generate barcode
export const generateBarcode = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Generate simple barcode (you can integrate a barcode library here)
    const barcode = `BAR${Date.now()}${Math.floor(Math.random() * 1000)}`;
    product.barcode = barcode;

    await product.save();
    res.json(product);
  } catch (error) {
    console.error("Generate barcode error:", error);
    res.status(500).json({ error: error.message });
  }
};



export const getDashboard = async (req, res) => {
  try {
    // Get total products count
    const totalProducts = await Product.countDocuments();

    // Get low stock products
    const lowStockProducts = await Product.find({
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
    }).countDocuments();

    // Get out of stock products
    const outOfStockProducts = await Product.find({
      quantity: 0,
    }).countDocuments();

    // Calculate total stock value
    const products = await Product.find();
    const totalStockValue = products.reduce((sum, product) => {
      return sum + (product.quantity * (product.sellingPrice || 0));
    }, 0);

    // Get recent stock movements
    const recentMovements = await StockMovement.find()
      .populate("product", "name sku")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get products by category
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      recentMovements,
      productsByCategory,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Low Stock Report
export const getLowStockReport = async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lt: ["$quantity", "$lowStockThreshold"] },
    })
      .select("name sku quantity lowStockThreshold category costPrice sellingPrice")
      .sort({ quantity: 1 });

    const totalValue = lowStockProducts.reduce(
      (sum, p) => sum + p.quantity * (p.costPrice || 0),
      0
    );

    res.json({
      products: lowStockProducts,
      totalProducts: lowStockProducts.length,
      totalValue,
    });
  } catch (error) {
    console.error("Low stock report error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Stock Value Report
export const getStockValueReport = async (req, res) => {
  try {
    const products = await Product.find()
      .select("name sku quantity category costPrice sellingPrice")
      .sort({ category: 1, name: 1 });

    const totalCostValue = products.reduce(
      (sum, p) => sum + p.quantity * (p.costPrice || 0),
      0
    );

    const totalSellingValue = products.reduce(
      (sum, p) => sum + p.quantity * (p.sellingPrice || 0),
      0
    );

    const byCategory = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalCostValue: {
            $sum: { $multiply: ["$quantity", { $ifNull: ["$costPrice", 0] }] },
          },
          totalSellingValue: {
            $sum: { $multiply: ["$quantity", { $ifNull: ["$sellingPrice", 0] }] },
          },
        },
      },
      {
        $sort: { totalCostValue: -1 },
      },
    ]);

    res.json({
      products,
      totalProducts: products.length,
      totalCostValue,
      totalSellingValue,
      potentialProfit: totalSellingValue - totalCostValue,
      byCategory,
    });
  } catch (error) {
    console.error("Stock value report error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Stock Movements Report
export const getStockMovementsReport = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (type) query.type = type;

    const movements = await StockMovement.find(query)
      .populate("product", "name sku category")
      .sort({ createdAt: -1 });

    const totalIn = movements
      .filter((m) => m.type === "IN")
      .reduce((sum, m) => sum + m.quantity, 0);

    const totalOut = movements
      .filter((m) => m.type === "OUT")
      .reduce((sum, m) => sum + m.quantity, 0);

    res.json({
      movements,
      totalMovements: movements.length,
      totalIn,
      totalOut,
      netChange: totalIn - totalOut,
    });
  } catch (error) {
    console.error("Stock movements report error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Export to CSV
export const exportToCSV = async (req, res) => {
  try {
    const { type } = req.query;

    let csv = "";
    let filename = "inventory-export.csv";

    if (type === "products") {
      const products = await Product.find();
      filename = "products-export.csv";

      csv = "Name,SKU,Category,Quantity,Unit,Cost Price,Selling Price,Low Stock Threshold,Status\n";

      products.forEach((p) => {
        const status =
          p.quantity === 0
            ? "Out of Stock"
            : p.quantity < p.lowStockThreshold
            ? "Low Stock"
            : "In Stock";
        csv += `"${p.name}","${p.sku}","${p.category || ""}",${p.quantity},"${
          p.unit || "pieces"
        }",${p.costPrice || 0},${p.sellingPrice || 0},${p.lowStockThreshold},"${status}"\n`;
      });
    } else if (type === "movements") {
      const movements = await StockMovement.find()
        .populate("product", "name sku")
        .sort({ createdAt: -1 });
      filename = "stock-movements-export.csv";

      csv = "Date,Product,SKU,Type,Quantity,Note\n";

      movements.forEach((m) => {
        const date = new Date(m.createdAt).toLocaleString();
        csv += `"${date}","${m.product?.name || "N/A"}","${
          m.product?.sku || "N/A"
        }","${m.type}",${m.quantity},"${m.note || ""}"\n`;
      });
    } else if (type === "low-stock") {
      const products = await Product.find({
        $expr: { $lt: ["$quantity", "$lowStockThreshold"] },
      }).sort({ quantity: 1 });
      filename = "low-stock-export.csv";

      csv = "Name,SKU,Category,Current Stock,Threshold,Needed,Cost Price,Selling Price\n";

      products.forEach((p) => {
        const needed = p.lowStockThreshold - p.quantity;
        csv += `"${p.name}","${p.sku}","${p.category || ""}",${p.quantity},${
          p.lowStockThreshold
        },${needed},${p.costPrice || 0},${p.sellingPrice || 0}\n`;
      });
    } else if (type === "stock-value") {
      const products = await Product.find().sort({ category: 1, name: 1 });
      filename = "stock-value-export.csv";

      csv =
        "Name,SKU,Category,Quantity,Cost Price,Selling Price,Total Cost Value,Total Selling Value,Profit\n";

      products.forEach((p) => {
        const totalCost = p.quantity * (p.costPrice || 0);
        const totalSelling = p.quantity * (p.sellingPrice || 0);
        const profit = totalSelling - totalCost;
        csv += `"${p.name}","${p.sku}","${p.category || ""}",${p.quantity},${
          p.costPrice || 0
        },${p.sellingPrice || 0},${totalCost.toFixed(2)},${totalSelling.toFixed(
          2
        )},${profit.toFixed(2)}\n`;
      });
    } else {
      return res.status(400).json({ error: "Invalid export type" });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: error.message });
  }
};