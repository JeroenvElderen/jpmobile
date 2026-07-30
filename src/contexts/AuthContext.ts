import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type AuthContextValue = {
  session: Session | null; user: User | null; isInitializing: boolean; isAuthenticated: boolean;
  signIn(identifier: string, password: string): Promise<void>; signOut(): Promise<void>;
  installSession(accessToken: string, refreshToken: string): Promise<void>;
};
export const AuthContext = createContext<AuthContextValue | null>(null);
