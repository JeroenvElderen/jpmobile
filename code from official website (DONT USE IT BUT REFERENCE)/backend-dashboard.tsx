"use client";

import {
  Bell,
  CalendarDays,
  Dog,
  FileText,
  HelpCircle,
  Home,
  LockKeyhole,
  LogOut,
  Mail,
  ImageIcon,
  Menu,
  PawPrint,
  Search,
  ShieldCheck,
  Settings,
  Star,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { BackendBookings } from "./backend-bookings";
import { BackendDashboardOverview } from "./backend-dashboard-overview";
import { BackendPlaceholder } from "./backend-placeholder";
import { BackendServices } from "./backend-services";
import { BackendDogs } from "./backend-dogs";
import { BackendClients } from "./backend-clients";
import { BackendCalendar } from "./backend-calendar";
import { BackendInvoices } from "./backend-invoices";
import { BackendPhotoUpdates } from "./backend-photo-updates";
import { BackendFAQ } from "./backend-faq";
import { BackendSettings } from "./backend-settings";

const navGroups = [
  { label: "", items: [["dashboard", Home, "Dashboard"]] },
  { label: "Manage", items: [["bookings", CalendarDays, "Bookings"], ["services", PawPrint, "Services"], ["dogs", Dog, "Dogs"], ["clients", Users, "Clients"], ["calendar", CalendarDays, "Calendar"]] },
  { label: "Business", items: [["invoices", FileText, "Invoices"]] },
  { label: "Content", items: [["photo-updates", ImageIcon, "Photo Updates"], ["reviews", Star, "Reviews"], ["faq", HelpCircle, "FAQ"]] },
  { label: "Settings", items: [["settings", Settings, "Settings"]] },
] as const;

const backendAdminEmail = "jeroen@jeroenandpaws.com";
const backendSessionStorageKey = "jeroen-and-paws-backend-session";

type BackendSession = {
  accessToken: string;
  refreshToken: string;
  email: string;
  expiresAt: number;
};

type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  email?: string;
  user?: {
    email?: string;
  };
  msg?: string;
  error_description?: string;
  error?: string;
};

function getSupabaseAuthConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

function getSupabaseAuthError(payload: SupabaseAuthResponse, fallback: string) {
  return payload.msg ?? payload.error_description ?? payload.error ?? fallback;
}

async function getSupabaseAuthPayload(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await response.json().catch(() => ({ error: fallback }))) as SupabaseAuthResponse;
  }

  const text = await response.text().catch(() => "");
  const error = text.trim().startsWith("<")
    ? `${fallback} The server returned an HTML error page instead of JSON.`
    : text || fallback;

  return { error } satisfies SupabaseAuthResponse;
}

