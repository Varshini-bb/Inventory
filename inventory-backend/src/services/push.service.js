import webpush from "web-push";

const subscriptions = new Map();

export const initializePushService = () => {
  webpush.setVapidDetails(
    `mailto:${process.env.EMAIL_USER}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
};

export const saveSubscription = (userId, subscription) => {
  subscriptions.set(userId, subscription);
};

export const sendPushNotification = async (userId, payload) => {
  const subscription = subscriptions.get(userId);

  if (!subscription) {
    console.log("No subscription found for user:", userId);
    return false;
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log("Push notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
};

export const sendLowStockPush = async (userId, product) => {
  const payload = {
    title: "🚨 Low Stock Alert",
    body: `${product.name} is running low (${product.quantity} left)`,
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    data: {
      url: `/products/${product._id}`,
      productId: product._id,
      type: "LOW_STOCK",
    },
  };

  return await sendPushNotification(userId, payload);
};

export const sendExpiryAlertPush = async (userId, product, daysUntilExpiry) => {
  const payload = {
    title: "⏰ Expiry Alert",
    body: `${product.name} expires in ${daysUntilExpiry} days`,
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    data: {
      url: `/products/${product._id}`,
      productId: product._id,
      type: "EXPIRY_ALERT",
    },
  };

  return await sendPushNotification(userId, payload);
};