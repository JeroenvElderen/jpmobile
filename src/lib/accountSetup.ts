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

export function getAccountSetupRouteForUser(user?: Pick<User, "email"> | null) {
  return isTemporaryOnboardingEmail(user?.email) ? "/complete-account" : "/client";
}

export async function completeClientAccount(input: {
  email: string;
  password: string;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();

  try {
    console.log("1. Starting account completion");

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    console.log("2. getUser finished", {
      user: userData.user?.id,
      error: userError,
    });

    if (userError) throw userError;

    const userId = userData.user?.id;
    if (!userId) {
      throw new Error("You need to be logged in.");
    }

    console.log("3. Updating PASSWORD ONLY");

    const { data, error: authError } =
  await supabase.auth.updateUser({
    email: normalizedEmail,
  });

    console.log("4. updateUser returned", {
      data,
      authError,
    });

    if (authError) throw authError;

    console.log("5. Updating portal_clients");

    const { error: profileError } = await supabase
      .from("portal_clients")
      .update({ email: normalizedEmail })
      .eq("auth_user_id", userId);

    console.log("6. portal_clients finished", {
      profileError,
    });

    if (profileError) throw profileError;

    console.log("7. Done!");
  } catch (e) {
    console.error("completeClientAccount failed:", e);
    throw e;
  }
}