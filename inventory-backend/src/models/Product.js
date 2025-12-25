import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  name: String,
  value: String,
  sku: String,
  price: Number,
  quantity: Number,
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    description: String,
    category: String,
    tags: [String],
    quantity: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    unit: {
      type: String,
      enum: ["pieces", "kg", "grams", "liters", "ml", "boxes", "packs"],
      default: "pieces",
    },
    costPrice: Number,
    sellingPrice: Number,
    images: [String],
    primaryImage: String,
    barcode: String,
    hasVariants: { type: Boolean, default: false },
    variants: [variantSchema],
    
    // NEW: Expiry and Notification Fields
    isPerishable: { type: Boolean, default: false },
    expiryDate: Date,
    expiryAlertDays: { type: Number, default: 7 }, // Alert X days before expiry
    lastStockAlert: Date,
    lastExpiryAlert: Date,
    autoReorderEnabled: { type: Boolean, default: false },
    reorderPoint: Number,
    reorderQuantity: Number,
  },
  {
    timestamps: true,
  }
);

// Virtual for profit margin
productSchema.virtual("profitMargin").get(function () {
  if (!this.costPrice || !this.sellingPrice) return 0;
  return ((this.sellingPrice - this.costPrice) / this.costPrice) * 100;
});

// Virtual for stock status
productSchema.virtual("stockStatus").get(function () {
  if (this.quantity === 0) return "out_of_stock";
  if (this.quantity < this.lowStockThreshold) return "low_stock";
  return "in_stock";
});

// Virtual for expiry status
productSchema.virtual("expiryStatus").get(function () {
  if (!this.isPerishable || !this.expiryDate) return "not_applicable";
  
  const now = new Date();
  const expiryDate = new Date(this.expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= this.expiryAlertDays) return "expiring_soon";
  return "fresh";
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

const Product = mongoose.model("Product", productSchema);

export default Product;