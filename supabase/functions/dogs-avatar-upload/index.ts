import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";
import { z } from "https://esm.sh/zod@4.4.3";

const storageBucket = "portal-images";
let bucketLimitPromise: Promise<void> | null = null;

type SupabaseAuthUser = { id?: string; user?: { id?: string } };

const uploadRequestSchema = z.object({
  dogId: z.string().uuid(),
  fileName: z.string().trim().min(1),
  contentType: z.string().trim().startsWith("image/"),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getAdminClient() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getAuthenticatedUserId(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!accessToken || !supabaseUrl || !anonKey) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as SupabaseAuthUser | null;
  return payload?.id ?? payload?.user?.id ?? null;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

async function allowAvatarImageUploads() {
  const supabaseAdmin = getAdminClient();
  bucketLimitPromise ??= supabaseAdmin.storage
    .updateBucket(storageBucket, { public: true, fileSizeLimit: null, allowedMimeTypes: null })
    .then(({ error }) => {
      if (error) throw error;
    })
    .catch((error) => {
      bucketLimitPromise = null;
      throw error;
    });

  return bucketLimitPromise;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const payload = uploadRequestSchema.safeParse(await request.json().catch(() => null));
    if (!payload.success) return json({ error: payload.error.issues[0]?.message || "Invalid upload request." }, 400);

    const supabaseAdmin = getAdminClient();
    const { data: dog, error: dogError } = await supabaseAdmin
      .from("portal_dogs")
      .select("id, client_id, portal_clients!inner(auth_user_id)")
      .eq("id", payload.data.dogId)
      .single();
    if (dogError || !dog) return json({ error: dogError?.message || "Dog not found." }, 404);

    const ownerUserId = Array.isArray(dog.portal_clients) ? dog.portal_clients[0]?.auth_user_id : dog.portal_clients?.auth_user_id;
    if (ownerUserId !== userId) return json({ error: "Unauthorized" }, 401);

    await allowAvatarImageUploads();

    const path = `dogs/${payload.data.dogId}/avatar/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(payload.data.fileName)}`;
    const { data, error } = await supabaseAdmin.storage.from(storageBucket).createSignedUploadUrl(path);
    if (error) return json({ error: error.message }, 502);

    const publicUrl = supabaseAdmin.storage.from(storageBucket).getPublicUrl(path).data.publicUrl;
    return json({ bucket: storageBucket, path, token: data.token, signedUrl: data.signedUrl, publicUrl, contentType: payload.data.contentType });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to prepare dog avatar upload.";
    return json({ error: message }, 502);
  }
});
