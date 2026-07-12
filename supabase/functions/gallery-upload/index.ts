import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";
import { z } from "https://esm.sh/zod@4.4.3";

const backendAdminEmail = "jeroen@jeroenandpaws.com";
const storageBucket = "portal-images";
let bucketLimitPromise: Promise<void> | null = null;

type SupabaseAuthUser = { email?: string; user?: { email?: string } };

const uploadRequestSchema = z.object({
  galleryId: z.string().uuid(),
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

async function getVerifiedBackendAdminToken(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!accessToken || !supabaseUrl || !anonKey) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as SupabaseAuthUser | null;
  const email = payload?.email ?? payload?.user?.email;
  return email?.toLowerCase() === backendAdminEmail ? accessToken : null;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function getAdminClient() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function allowUnlimitedImageUploads() {
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
    if (!(await getVerifiedBackendAdminToken(request))) return json({ error: "Unauthorized" }, 401);

    const payload = uploadRequestSchema.safeParse(await request.json().catch(() => null));
    if (!payload.success) return json({ error: payload.error.issues[0]?.message || "Invalid upload request." }, 400);

    const supabaseAdmin = getAdminClient();
    const { data: gallery, error: galleryError } = await supabaseAdmin.from("portal_galleries").select("id").eq("id", payload.data.galleryId).single();
    if (galleryError || !gallery) return json({ error: galleryError?.message || "Gallery not found." }, 404);

    await allowUnlimitedImageUploads();

    const path = `galleries/${payload.data.galleryId}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(payload.data.fileName)}`;
    const { data, error } = await supabaseAdmin.storage.from(storageBucket).createSignedUploadUrl(path);
    if (error) return json({ error: error.message }, 502);

    const publicUrl = supabaseAdmin.storage.from(storageBucket).getPublicUrl(path).data.publicUrl;
    return json({ bucket: storageBucket, path, token: data.token, signedUrl: data.signedUrl, publicUrl, contentType: payload.data.contentType });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to prepare gallery upload.";
    return json({ error: message }, 502);
  }
});
