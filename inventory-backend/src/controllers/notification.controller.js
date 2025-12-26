import Notification from "../models/Notification.js";
import Product from "../models/Product.js";
import {
  sendLowStockEmail,
  sendExpiryAlertEmail,
  sendReorderReminderEmail,
} from "../services/email.service.js";
import {
  sendLowStockPush,
  sendExpiryAlertPush,
  saveSubscription,
} from "../services/push.service.js";

export const getNotifications = async (req, res) => {
  try {
    const { isRead, type, priority } = req.query;

    const filter = {};
    if (isRead !== undefined) filter.isRead = isRead === "true";
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const notifications = await Notification.find(filter)
      .populate("product")
      .sort({ createdAt: -1 })
      .limit(100);

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVapidPublicKey = async (req, res) => {
  try {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const subscribeToPush = async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = "admin";

    saveSubscription(userId, subscription);

    res.json({ message: "Subscribed to push notifications" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkLowStock = async () => {
  try {
    const products = await Product.find({
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
      emailNotificationsEnabled: true,
    });

    for (const product of products) {
      const lastNotification = await Notification.findOne({
        product: product._id,
        type: "LOW_STOCK",
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      if (lastNotification) continue;

      const notification = await Notification.create({
        type: "LOW_STOCK",
        title: "Low Stock Alert",
        message: `${product.name} is running low. Current stock: ${product.quantity}`,
        product: product._id,
        priority: product.quantity === 0 ? "urgent" : "high",
        metadata: {
          currentStock: product.quantity,
          threshold: product.lowStockThreshold,
        },
      });

      if (product.emailNotificationsEnabled) {
        const emailSent = await sendLowStockEmail(product, process.env.ADMIN_EMAIL);
        notification.isEmailSent = emailSent;
      }

      if (product.pushNotificationsEnabled) {
        const pushSent = await sendLowStockPush("admin", product);
        notification.isPushSent = pushSent;
      }

      await notification.save();
      product.lastNotificationSent = new Date();
      await product.save();
    }

    console.log(`Low stock check completed. Found ${products.length} products.`);
  } catch (error) {
    console.error("Error checking low stock:", error);
  }
};

export const checkExpiringProducts = async () => {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + 30);

    const products = await Product.find({
      isPerishable: true,
      expiryDate: {
        $exists: true,
        $lte: thresholdDate,
        $gte: new Date(),
      },
    });

    for (const product of products) {
      const daysUntilExpiry = Math.ceil(
        (new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
      );

      const lastNotification = await Notification.findOne({
        product: product._id,
        type: "EXPIRY_ALERT",
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      if (lastNotification) continue;

      let priority = "low";
      if (daysUntilExpiry <= 7) priority = "urgent";
      else if (daysUntilExpiry <= 14) priority = "high";
      else if (daysUntilExpiry <= 21) priority = "medium";

      const notification = await Notification.create({
        type: "EXPIRY_ALERT",
        title: "Product Expiry Alert",
        message: `${product.name} expires in ${daysUntilExpiry} days`,
        product: product._id,
        priority,
        metadata: {
          expiryDate: product.expiryDate,
          daysUntilExpiry,
          currentStock: product.quantity,
        },
      });

      if (product.emailNotificationsEnabled) {
        const emailSent = await sendExpiryAlertEmail(
          product,
          process.env.ADMIN_EMAIL,
          daysUntilExpiry
        );
        notification.isEmailSent = emailSent;
      }

      if (product.pushNotificationsEnabled) {
        const pushSent = await sendExpiryAlertPush("admin", product, daysUntilExpiry);
        notification.isPushSent = pushSent;
      }

      await notification.save();
    }

    console.log(`Expiry check completed. Found ${products.length} products.`);
  } catch (error) {
    console.error("Error checking expiring products:", error);
  }
};

export const checkReorderPoints = async () => {
  try {
    const products = await Product.find({
      reorderPoint: { $exists: true, $ne: null },
      $expr: { $lte: ["$quantity", "$reorderPoint"] },
    });

    for (const product of products) {
      const lastNotification = await Notification.findOne({
        product: product._id,
        type: "REORDER_REMINDER",
        createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      });

      if (lastNotification) continue;

      const notification = await Notification.create({
        type: "REORDER_REMINDER",
        title: "Reorder Reminder",
        message: `Time to reorder ${product.name}. Suggested quantity: ${product.reorderQuantity}`,
        product: product._id,
        priority: "medium",
        metadata: {
          currentStock: product.quantity,
          reorderPoint: product.reorderPoint,
          suggestedQuantity: product.reorderQuantity,
        },
      });

      if (product.emailNotificationsEnabled) {
        const emailSent = await sendReorderReminderEmail(product, process.env.ADMIN_EMAIL);
        notification.isEmailSent = emailSent;
      }

      await notification.save();
    }

    console.log(`Reorder check completed. Found ${products.length} products.`);
  } catch (error) {
    console.error("Error checking reorder points:", error);
  }
};