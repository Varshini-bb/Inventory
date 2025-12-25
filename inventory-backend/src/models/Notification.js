import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["low_stock", "out_of_stock", "expiry", "reorder"],
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    read: { type: Boolean, default: false },
    dismissed: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    data: mongoose.Schema.Types.Mixed, // Additional data
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;