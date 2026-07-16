import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";

type Platform = "ios" | "android" | "web";

type PushRequest =
  | { action: "register-token"; token: string; platform?: Platform }
  | { action: "notify-admins"; title: string; body: string; url?: string; type?: string }
  | { action: "notify-client"; clientId: string; title: string; body: string; url?: string; type?: string };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const anonKey = requireEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = request.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) throw new Error("Sign in to use push notifications.");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const body = await request.json() as PushRequest;

    if (body.action === "register-token") {
      const token = required(body.token, "Push token");
      const { error } = await adminClient.from("portal_push_tokens").upsert({
        auth_user_id: userData.user.id,
        expo_push_token: token,
        platform: body.platform ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "expo_push_token" });
      if (error) throw error;
      return json({ ok: true });
    }

    if (body.action === "notify-admins") {
      await assertAdmin(adminClient, userData.user.id);
      const { data: admins, error: adminsError } = await adminClient.from("portal_profiles").select("auth_user_id").eq("role", "admin");
      if (adminsError) throw adminsError;
      const adminUserIds = (admins ?? []).map((admin) => admin.auth_user_id).filter(Boolean);
      const { data, error } = adminUserIds.length
        ? await adminClient.from("portal_push_tokens").select("expo_push_token").in("auth_user_id", adminUserIds)
        : { data: [], error: null };
      if (error) throw error;
      const tickets = await sendExpoNotifications((data ?? []).map((row) => row.expo_push_token), body);
      return json({ ok: true, tickets });
    }

    await assertAdmin(adminClient, userData.user.id);
    const clientId = required(body.clientId, "Client ID");
    const { data: client, error: clientError } = await adminClient.from("portal_clients").select("auth_user_id").eq("id", clientId).maybeSingle<{ auth_user_id: string | null }>();
    if (clientError) throw clientError;
    if (!client?.auth_user_id) return json({ ok: true, tickets: [] });
    const { data, error } = await adminClient.from("portal_push_tokens").select("expo_push_token").eq("auth_user_id", client.auth_user_id);
    if (error) throw error;
    const tickets = await sendExpoNotifications((data ?? []).map((row) => row.expo_push_token), body);
    return json({ ok: true, tickets });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Push notification request failed." }, 400);
  }
});

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function required(value: string | undefined, label: string) {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}

async function assertAdmin(supabase: ReturnType<typeof createClient>, authUserId: string) {
  const { data, error } = await supabase.from("portal_profiles").select("role").eq("auth_user_id", authUserId).maybeSingle<{ role: string | null }>();
  if (error) throw error;
  if (data?.role !== "admin") throw new Error("Only admins can send this notification.");
}

async function sendExpoNotifications(tokens: string[], input: { title: string; body: string; url?: string; type?: string }) {
  const uniqueTokens = Array.from(new Set(tokens.filter((token) => /^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/.test(token))));
  if (!uniqueTokens.length) return [];

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(uniqueTokens.map((to) => ({
      to,
      sound: "default",
      title: input.title,
      body: input.body,
      data: { url: input.url, type: input.type },
    }))),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result?.errors?.[0]?.message ?? "Expo push service rejected the notification.");
  return result.data ?? [];
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}