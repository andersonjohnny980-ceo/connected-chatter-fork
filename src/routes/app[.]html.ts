import { createFileRoute } from "@tanstack/react-router";
import shell from "../xchat-app.html?raw";
import { backendUrl, backendPublishableKey } from "../lib/backend-config";

/**
 * Serves the X-Chat app shell with the backend URL / publishable key injected at
 * request time, so the keys are never hardcoded in the checked-in HTML.
 */
export const Route = createFileRoute("/app.html")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"] ?? backendUrl;
        const key =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ??
          process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
          backendPublishableKey;

        const configScript = `<script>window.__XCHAT_CONFIG__=${JSON.stringify({ url, key }).replaceAll("<", "\\u003c")};</script>`;
        const html = shell
          .replace("<script src=\"/lottie.min.js\" defer></script>", `${configScript}\n<script src=\"/lottie.min.js\" defer></script>`)
          .replaceAll("__SUPABASE_URL__", url)
          .replaceAll("__SUPABASE_PUBLISHABLE_KEY__", key);

        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
