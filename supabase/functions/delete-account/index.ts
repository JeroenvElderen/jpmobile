import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";
import { z } from "https://esm.sh/zod@4.4.3";

const requestSchema = z.object({ email: z.string().trim().email().transform((email) => email.toLowerCase()) });
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "You must be signed in to delete your account." }, 401);

    const input = requestSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return json({ error: "Enter a valid email address." }, 400);

    const supabaseUrl = requireEnv("SUPABASE_URL");
    const userClient = createClient(supabaseUrl, requireEnv("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Your session has expired. Sign in and try again." }, 401);

    const accountEmail = userData.user.email?.trim().toLowerCase();
    if (!accountEmail || input.data.email !== accountEmail) {
      return json({ error: "That email address does not match your account." }, 400);
    }

    const adminClient = createClient(supabaseUrl, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await removeAccountImages(adminClient, userData.user.id);

    const { error: deletionError } = await userClient.rpc("delete_own_account", {
      confirmation_email: input.data.email,
    });
    if (deletionError) throw deletionError;

    return json({ deleted: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to delete the account." }, 500);
  }
});

async function removeAccountImages(supabase: ReturnType<typeof createClient>, authUserId: string) {
  const { data: client, error } = await supabase
    .from("portal_clients")
    .select("id, avatar_url, portal_dogs(profile_photo_url, hero_photo_url), portal_gallery_items(image_url), portal_bookings(cover_image_url), portal_session_updates(image_url)")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw error;
  if (!client) return;

  const urls = [
    client.avatar_url,
    ...flattenUrls(client.portal_dogs, ["profile_photo_url", "hero_photo_url"]),
    ...flattenUrls(client.portal_gallery_items, ["image_url"]),
    ...flattenUrls(client.portal_bookings, ["cover_image_url"]),
    ...flattenUrls(client.portal_session_updates, ["image_url"]),
  ];
  const paths = Array.from(new Set(urls.map(storagePath).filter((path): path is string => Boolean(path))));
  if (!paths.length) return;
  const { error: storageError } = await supabase.storage.from("portal-images").remove(paths);
  if (storageError) throw storageError;
}

function flattenUrls(rows: unknown, keys: string[]) {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => keys.map((key) => typeof row?.[key] === "string" ? row[key] : null));
}

function storagePath(value: unknown) {
  if (typeof value !== "string") return null;
  const marker = "/storage/v1/object/public/portal-images/";
  const index = value.indexOf(marker);
  return index < 0 ? null : decodeURIComponent(value.slice(index + marker.length).split("?")[0]);
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
