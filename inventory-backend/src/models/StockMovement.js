import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  type: { type: String, enum: ["IN", "OUT"], required: true },
  quantity: { type: Number, required: true },
  note: String,
}, { timestamps: true });

export default mongoose.model("StockMovement", stockMovementSchema);
