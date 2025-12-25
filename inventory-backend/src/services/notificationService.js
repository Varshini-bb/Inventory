import Notification from "../models/Notification.js";
import Product from "../models/Product.js";
import Settings from "../models/Settings.js";
import emailService from "./emailService.js";

class NotificationService {
  async checkLowStock() {
    try {
      const products = await Product.find({
        $expr: { $lt: ["$quantity", "$lowStockThreshold"] },
        quantity: { $gt: 0 },
      });

      const settings = await Settings.findOne();
      
      for (const product of products) {
        // Check if we've already sent an alert recently (within 24 hours)
        if (
          product.lastStockAlert &&
          Date.now() - product.lastStockAlert < 24 * 60 * 60 * 1000
        ) {
          continue;
        }

        // Create notification
        await Notification.create({
          type: "low_stock",
          product: product._id,
          title: "Low Stock Alert",
          message: `${product.name} is running low (${product.quantity} remaining)`,
          priority: "high",
        });

        // Send email if enabled
        if (settings?.emailNotifications?.enabled && settings?.emailNotifications?.lowStock) {
          if (settings.emailNotifications.email) {
            await emailService.sendLowStockAlert(product, settings.emailNotifications.email);
          }
        }

        // Update last alert time
        product.lastStockAlert = new Date();
        await product.save();
      }

      return products.length;
    } catch (error) {
      console.error("Error checking low stock:", error);
      throw error;
    }
  }

  async checkOutOfStock() {
    try {
      const products = await Product.find({ quantity: 0 });
      const settings = await Settings.findOne();

      for (const product of products) {
        // Check if we've already sent an alert recently
        if (
          product.lastStockAlert &&
          Date.now() - product.lastStockAlert < 24 * 60 * 60 * 1000
        ) {
          continue;
        }

        // Create notification
        await Notification.create({
          type: "out_of_stock",
          product: product._id,
          title: "Out of Stock Alert",
          message: `${product.name} is out of stock!`,
          priority: "critical",
        });

        // Send email if enabled
        if (settings?.emailNotifications?.enabled && settings?.emailNotifications?.outOfStock) {
          if (settings.emailNotifications.email) {
            await emailService.sendOutOfStockAlert(product, settings.emailNotifications.email);
          }
        }

        product.lastStockAlert = new Date();
        await product.save();
      }

      return products.length;
    } catch (error) {
      console.error("Error checking out of stock:", error);
      throw error;
    }
  }

  async checkExpiry() {
    try {
      const now = new Date();
      const products = await Product.find({
        isPerishable: true,
        expiryDate: { $exists: true, $ne: null },
      });

      const settings = await Settings.findOne();
      let expiringCount = 0;

      for (const product of products) {
        const daysUntilExpiry = Math.ceil(
          (new Date(product.expiryDate) - now) / (1000 * 60 * 60 * 24)
        );

        // Check if product is expiring soon
        if (daysUntilExpiry <= product.expiryAlertDays && daysUntilExpiry >= 0) {
          // Check if we've already sent an alert recently
          if (
            product.lastExpiryAlert &&
            Date.now() - product.lastExpiryAlert < 24 * 60 * 60 * 1000
          ) {
            continue;
          }

          const priority = daysUntilExpiry <= 2 ? "critical" : daysUntilExpiry <= 5 ? "high" : "medium";

          // Create notification
          await Notification.create({
            type: "expiry",
            product: product._id,
            title: "Product Expiring Soon",
            message: `${product.name} expires in ${daysUntilExpiry} days`,
            priority,
            data: { daysUntilExpiry, expiryDate: product.expiryDate },
          });

          // Send email if enabled
          if (settings?.emailNotifications?.enabled && settings?.emailNotifications?.expiry) {
            if (settings.emailNotifications.email) {
              await emailService.sendExpiryAlert(product, settings.emailNotifications.email);
            }
          }

          product.lastExpiryAlert = new Date();
          await product.save();
          expiringCount++;
        }
      }

      return expiringCount;
    } catch (error) {
      console.error("Error checking expiry:", error);
      throw error;
    }
  }

  async checkReorderPoints() {
    try {
      const products = await Product.find({
        autoReorderEnabled: true,
        reorderPoint: { $exists: true, $ne: null },
        $expr: { $lte: ["$quantity", "$reorderPoint"] },
      });

      const settings = await Settings.findOne();

      for (const product of products) {
        // Check if we've already sent an alert recently
        if (
          product.lastStockAlert &&
          Date.now() - product.lastStockAlert < 48 * 60 * 60 * 1000
        ) {
          continue;
        }

        // Create notification
        await Notification.create({
          type: "reorder",
          product: product._id,
          title: "Reorder Reminder",
          message: `Time to reorder ${product.name} (Suggested: ${product.reorderQuantity} units)`,
          priority: "medium",
          data: {
            reorderPoint: product.reorderPoint,
            reorderQuantity: product.reorderQuantity,
          },
        });

        // Send email if enabled
        if (settings?.emailNotifications?.enabled && settings?.emailNotifications?.reorder) {
          if (settings.emailNotifications.email) {
            await emailService.sendReorderReminder(product, settings.emailNotifications.email);
          }
        }

        product.lastStockAlert = new Date();
        await product.save();
      }

      return products.length;
    } catch (error) {
      console.error("Error checking reorder points:", error);
      throw error;
    }
  }

  async runAllChecks() {
    console.log("🔔 Running notification checks...");
    
    const lowStockCount = await this.checkLowStock();
    const outOfStockCount = await this.checkOutOfStock();
    const expiryCount = await this.checkExpiry();
    const reorderCount = await this.checkReorderPoints();

    console.log(`✅ Notification check complete:`);
    console.log(`   - Low stock alerts: ${lowStockCount}`);
    console.log(`   - Out of stock alerts: ${outOfStockCount}`);
    console.log(`   - Expiry alerts: ${expiryCount}`);
    console.log(`   - Reorder reminders: ${reorderCount}`);

    return { lowStockCount, outOfStockCount, expiryCount, reorderCount };
  }
}

export default new NotificationService();