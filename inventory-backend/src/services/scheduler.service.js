import cron from "node-cron";
import {
  checkLowStock,
  checkExpiringProducts,
  checkReorderPoints,
} from "../controllers/notification.controller.js";

export const startScheduledTasks = () => {
  // Check low stock every hour
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Running low stock check...");
    await checkLowStock();
  });

  // Check expiring products every day at 9 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Running expiry check...");
    await checkExpiringProducts();
  });

  // Check reorder points every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    console.log("⏰ Running reorder check...");
    await checkReorderPoints();
  });

  console.log("✅ Scheduled tasks started");
  console.log("   - Low stock: Every hour");
  console.log("   - Expiry alerts: Daily at 9 AM");
  console.log("   - Reorder checks: Every 6 hours");
};