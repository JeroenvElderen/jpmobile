function required(name: string, value: string | undefined): string {
  const normalized = value?.trim().replace(/\/+$/, "");
  if (!normalized) throw new Error(`Missing ${name}. Add it to your Expo environment before starting the app.`);
  return normalized;
}

export const config = Object.freeze({
  apiBaseUrl: required("EXPO_PUBLIC_API_BASE_URL", process.env.EXPO_PUBLIC_API_BASE_URL),
  supabaseUrl: required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required("EXPO_PUBLIC_SUPABASE_ANON_KEY", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
});
