import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export const TEMPORARY_ONBOARDING_EMAIL_DOMAIN = "jeroenandpaws.com";
export const TEMPORARY_ONBOARDING_EMAIL_EXEMPTIONS = ["jeroen@jeroenandpaws.com"];

export function isTemporaryOnboardingEmail(email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return false;

  return (
    normalizedEmail.endsWith(`@${TEMPORARY_ONBOARDING_EMAIL_DOMAIN}`) &&
    !TEMPORARY_ONBOARDING_EMAIL_EXEMPTIONS.includes(normalizedEmail)
  );
}

export async function getClientAccountEmail(user?: Pick<User, "id" | "email"> | null) {
  if (!user?.id) return user?.email ?? null;

  const { data, error } = await supabase
    .from("portal_clients")
    .select("email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return data?.email ?? user.email ?? null;
}

export async function isClientAccountComplete(user?: Pick<User, "id" | "email"> | null) {
  const accountEmail = await getClientAccountEmail(user);

  return !isTemporaryOnboardingEmail(accountEmail);
}

export async function getAccountSetupRouteForUser(user?: Pick<User, "id" | "email"> | null) {
  return (await isClientAccountComplete(user)) ? "/client" : "/complete-account";
}

export async function completeClientAccount(input: {
  email: string;
  password: string;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;

  const userId = userData.user?.id;
  if (!userId) {
    throw new Error("You need to be logged in.");
  }

  const { error: authError } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (authError) throw authError;

  const { error: profileError } = await supabase
    .from("portal_clients")
    .update({ email: normalizedEmail })
    .eq("auth_user_id", userId);

  if (profileError) throw profileError;
}