async function fetchBackendUserEmail(accessToken: string) {
  const authConfig = getSupabaseAuthConfig();

  if (!authConfig) return null;

  const response = await fetch(`${authConfig.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: authConfig.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await getSupabaseAuthPayload(response, "Unable to verify your backend session.");

  if (!response.ok) {
    throw new Error(getSupabaseAuthError(payload, "Unable to verify your backend session."));
  }

  return payload.email ?? payload.user?.email ?? null;
}

async function refreshBackendSession(session: BackendSession) {
  const authConfig = getSupabaseAuthConfig();

  if (!authConfig) return null;

  const response = await fetch(`${authConfig.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: authConfig.supabaseAnonKey,
      Authorization: `Bearer ${authConfig.supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  const payload = await getSupabaseAuthPayload(response, "Unable to refresh your backend session.");

  if (!response.ok || !payload.access_token) {
    throw new Error(getSupabaseAuthError(payload, "Unable to refresh your backend session."));
  }

  const email = payload.user?.email ?? session.email;

  if (email.toLowerCase() !== backendAdminEmail) {
    throw new Error("This backend is only available to the Jeroen & Paws business account.");
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? session.refreshToken,
    email,
    expiresAt: Date.now() + ((payload.expires_in ?? 3600) * 1000),
  } satisfies BackendSession;
}

function BackendAuthPrompt({ onAuthenticated }: { onAuthenticated: (session: BackendSession) => void }) {
  const [email, setEmail] = useState(backendAdminEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const authConfig = getSupabaseAuthConfig();

    if (!authConfig) {
      setErrorMessage("Connect Supabase before logging in to the backend.");
      return;
    }

    if (email.trim().toLowerCase() !== backendAdminEmail) {
      setErrorMessage("Use the Jeroen & Paws business account to access the backend.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${authConfig.supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: authConfig.supabaseAnonKey,
          Authorization: `Bearer ${authConfig.supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const payload = await getSupabaseAuthPayload(response, "Unable to log in to the backend.");

      if (!response.ok) {
        throw new Error(getSupabaseAuthError(payload, "Unable to log in to the backend."));
      }

      if (!payload.access_token || !payload.refresh_token) {
        throw new Error("Unable to keep you logged in. Please try again.");
      }

      const authenticatedEmail = payload.user?.email ?? email;

      if (authenticatedEmail.toLowerCase() !== backendAdminEmail) {
        throw new Error("This backend is only available to the Jeroen & Paws business account.");
      }

      const session = {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        email: authenticatedEmail,
        expiresAt: Date.now() + ((payload.expires_in ?? 3600) * 1000),
      } satisfies BackendSession;
      window.localStorage.setItem(backendSessionStorageKey, JSON.stringify(session));
      onAuthenticated(session);
    } catch (authError) {
      setErrorMessage(authError instanceof Error ? authError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf8] px-4 py-10 text-[#151124]">
      <section className="w-full max-w-lg rounded-[1.75rem] border border-[#151124]/10 bg-white p-8 shadow-[0_24px_70px_rgba(21,17,36,0.12)] sm:p-10">
        <div className="grid size-16 place-items-center rounded-2xl bg-[#efe8ff] text-[#4f2c91]">
          <ShieldCheck aria-hidden="true" className="size-8" />
        </div>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-[#6c4bb0]">Backend access</p>
        <h1 className="mt-3 font-serif text-4xl text-[#151124]">Log in with your business account</h1>
        <p className="mt-4 leading-7 text-[#665d70]">The backend dashboard is private and only available to {backendAdminEmail}.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-bold text-[#151124]">
            Email address
            <span className="mt-2 flex items-center gap-3 rounded-xl border border-[#151124]/12 px-4 py-4 text-[#77727c]">
              <Mail aria-hidden="true" className="size-5" />
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="w-full bg-transparent text-base font-semibold text-[#151124] outline-none" />
            </span>
          </label>

          <label className="block text-sm font-bold text-[#151124]">
            Password
            <span className="mt-2 flex items-center gap-3 rounded-xl border border-[#151124]/12 px-4 py-4 text-[#77727c]">
              <LockKeyhole aria-hidden="true" className="size-5" />
              <input type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" className="w-full bg-transparent text-base font-semibold text-[#151124] outline-none placeholder:text-[#898394]" />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="text-[#77727c]">{showPassword ? "Hide" : "Show"}</button>
            </span>
          </label>

          {errorMessage && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{errorMessage}</p>}

          <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#4f2c91] px-6 py-4 text-base font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-[#4f2c91]/20 transition hover:-translate-y-0.5 hover:bg-[#5b35a0] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
            {isSubmitting ? "Checking…" : "Log in"}<PawPrint aria-hidden="true" className="size-5" />
          </button>
        </form>
      </section>
    </main>
  );
}

type BackendView = (typeof navGroups)[number]["items"][number][0];

function getViewTitle(activeView: BackendView) {
  for (const group of navGroups) {
    const item = group.items.find(([key]) => key === activeView);

  if (item) return item[2];
  }

  return "Dashboard";
}

export function BackendDashboard() {
  const [backendSession, setBackendSession] = useState<BackendSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [activeView, setActiveView] = useState<BackendView>("dashboard");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const activeTitle = getViewTitle(activeView);

  useEffect(() => {
    queueMicrotask(() => {
      const storedSession = window.localStorage.getItem(backendSessionStorageKey);

      if (!storedSession) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const parsedSession = JSON.parse(storedSession) as BackendSession;

        if (!parsedSession.accessToken || !parsedSession.email || !parsedSession.refreshToken || parsedSession.email.toLowerCase() !== backendAdminEmail) {
          window.localStorage.removeItem(backendSessionStorageKey);
          setIsCheckingSession(false);
          return;
        }

        const sessionPromise = parsedSession.expiresAt <= Date.now() + 120_000
          ? refreshBackendSession(parsedSession)
          : fetchBackendUserEmail(parsedSession.accessToken).then((verifiedEmail) => {
              if (verifiedEmail?.toLowerCase() !== backendAdminEmail) return null;

              return parsedSession;
            });

        sessionPromise
          .then((verifiedSession) => {
            if (!verifiedSession) {
              window.localStorage.removeItem(backendSessionStorageKey);
              setBackendSession(null);
              return;
            }

            window.localStorage.setItem(backendSessionStorageKey, JSON.stringify(verifiedSession));
            setBackendSession(verifiedSession);
          })
          .catch(() => {
            window.localStorage.removeItem(backendSessionStorageKey);
            setBackendSession(null);
          })
          .finally(() => setIsCheckingSession(false));
      } catch {
        window.localStorage.removeItem(backendSessionStorageKey);
        setIsCheckingSession(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!backendSession) return;

    const refreshDelay = Math.max(0, backendSession.expiresAt - Date.now() - 120_000);
    const refreshTimer = window.setTimeout(() => {
      refreshBackendSession(backendSession)
        .then((refreshedSession) => {
          if (!refreshedSession) return;
          window.localStorage.setItem(backendSessionStorageKey, JSON.stringify(refreshedSession));
          setBackendSession(refreshedSession);
        })
        .catch(() => {
          window.localStorage.removeItem(backendSessionStorageKey);
          setBackendSession(null);
        });
    }, refreshDelay);

    return () => window.clearTimeout(refreshTimer);
  }, [backendSession]);

  if (isCheckingSession) {
    return <main className="grid min-h-screen place-items-center bg-[#fbfaf8] text-sm font-bold uppercase tracking-[0.18em] text-[#4f2c91]">Checking backend access…</main>;
  }

  if (!backendSession) {
    return <BackendAuthPrompt onAuthenticated={setBackendSession} />;
  }

  function handleNavChange(view: BackendView) {
    setActiveView(view);
    setIsMobileNavOpen(false);
  }

  const ActiveContent = (() => {
    if (activeView === "dashboard") return <BackendDashboardOverview accessToken={backendSession.accessToken} />;
    if (activeView === "bookings") return <BackendBookings accessToken={backendSession.accessToken} />;
    if (activeView === "services") return <BackendServices accessToken={backendSession.accessToken} />;
    if (activeView === "dogs") return <BackendDogs accessToken={backendSession.accessToken} />;
    if (activeView === "clients") return <BackendClients accessToken={backendSession.accessToken} />;
    if (activeView === "calendar") return <BackendCalendar accessToken={backendSession.accessToken} />;
    if (activeView === "invoices") return <BackendInvoices accessToken={backendSession.accessToken} />;
    if (activeView === "photo-updates") return <BackendPhotoUpdates accessToken={backendSession.accessToken} />;
    if (activeView === "faq") return <BackendFAQ />;
    if (activeView === "settings") return <BackendSettings />;

    return <BackendPlaceholder title={activeTitle} />;
  })();

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#151124]">
      <div className="grid min-h-screen xl:grid-cols-[18rem_1fr]">
        <aside className="hidden bg-[#070a14] px-6 py-8 text-white xl:flex xl:flex-col">
          <div className="font-serif text-3xl leading-tight">jeroen<br />And Paws <PawPrint className="inline size-6 text-[#b8a1ff]" /></div>
          <nav className="mt-10 flex flex-1 flex-col gap-7" aria-label="Backend portal navigation">
            {navGroups.map((group) => (
              <div key={group.label || "main"}>
                {group.label && <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/58">{group.label}</p>}
                <div className="space-y-1.5">
                  {group.items.map(([key, Icon, label]) => {
                    const isActive = activeView === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => handleNavChange(key)}
                        className={`flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left text-sm font-semibold ${isActive ? "bg-[#4f2c91] text-white shadow-lg shadow-[#4f2c91]/30" : "text-white/88 hover:bg-white/8"}`}
                      >
                        <Icon className="size-5" /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="relative flex h-20 items-center justify-between border-b border-[#151124]/10 bg-white/86 px-5 backdrop-blur md:px-10">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-[#151124]/10 px-3 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#4f2c91] xl:hidden"
              aria-controls="backend-mobile-navigation"
              aria-expanded={isMobileNavOpen}
              onClick={() => setIsMobileNavOpen((current) => !current)}
            >
              <Menu className="size-5" /> Menu
            </button>
            <Menu className="hidden size-6 xl:block" />
            <div className="flex items-center gap-5"><span className="hidden text-sm font-semibold text-[#665d70] md:inline">{backendSession.email}</span><button type="button" onClick={() => { window.localStorage.removeItem(backendSessionStorageKey); setBackendSession(null); setActiveView("dashboard"); setIsMobileNavOpen(false); }} className="inline-flex items-center gap-2 rounded-lg border border-[#151124]/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4f2c91]"><LogOut className="size-4" /> Log out</button><Bell className="size-5 text-[#3c246c]" /><label className="hidden items-center gap-3 rounded-lg border border-[#151124]/10 bg-white px-4 py-3 text-sm text-[#858093] shadow-sm sm:flex"><input className="w-56 bg-transparent outline-none" placeholder={activeView === "bookings" ? "Search bookings, clients, dogs..." : `Search ${activeTitle.toLowerCase()}...`} /><Search className="size-5" /></label></div>
          </header>

          {isMobileNavOpen && (
            <nav id="backend-mobile-navigation" className="border-b border-[#151124]/10 bg-[#070a14] px-5 py-5 text-white shadow-xl xl:hidden" aria-label="Backend portal mobile navigation">
              <div className="grid gap-5 sm:grid-cols-2">
                {navGroups.map((group) => (
                  <div key={group.label || "main"}>
                    {group.label && <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/58">{group.label}</p>}
                    <div className="space-y-1.5">
                      {group.items.map(([key, Icon, label]) => {
                        const isActive = activeView === key;

                        return (
                          <button
                            key={key}
                            type="button"
                            aria-current={isActive ? "page" : undefined}
                            onClick={() => handleNavChange(key)}
                            className={`flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left text-sm font-semibold ${isActive ? "bg-[#4f2c91] text-white shadow-lg shadow-[#4f2c91]/30" : "text-white/88 hover:bg-white/8"}`}
                          >
                            <Icon className="size-5" /> {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </nav>
          )}

          {ActiveContent}
        </div>
      </div>
    </main>
  );
}