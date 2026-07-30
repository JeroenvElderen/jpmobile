import { config } from "@/lib/config";

export class AuthApiError extends Error {
  constructor(message: string, readonly kind: "server" | "network" | "timeout" | "malformed", readonly status?: number) { super(message); }
}
export type StartPhoneInput = { inviteCode: string; fullName: string; phone: string; email?: string };
export type StartPhoneResult = { challengeId: string; expiresAt: string };
export type VerifyPhoneInput = { challengeId: string; code: string; password: string; redirectTo: string };
export type VerifyPhoneResult = { accessToken: string; refreshToken: string; expiresIn: number; user: { phone: string; emailConfirmationSent: boolean } };
export type RegisterEmailInput = { inviteCode: string; fullName: string; email: string; password: string; redirectTo: string };

async function post<T>(path: string, body: object, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${config.apiBaseUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new AuthApiError("The request timed out. Please try again.", "timeout");
    throw new AuthApiError("You appear to be offline. Check your connection and try again.", "network");
  } finally { clearTimeout(timer); }
  const text = await response.text();
  let payload: unknown;
  try { payload = text ? JSON.parse(text) : null; } catch { throw new AuthApiError("The server returned an unexpected response. Please try again.", "malformed", response.status); }
  if (!response.ok) {
    const serverMessage = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : null;
    const fallback = response.status === 429 ? "Too many attempts. Please wait and try again." : "We could not complete your request. Please try again.";
    throw new AuthApiError(serverMessage ?? fallback, "server", response.status);
  }
  if (!payload || typeof payload !== "object") throw new AuthApiError("The server returned an unexpected response. Please try again.", "malformed", response.status);
  return payload as T;
}
export const startPhoneRegistration = (input: StartPhoneInput) => post<StartPhoneResult>("/api/portal/auth/start", input);
export const verifyPhoneRegistration = (input: VerifyPhoneInput) => post<VerifyPhoneResult>("/api/portal/auth/verify", input);
export const registerByEmail = (input: RegisterEmailInput) => post<{ ok: true }>("/api/portal/auth/register-email", input);
