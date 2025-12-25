import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  deleteNotification,
  getSettings,
  updateSettings,
  triggerCheck,
} from "../controllers/notification.controller.js";

const router = express.Router();

// Notifications
router.get("/notifications", getNotifications);
router.put("/notifications/:id/read", markAsRead);
router.put("/notifications/read-all", markAllAsRead);
router.put("/notifications/:id/dismiss", dismissNotification);
router.delete("/notifications/:id", deleteNotification);

// Settings
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

// Manual trigger
router.post("/notifications/check", triggerCheck);

export default router;