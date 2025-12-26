import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["LOW_STOCK", "EXPIRY_ALERT", "REORDER_REMINDER", "STOCK_OUT"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isEmailSent: {
      type: Boolean,
      default: false,
    },
    isPushSent: {
      type: Boolean,
      default: false,
    },
    metadata: {
      currentStock: Number,
      threshold: Number,
      expiryDate: Date,
      daysUntilExpiry: Number,
      reorderPoint: Number,
      suggestedQuantity: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);