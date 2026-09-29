// Keep the app-shell worker out of Lovable previews, the Android bundle and iframes.
export async function registerAppShellWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const hostname = location.hostname;
  const refused = !import.meta.env.PROD || window !== window.top ||
    hostname.startsWith("id-preview--") || hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" || hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" || hostname.endsWith(".beta.lovable.dev") ||
    location.search.includes("sw=off") || !!(window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

  if (refused) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter((r) => r.active?.scriptURL.endsWith("/sw.js") || r.installing?.scriptURL.endsWith("/sw.js") || r.waiting?.scriptURL.endsWith("/sw.js")).map((r) => r.unregister()));
    return;
  }
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    const oldNames = await caches.keys();
    await Promise.all(oldNames.filter((name) => /^xchat-v\d+$/.test(name)).map((name) => caches.delete(name)));
    registration.update().catch(() => {});
  } catch (error) {
    console.warn("Offline startup unavailable", error);
  }
}