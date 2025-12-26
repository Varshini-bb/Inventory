import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToPush,
  getVapidPublicKey,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/notifications", getNotifications);
router.get("/notifications/vapid-public-key", getVapidPublicKey);
router.put("/notifications/:id/read", markAsRead);
router.put("/notifications/read-all", markAllAsRead);
router.delete("/notifications/:id", deleteNotification);
router.post("/notifications/subscribe", subscribeToPush);

export default router;