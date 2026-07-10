"use client";

import { CalendarDays, Camera, CircleHelp, Eye, EyeOff, FileText, Home, ImageIcon, LockKeyhole, LogOut, Mail, PawPrint, ShieldCheck, Star, User, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Dashboard } from "./dashboard";
import { FAQ } from "./faq";
import { Invoices } from "./invoices";
import { MyBookings } from "./my-bookings";
import { Profile } from "./profile";
import { SessionGalleries } from "./session-galleries";

const navItems = [
  ["dashboard", Home, "Dashboard"],
  ["bookings", CalendarDays, "My Bookings"],
  ["photos", ImageIcon, "Session Galleries"],
  ["invoices", FileText, "Invoices"],
  ["profile", User, "Profile"],
  ["faq", CircleHelp, "FAQ"],
] as const;

type PortalView = (typeof navItems)[number][0];

type PortalSession = {
  accessToken: string;
  refreshToken: string;
  email: string;
  expiresAt: number;
};

type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    email?: string;
  };
  msg?: string;
  error_description?: string;
  error?: string;
};

const portalSessionStorageKey = "jeroen-and-paws-portal-session";

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

function getPortalEmailRedirectTo() {
  return typeof window !== "undefined" ? `${window.location.origin}/portal` : undefined;
}

async function refreshPortalSession(session: PortalSession) {
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
  const payload = await getSupabaseAuthPayload(response, "Unable to refresh your portal session.");

  if (!response.ok || !payload.access_token) {
    throw new Error(getSupabaseAuthError(payload, "Unable to refresh your portal session."));
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? session.refreshToken,
    email: payload.user?.email ?? session.email,
    expiresAt: Date.now() + ((payload.expires_in ?? 3600) * 1000),
  } satisfies PortalSession;
}

