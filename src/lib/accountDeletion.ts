import { getFunctionErrorMessage } from "@/lib/functionErrors";
import { supabase } from "@/lib/supabase";

export async function deleteAccount(confirmationEmail: string) {
  const { error, response } = await supabase.functions.invoke("delete-account", {
    body: { email: confirmationEmail.trim().toLowerCase() },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error, "We could not delete your account. Please try again.", response));
  }
}
