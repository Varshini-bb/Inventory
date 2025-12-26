export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("Service Worker registered:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  } else {
    console.warn("Service Workers are not supported in this browser");
    throw new Error("Service Workers not supported");
  }
}