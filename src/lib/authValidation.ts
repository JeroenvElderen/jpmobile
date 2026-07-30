export const isEmailIdentifier = (value: string) => value.includes("@");
export const normalizePhone = (value: string) => value.trim().replace(/[\s().-]/g, "");
export const filterOtp = (value: string) => value.replace(/\D/g, "").slice(0, 6);
export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const isValidPhone = (value: string) => /^\+[1-9]\d{7,14}$/.test(normalizePhone(value));

type Common = { inviteCode: string; fullName: string; password: string; confirmPassword: string };
export function validateCommon(input: Common): string | null {
  if (input.inviteCode.trim().length < 8) return "Invite code must be at least 8 characters.";
  const nameLength = input.fullName.trim().length;
  if (nameLength < 1 || nameLength > 120) return "Full name must be between 1 and 120 characters.";
  if (input.password.length < 8 || input.password.length > 128) return "Password must be between 8 and 128 characters.";
  if (input.password !== input.confirmPassword) return "Passwords do not match.";
  return null;
}

export function extractInvite(url: string): string | null {
  const match = url.match(/[?&]invite=([^&#]+)/);
  if (!match) return null;
  try { return decodeURIComponent(match[1]).trim() || null; } catch { return null; }
}

export const isRegistrationLink = (url: string): boolean => /\/register\/?(?:[?#]|$)/i.test(url);
