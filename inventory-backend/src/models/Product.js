import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  sku: { type: String },
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
});

const productSchema = new mongoose.Schema(
  {
    // Basic Information
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true }, // unique: true creates an index
    description: { type: String, default: "" },
    
    // Categorization
    category: { type: String, default: "" },
    tags: [{ type: String }],
    
    // Inventory
    quantity: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    unit: { 
      type: String, 
      default: "pieces",
      enum: ["pieces", "kg", "grams", "liters", "ml", "boxes", "packs"]
    },
    
    // Pricing
    costPrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    
    // Images
    images: [{ type: String }],
    primaryImage: { type: String, default: "" },
    
    // Barcode
    barcode: { type: String, default: "" },
    
    // Variants
    hasVariants: { type: Boolean, default: false },
    variants: [productVariantSchema],
    
    // Tracking
    lastSoldAt: { type: Date },
  },
  { 
    timestamps: true
  }
);

// Remove duplicate indexes - only add indexes that aren't already created by schema options
productSchema.index({ category: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ barcode: 1 });
// DON'T add: productSchema.index({ sku: 1 }); - already indexed by unique: true

// Virtual field for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.costPrice > 0 && this.sellingPrice > 0) {
    return ((this.sellingPrice - this.costPrice) / this.costPrice) * 100;
  }
  return 0;
});

// Virtual field for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'OUT_OF_STOCK';
  if (this.quantity < this.lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
});

// Include virtuals when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model("Product", productSchema);