function PortalAuthPrompt({ onAuthenticated }: { onAuthenticated: (session: PortalSession) => void }) {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    const authConfig = getSupabaseAuthConfig();

    if (!authConfig) {
      setErrorMessage("The client portal is not ready for sign in yet. Please try again later.");
      return;
    }

    if (authMode === "signup" && password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const emailRedirectTo = getPortalEmailRedirectTo();
      const response = authMode === "signup"
        ? await fetch("/api/portal/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, email, password, redirectTo: emailRedirectTo }),
        })
        : await fetch(`${authConfig.supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: {
            apikey: authConfig.supabaseAnonKey,
            Authorization: `Bearer ${authConfig.supabaseAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
      const payload = await getSupabaseAuthPayload(response, authMode === "login" ? "Unable to log in." : "Unable to sign up.");

      if (!response.ok) {
        throw new Error(getSupabaseAuthError(payload, authMode === "login" ? "Unable to log in." : "Unable to sign up."));
      }

      if (authMode === "signup") {
        setConfirmationEmail(email);
        setStatusMessage("Account created. Please check your email and click the confirmation button, then log in.");
        setAuthMode("login");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      if (!payload.access_token) {
        throw new Error("Unable to log in. Please confirm your email address first.");
      }

      if (!payload.refresh_token) {
        throw new Error("Unable to keep you logged in. Please try again.");
      }

      const session = {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        email: payload.user?.email ?? email,
        expiresAt: Date.now() + ((payload.expires_in ?? 3600) * 1000),
      };
      window.localStorage.setItem(portalSessionStorageKey, JSON.stringify(session));
      onAuthenticated(session);
    } catch (authError) {
      setErrorMessage(authError instanceof Error ? authError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    const authConfig = getSupabaseAuthConfig();
    const resendEmail = (confirmationEmail || email).trim();

    setErrorMessage(null);
    setStatusMessage(null);

    if (!authConfig) {
      setErrorMessage("The client portal is not ready to resend confirmation emails yet. Please try again later.");
      return;
    }

    if (!resendEmail) {
      setErrorMessage("Enter your email address first, then resend the confirmation email.");
      return;
    }

    setIsResendingConfirmation(true);

    try {
      const response = await fetch("/api/portal/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail, redirectTo: getPortalEmailRedirectTo() }),
      });
      const payload = await getSupabaseAuthPayload(response, "Unable to resend the confirmation email right now.");

      if (!response.ok) {
        throw new Error(getSupabaseAuthError(payload, "Unable to resend the confirmation email right now."));
      }

      setConfirmationEmail(resendEmail);
      setStatusMessage("Confirmation email sent again. Please check your inbox and spam folder.");
    } catch (resendError) {
      setErrorMessage(resendError instanceof Error ? resendError.message : "Unable to resend the confirmation email right now.");
    } finally {
      setIsResendingConfirmation(false);
    }
  }

  function handleOAuthSignIn(provider: "google" | "apple") {
    const authConfig = getSupabaseAuthConfig();

    if (!authConfig) {
      setErrorMessage("Social sign in is not ready yet. Please try again later.");
      return;
    }

    const redirectTo = encodeURIComponent(window.location.href);
    window.location.href = `${authConfig.supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${redirectTo}`;
  }

  const trustFeatures = [
    [ShieldCheck, "Trusted & Insured", "Fully insured and dedicated to your dog’s safety."],
    [CalendarDays, "Easy Booking", "Book walks and training in just a few taps."],
    [Camera, "Photo Updates", "Visit notes and photos after every visit."],
  ] as const;

  return (
    <main className="min-h-screen bg-[#f7f4ef] p-3 text-[#1d1728] sm:p-4">
      <section className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[94rem] overflow-hidden rounded-[2rem] bg-white shadow-[0_22px_80px_rgba(29,23,40,0.12)] lg:grid-cols-[1.05fr_1fr]">
        <div className="relative hidden min-h-[48rem] overflow-hidden bg-[#171406] text-white lg:block">
          <Image src="/images/dogs/walk.jpeg" alt="Dog walking on a woodland path" fill sizes="50vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-[#151303]/80 via-[#151303]/35 to-[#151303]/10" />
          <div className="absolute inset-0 px-12 py-10">
            <Link href="/" className="font-serif text-4xl leading-tight tracking-wide text-white drop-shadow-md">
              Jeroen<br />And Paws <PawPrint aria-hidden="true" className="ml-2 inline size-6 text-[#c4a7ff]" />
            </Link>

            <div className="mt-24 max-w-lg">
              <p className="font-serif text-6xl leading-[1.08] tracking-[-0.03em] text-white drop-shadow-lg">Happy dogs,<br />better lives. <span className="text-[#c4a7ff]">♡</span></p>
              <p className="mt-6 max-w-sm text-2xl font-medium leading-9 text-white">Professional walks, training and care you can trust.</p>
            </div>

            <div className="mt-12 space-y-7">
              {trustFeatures.map(([Icon, title, copy]) => (
                <div key={title} className="flex max-w-md items-center gap-5">
                  <span className="grid size-16 shrink-0 place-items-center rounded-full bg-white/90 text-[#5b2aa0] shadow-lg">
                    <Icon aria-hidden="true" className="size-7" />
                  </span>
                  <span>
                    <span className="block text-lg font-bold text-[#e9d7ff]">{title}</span>
                    <span className="mt-2 block text-base leading-7 text-white">{copy}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[48rem] items-center bg-white px-6 py-10 sm:px-10 lg:px-20">
          <div className="pointer-events-none absolute -left-10 top-0 hidden h-full w-24 rounded-[50%] border-l-4 border-[#7c3ab6] bg-white lg:block" />
          <div className="pointer-events-none absolute -left-8 top-1/2 z-10 hidden size-20 -translate-y-1/2 place-items-center rounded-full border-4 border-[#f2eef7] bg-white text-[#5b2aa0] shadow-xl lg:grid">
            <PawPrint aria-hidden="true" className="size-10" />
          </div>

          <div className="mx-auto w-full max-w-xl">
            <div className="grid grid-cols-2 border-b border-[#e5deea] text-center">
              <button type="button" onClick={() => setAuthMode("signup")} className={`pb-5 text-lg font-bold transition ${authMode === "signup" ? "border-b-4 border-[#4c1d95] text-[#4c1d95]" : "text-[#6f687a]"}`}>
                <UserPlus aria-hidden="true" className="mx-auto mb-3 size-8" /> Sign Up
              </button>
              <button type="button" onClick={() => setAuthMode("login")} className={`pb-5 text-lg font-bold transition ${authMode === "login" ? "border-b-4 border-[#4c1d95] text-[#4c1d95]" : "text-[#6f687a]"}`}>
                <PawPrint aria-hidden="true" className="mx-auto mb-3 size-8" /> Log In
              </button>
            </div>

            <div className="mt-12">
              <h1 className="font-serif text-4xl leading-tight text-[#151b36]">{authMode === "signup" ? "Create your account" : "Welcome back!"} <span className="text-[#9b5fd4]">♡</span></h1>
              <p className="mt-2 text-lg text-[#767083]">{authMode === "signup" ? "Join our pack and get started!" : "Log in to your account to continue"}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {authMode === "signup" && (
                <label className="block text-sm font-bold text-[#151b36]">
                  Full name
                  <span className="mt-2 flex items-center gap-3 rounded-xl border border-[#e8dfe4] px-4 py-4 text-[#77727c]">
                    <User aria-hidden="true" className="size-6" />
                    <input type="text" required value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Enter your full name" className="w-full bg-transparent text-base font-medium text-[#151b36] outline-none placeholder:text-[#898394]" />
                  </span>
                </label>
              )}

              <label className="block text-sm font-bold text-[#151b36]">
                Email address
                <span className="mt-2 flex items-center gap-3 rounded-xl border border-[#e8dfe4] px-4 py-4 text-[#77727c]">
                  <Mail aria-hidden="true" className="size-6" />
                  <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="Enter your email" className="w-full bg-transparent text-base font-medium text-[#151b36] outline-none placeholder:text-[#898394]" />
                </span>
              </label>

              <label className="block text-sm font-bold text-[#151b36]">
                Password
                <span className="mt-2 flex items-center gap-3 rounded-xl border border-[#e8dfe4] px-4 py-4 text-[#77727c]">
                  <LockKeyhole aria-hidden="true" className="size-6" />
                  <input type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={authMode === "login" ? "current-password" : "new-password"} placeholder={authMode === "login" ? "Enter your password" : "Create a password"} className="w-full bg-transparent text-base font-medium text-[#151b36] outline-none placeholder:text-[#898394]" />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} className="text-[#77727c]">{showPassword ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}</button>
                </span>
                {authMode === "signup" && <span className="mt-2 flex items-center gap-2 text-sm font-medium text-[#958a9d]"><ShieldCheck aria-hidden="true" className="size-5 text-[#b288d8]" /> At least 6 characters.</span>}
              </label>

              {authMode === "signup" && (
                <label className="block text-sm font-bold text-[#151b36]">
                  Confirm password
                  <span className="mt-2 flex items-center gap-3 rounded-xl border border-[#e8dfe4] px-4 py-4 text-[#77727c]">
                    <LockKeyhole aria-hidden="true" className="size-6" />
                    <input type={showPassword ? "text" : "password"} required minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Confirm your password" className="w-full bg-transparent text-base font-medium text-[#151b36] outline-none placeholder:text-[#898394]" />
                  </span>
                </label>
              )}

              {authMode === "login" && <button type="button" className="ml-auto block text-sm font-bold text-[#5b2aa0]">Forgot password?</button>}
              {errorMessage && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{errorMessage}</p>}
              {statusMessage && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{statusMessage}</p>}
              {authMode === "login" && (confirmationEmail || statusMessage?.toLowerCase().includes("confirm")) && (
                <button type="button" onClick={handleResendConfirmation} disabled={isResendingConfirmation} className="w-full rounded-xl border border-[#d8c7ef] bg-[#f7f1ff] px-4 py-3 text-sm font-bold text-[#5b2aa0] transition hover:border-[#b288d8] hover:bg-[#efe2ff] disabled:cursor-not-allowed disabled:opacity-60">
                  {isResendingConfirmation ? "Resending confirmation email…" : "Resend confirmation email"}
                </button>
              )}

              <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#4c1d95] px-6 py-5 text-lg font-bold text-white shadow-lg shadow-[#4c1d95]/20 transition hover:-translate-y-0.5 hover:bg-[#5b2aa0] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
                {isSubmitting ? "Please wait…" : authMode === "login" ? "Log In" : "Sign Up"}<PawPrint aria-hidden="true" className="ml-auto size-7" />
              </button>
            </form>

            <p className="mt-7 text-center text-base text-[#767083]">
              {authMode === "login" ? "Don’t have an account?" : "Already have an account?"} <button type="button" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} className="font-bold text-[#4c1d95]">{authMode === "login" ? "Sign up" : "Log in"}</button>
            </p>
            <p className="mt-7 flex items-center justify-center gap-3 text-sm text-[#767083]"><span className="grid size-11 place-items-center rounded-full bg-[#f1e9ff] text-[#5b2aa0]"><ShieldCheck aria-hidden="true" className="size-5" /></span><span><strong className="block text-[#767083]">Your data is safe with us.</strong>We never share your information.</span></p>
          </div>
        </div>
      </section>
    </main>
  );
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="px-4 py-5 sm:px-8 lg:px-10 lg:py-8">
      <section className="mx-auto max-w-6xl rounded-[1.4rem] border border-[#24163f]/10 bg-white p-8 shadow-[0_20px_60px_rgba(29,23,40,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#6d4b9b]">Portal</p>
        <h1 className="mt-4 text-3xl font-semibold text-[#2d2140]">{title}</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[#665d70]">
          This portal section is ready to become its own component when the content is designed.
        </p>
      </section>
    </div>
  );
}

export function PortalShell() {
  const [portalSession, setPortalSession] = useState<PortalSession | null>(null);
  const [activeView, setActiveView] = useState<PortalView>("dashboard");

  useEffect(() => {
    queueMicrotask(() => {
      const storedSession = window.localStorage.getItem(portalSessionStorageKey);

      if (!storedSession) return;

      try {
        const parsedSession = JSON.parse(storedSession) as PortalSession;

        if (parsedSession.accessToken && parsedSession.email && parsedSession.refreshToken) {
          setPortalSession(parsedSession);
        } else {
          window.localStorage.removeItem(portalSessionStorageKey);
        }
      } catch {
        window.localStorage.removeItem(portalSessionStorageKey);
      }
    });
  }, []);

   useEffect(() => {
    if (!portalSession) return;

    const refreshDelay = Math.max(0, portalSession.expiresAt - Date.now() - 120_000);
    const refreshTimer = window.setTimeout(() => {
      refreshPortalSession(portalSession)
        .then((refreshedSession) => {
          if (!refreshedSession) return;
          window.localStorage.setItem(portalSessionStorageKey, JSON.stringify(refreshedSession));
          setPortalSession(refreshedSession);
        })
        .catch(() => {
          window.localStorage.removeItem(portalSessionStorageKey);
          setPortalSession(null);
        });
    }, refreshDelay);

    return () => window.clearTimeout(refreshTimer);
  }, [portalSession]);
  
  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
  }, [activeView]);

  if (!portalSession) {
    return <PortalAuthPrompt onAuthenticated={setPortalSession} />;
  }

  const ActiveContent = (() => {
    if (activeView === "dashboard") return <Dashboard accessToken={portalSession.accessToken} />;
    if (activeView === "bookings") return <MyBookings accessToken={portalSession.accessToken} />;
    if (activeView === "photos") {
      return <SessionGalleries accessToken={portalSession.accessToken} onBackToDashboard={() => setActiveView("dashboard")} />;
    }
    if (activeView === "invoices") return <Invoices accessToken={portalSession.accessToken} />;
    if (activeView === "profile") {
      return <Profile accessToken={portalSession.accessToken} onBackToDashboard={() => setActiveView("dashboard")} />;
    }
    if (activeView === "faq") {
      return <FAQ accessToken={portalSession.accessToken} onBackToDashboard={() => setActiveView("dashboard")} />;
    }

    const current = navItems.find(([key]) => key === activeView);
    return <PlaceholderView title={current?.[2] ?? "Portal"} />;
  })();

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#1d1728]">
      <div className="grid min-h-screen lg:grid-cols-[17.5rem_1fr]">
        <aside className="hidden bg-[#080b10] text-[#fff7e8] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
          <nav className="mt-6 flex flex-1 flex-col gap-2 px-5" aria-label="Customer portal navigation">
            {navItems.map(([key, Icon, label]) => {
              const isActive = activeView === key;

              return (
                <button
                  key={key}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActiveView(key)}
                  className={`group flex items-center gap-4 rounded-xl px-5 py-4 text-left text-sm font-bold transition ${isActive ? "bg-[#24163f] text-white shadow-lg shadow-[#000]/20" : "text-[#f5e9d5]/85 hover:bg-white/[0.06] hover:text-white"}`}
                >
                  <Icon aria-hidden="true" className="size-5 text-[#c4b5fd] transition group-hover:scale-105" />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="mx-5 mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="p-5">
              <p className="font-semibold text-[#c4b5fd]">Need help?</p>
              <p className="mt-2 text-sm leading-6 text-[#f5e9d5]/80">Message us anytime about a booking, photo, or care note.</p>
              <Link href="/contact" className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#6d4b9b] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white">
                Send a message <PawPrint aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <div className="relative h-36">
              <Image src="/images/dogs/walk.jpeg" alt="Jeroen walking dogs through woodland" fill sizes="280px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080b10]" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              window.localStorage.removeItem(portalSessionStorageKey);
              setPortalSession(null);
              setActiveView("dashboard");
            }}
            className="mb-6 ml-8 inline-flex items-center gap-4 text-sm font-black uppercase tracking-[0.16em] text-[#f5e9d5]/90"
          >
            <LogOut aria-hidden="true" className="size-5 text-[#c4b5fd]" /> Log out
          </button>
        </aside>

        <div className="min-w-0">
          <nav className="border-b border-[#24163f]/10 bg-white/75 px-4 py-3 backdrop-blur lg:hidden" aria-label="Mobile customer portal navigation">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {navItems.map(([key, Icon, label]) => {
                const isActive = activeView === key;

                return (
                  <button
                    key={key}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setActiveView(key)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition ${isActive ? "border-[#4d2e91] bg-[#24163f] text-white" : "border-[#24163f]/10 bg-white text-[#3a3048]"}`}
                  >
                    <Icon aria-hidden="true" className="size-4 text-[#c4b5fd]" />
                    {label}
                  </button>
                );
              })}
            </div>
          </nav>

          {ActiveContent}
        </div>
      </div>
    </main>
  );
}
