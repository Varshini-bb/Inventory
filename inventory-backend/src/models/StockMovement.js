import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("StockMovement", stockMovementSchema);