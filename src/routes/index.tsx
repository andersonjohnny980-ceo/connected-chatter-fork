import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { registerAppShellWorker } from "@/lib/pwa-registration";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "XChat Messenger — Private Real-Time Chat" },
      {
        name: "description",
        content:
          "XChat Messenger: private one-to-one chat with photos, voice notes, read receipts and live presence. Install it and use it like a phone app.",
      },
      { property: "og:title", content: "XChat Messenger" },
      {
        property: "og:description",
        content:
          "Private one-to-one chat with photos, voice notes, read receipts and live presence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0b1017" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "XChat" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no",
      },
    ],
    links: [
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icons/xchat-192.png" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => { void registerAppShellWorker(); }, []);
  return (
    <main className="h-dvh w-full overflow-hidden">
      <h1 className="sr-only">X-Chat Messenger</h1>
      <iframe
        src="/app.html"
        title="XChat Messenger"
        className="h-full w-full border-0"
        allow="microphone *; camera *; autoplay *; display-capture *; clipboard-write; fullscreen"
        allowFullScreen
      />
    </main>
  );
}
