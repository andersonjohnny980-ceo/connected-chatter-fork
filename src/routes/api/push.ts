import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { backendUrl, backendPublishableKey } from "@/lib/backend-config";

/**
 * One push pipeline for X-Chat. The app calls this with the user's session;
 * the OneSignal REST key never leaves the server. Every notification is aimed
 * at the recipient's user id (OneSignal external_id), so web, the Capacitor APK
 * and Median wrappers all receive through the same path, and an idempotency key
 * stops the same event from ever being delivered twice.
 */
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("register"), token: z.string().min(10).max(4096) }),
  z.object({ action: z.literal("message"), messageId: z.string().uuid() }),
  z.object({ action: z.literal("friend"), requestId: z.string().uuid().optional(), to: z.string().uuid() }),
  z.object({ action: z.literal("call"), to: z.string().uuid(), callId: z.string().uuid() }),
  z.object({ action: z.literal("config") }),
]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", ...CORS } });

function osAuth(key: string) {
  return key.startsWith("os_v2_") ? `Key ${key}` : `Basic ${key}`;
}

async function sendPush(
  appId: string,
  key: string,
  to: string,
  title: string,
  body: string,
  data: Record<string, string>,
  idem: string,
) {
  const res = await fetch("https://api.onesignal.com/notifications?c=push", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: osAuth(key) },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      include_aliases: { external_id: [to] },
      headings: { en: title },
      contents: { en: body },
      data,
      idempotency_key: idem,
      android_group: data["chatId"] || "xchat",
      priority: 10,
      existing_android_channel_id: "xchat_messages",
      android_visibility: 1,
      android_sound: "default",
      ttl: data["type"] === "call" ? 45 : 86400,
    }),
  });
  if (!res.ok) console.warn("push failed", res.status, (await res.text()).slice(0, 200));
}

export const Route = createFileRoute("/api/push")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: CORS }),
      POST: async ({ request }) => {
        const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
        if (!token) return json({ error: "unauthorized" }, 401);
        const url = process.env["SUPABASE_URL"] || backendUrl;
        const pub = process.env["SUPABASE_PUBLISHABLE_KEY"] || backendPublishableKey;
        const appId = process.env["ONESIGNAL_APP_ID"] || "";
        const osKey = process.env["ONESIGNAL_API_KEY"] || "";
        const sb = createClient<Database>(url, pub, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: u, error: ue } = await sb.auth.getUser(token);
        if (ue || !u.user) return json({ error: "unauthorized" }, 401);
        const me = u.user.id;

        let input: z.infer<typeof Body>;
        try {
          input = Body.parse(await request.json());
        } catch {
          return json({ error: "bad request" }, 400);
        }
        if (input.action === "config") return json({ appId });
        if (!appId || !osKey) return json({ ok: false, reason: "push not configured" });

        const { data: meRow } = await sb.from("profiles").select("name").eq("id", me).maybeSingle();
        const myName = meRow?.name || "XChat";

        if (input.action === "register") {
          // Attach this phone's FCM token to the user's OneSignal identity.
          const res = await fetch(`https://api.onesignal.com/apps/${appId}/users`, {
            method: "POST",
            headers: { "content-type": "application/json", Authorization: osAuth(osKey) },
            body: JSON.stringify({
              identity: { external_id: me },
              subscriptions: [{ type: "AndroidPush", token: input.token, enabled: true }],
            }),
          });
          let ok = res.ok;
          if (!ok) {
            // User already exists: add this phone as a subscription instead.
            const r2 = await fetch(
              `https://api.onesignal.com/apps/${appId}/users/by/external_id/${me}/subscriptions`,
              {
                method: "POST",
                headers: { "content-type": "application/json", Authorization: osAuth(osKey) },
                body: JSON.stringify({ subscription: { type: "AndroidPush", token: input.token, enabled: true } }),
              },
            );
            ok = r2.ok || r2.status === 409;
            if (!ok) console.warn("push register failed", res.status, r2.status, (await r2.text()).slice(0, 200));
          }
          return json({ ok });
        }

        if (input.action === "message") {
          // RLS guarantees the caller can only see messages in their own chats.
          const { data: m } = await sb
            .from("messages")
            .select("id, conversation_id, sender_id, kind, body")
            .eq("id", input.messageId)
            .maybeSingle();
          if (!m || m.sender_id !== me) return json({ error: "forbidden" }, 403);
          const { data: parts } = await sb
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", m.conversation_id);
          const to = (parts || []).map((p) => p.user_id).filter((id) => id !== me);
          const preview =
            m.kind === "image" ? "📷 Photo" : m.kind === "video" ? "🎥 Video" : m.kind === "voice" ? "🎤 Voice message" : (m.body || "New message").slice(0, 120);
          await Promise.all(
            to.map((r) => sendPush(appId, osKey, r, myName, preview, { type: "message", chatId: me, msgId: m.id, url: "/" }, `msg-${m.id}-${r}`)),
          );
          return json({ ok: true });
        }

        if (input.action === "friend") {
          const { data: fr } = await sb
            .from("friend_requests")
            .select("id, sender_id, receiver_id, status, updated_at")
            .or(`and(sender_id.eq.${me},receiver_id.eq.${input.to}),and(sender_id.eq.${input.to},receiver_id.eq.${me})`)
            .in("status", ["pending", "accepted"])
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!fr) return json({ error: "forbidden" }, 403);
          const accepted = fr.status === "accepted";
          if (!accepted && fr.sender_id !== me) return json({ error: "forbidden" }, 403);
          await sendPush(
            appId,
            osKey,
            input.to,
            accepted ? "Friend request accepted" : "New friend request",
            accepted ? `${myName} accepted your friend request` : `${myName} wants to be friends`,
            { type: accepted ? "friend_accept" : "friend_request", chatId: accepted ? me : "", url: "/discover/requests", msgId: `fr-${fr.id}-${fr.status}` },
            `fr-${fr.id}-${fr.status}`,
          );
          return json({ ok: true });
        }

        // incoming call — only to someone who shares a chat with the caller and is still a friend
        if (input.to === me) return json({ error: "forbidden" }, 403);
        const { data: mine } = await sb.from("conversation_participants").select("conversation_id").eq("user_id", me).limit(500);
        const convIds = (mine || []).map((r) => r.conversation_id);
        if (!convIds.length) return json({ error: "forbidden" }, 403);
        const { data: shared } = await sb
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", input.to)
          .in("conversation_id", convIds)
          .limit(1);
        if (!shared || !shared.length) return json({ error: "forbidden" }, 403);
        const pk = [me, input.to].sort().join(":");
        const { data: fr } = await sb.from("friend_requests").select("id").eq("pair_key", pk).eq("status", "accepted").limit(1);
        if (!fr || !fr.length) return json({ error: "forbidden" }, 403);
        await sendPush(appId, osKey, input.to, "Incoming voice call", `${myName} is calling you`, { type: "call", chatId: me, msgId: `call-${input.callId}`, url: "/" }, `call-${input.callId}`);
        return json({ ok: true });
      },
    },
  },
});
