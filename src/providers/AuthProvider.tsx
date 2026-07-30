import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { AuthContext } from "@/contexts/AuthContext";
import { isEmailIdentifier, normalizePhone } from "@/lib/authValidation";
import { supabase } from "@/lib/supabase";

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setInitializing] = useState(true);
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setInitializing(false); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => { if (active) { setSession(next); setInitializing(false); } });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  const signIn = useCallback(async (identifier: string, password: string) => {
    const trimmed = identifier.trim();
    const credentials = isEmailIdentifier(trimmed) ? { email: trimmed, password } : { phone: normalizePhone(trimmed), password };
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (error) throw new Error(error.message);
  }, []);
  const signOut = useCallback(async () => { const { error } = await supabase.auth.signOut(); if (error) throw new Error(error.message); }, []);
  const installSession = useCallback(async (accessToken: string, refreshToken: string) => {
    const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error || !data.session) throw new Error(error?.message ?? "A valid session could not be created.");
  }, []);
  const value = useMemo(() => ({ session, user: session?.user ?? null, isInitializing, isAuthenticated: Boolean(session), signIn, signOut, installSession }), [installSession, isInitializing, session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
