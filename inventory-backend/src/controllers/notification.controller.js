import Notification from "../models/Notification.js";
import Settings from "../models/Settings.js";
import notificationService from "../services/notificationService.js";

// Get all notifications
export const getNotifications = async (req, res) => {
  try {
    const { read, dismissed } = req.query;
    
    const query = {};
    if (read !== undefined) query.read = read === 'true';
    if (dismissed !== undefined) query.dismissed = dismissed === 'true';

    const notifications = await Notification.find(query)
      .populate("product", "name sku quantity lowStockThreshold")
      .sort({ createdAt: -1 })
      .limit(100);

    const unreadCount = await Notification.countDocuments({ read: false, dismissed: false });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Dismiss notification
export const dismissNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { dismissed: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Dismiss notification error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get settings
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        emailNotifications: {
          enabled: false,
          email: "",
          lowStock: true,
          outOfStock: true,
          expiry: true,
          reorder: true,
        },
        pushNotifications: {
          enabled: true,
          lowStock: true,
          outOfStock: true,
          expiry: true,
          reorder: true,
        },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update settings
export const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Trigger manual check
export const triggerCheck = async (req, res) => {
  try {
    const results = await notificationService.runAllChecks();
    res.json(results);
  } catch (error) {
    console.error("Trigger check error:", error);
    res.status(500).json({ error: error.message });
  }
};