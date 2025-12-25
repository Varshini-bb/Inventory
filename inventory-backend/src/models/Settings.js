import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    emailNotifications: {
      enabled: { type: Boolean, default: true },
      email: String,
      lowStock: { type: Boolean, default: true },
      outOfStock: { type: Boolean, default: true },
      expiry: { type: Boolean, default: true },
      reorder: { type: Boolean, default: true },
    },
    pushNotifications: {
      enabled: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: true },
      outOfStock: { type: Boolean, default: true },
      expiry: { type: Boolean, default: true },
      reorder: { type: Boolean, default: true },
    },
    emailConfig: {
      host: String,
      port: Number,
      secure: Boolean,
      user: String,
      pass: String,
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;