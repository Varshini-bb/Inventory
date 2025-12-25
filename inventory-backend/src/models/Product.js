import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  quantity: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  lastSoldAt: { type: Date },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
