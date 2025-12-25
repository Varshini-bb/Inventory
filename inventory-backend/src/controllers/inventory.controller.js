import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import fs from "fs";

// Get all products
export const getInventory = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
};

// Add new product
export const addProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete associated images from filesystem
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        const imgPath = `./public${img}`;
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      });
    }

    // Optionally delete stock movements
    await StockMovement.deleteMany({ product: req.params.id });

    res.json({ message: "Product deleted successfully", product });
  } catch (error) {
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

    const duplicate = new Product({
      name: `${original.name} (Copy)`,
      sku: `${original.sku}-COPY-${Date.now()}`,
      description: original.description,
      category: original.category,
      tags: original.tags,
      quantity: 0, // Start with 0 quantity
      lowStockThreshold: original.lowStockThreshold,
      unit: original.unit,
      costPrice: original.costPrice,
      sellingPrice: original.sellingPrice,
      hasVariants: original.hasVariants,
      variants: original.variants,
      // Don't copy images and barcode
      images: [],
      primaryImage: "",
      barcode: "",
    });

    await duplicate.save();
    res.json(duplicate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Upload product images
// Upload product images
export const uploadImages = async (req, res) => {
  try {
    console.log("📸 Upload handler called");
    console.log("Product ID:", req.params.id);
    console.log("Files:", req.files);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      // Delete uploaded files if product not found
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(404).json({ error: "Product not found" });
    }

    const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
    console.log("✅ Image URLs:", imageUrls);

    product.images.push(...imageUrls);

    // Set first image as primary if no primary image exists
    if (!product.primaryImage && imageUrls.length > 0) {
      product.primaryImage = imageUrls[0];
    }

    await product.save();
    console.log("Product updated with images");

    res.json(product);
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(400).json({ error: error.message });
  }
};

// Delete product image
export const deleteImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const imageUrl = decodeURIComponent(req.params.imageUrl);
    product.images = product.images.filter((img) => img !== imageUrl);

    // Delete file from filesystem
    const imgPath = `./public${imageUrl}`;
    if (fs.existsSync(imgPath)) {
      fs.unlinkSync(imgPath);
    }

    // Update primary image if deleted
    if (product.primaryImage === imageUrl) {
      product.primaryImage = product.images[0] || "";
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Generate barcode
export const generateBarcode = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Generate barcode (simple version - you can use libraries like 'bwip-js' for actual barcode generation)
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const barcode = `${product.sku}-${timestamp}${random}`;
    
    product.barcode = barcode;
    await product.save();
    
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update stock
export const updateStock = async (req, res) => {
  try {
    const { productId, type, quantity, note } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update quantity
    if (type === "IN") {
      product.quantity += quantity;
    } else if (type === "OUT") {
      if (product.quantity < quantity) {
        return res.status(400).json({ error: "Insufficient stock" });
      }
      product.quantity -= quantity;
      product.lastSoldAt = new Date();
    }

    await product.save();

    // Create stock movement record
    const movement = new StockMovement({
      product: productId,
      type,
      quantity,
      note,
    });
    await movement.save();

    res.json({ product, movement });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get stock history
export const getStockHistory = async (req, res) => {
  try {
    const history = await StockMovement.find({
      product: req.params.productId,
    }).sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard stats
export const getDashboard = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lt: ["$quantity", "$lowStockThreshold"] },
    });
    const outOfStockProducts = await Product.countDocuments({ quantity: 0 });

    const products = await Product.find();
    const totalValue = products.reduce(
      (sum, p) => sum + p.quantity * (p.costPrice || 0),
      0
    );

    // Recent stock movements
    const recentMovements = await StockMovement.find()
      .populate("product", "name sku")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      recentMovements,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};