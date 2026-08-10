export const isEmailIdentifier = (value: string) => value.includes("@");
export const normalizePhone = (value: string) => value.trim().replace(/[\s().-]/g, "");
export const filterOtp = (value: string) => value.replace(/\D/g, "").slice(0, 6);
export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const isValidPhone = (value: string) => /^\+[1-9]\d{7,14}$/.test(normalizePhone(value));

const portalInvitePattern = /^([a-z0-9]+(?:-[a-z0-9]+)*(?:&[a-z0-9]+(?:-[a-z0-9]+)*)*)-jeroen&paws-(\d{4})$/i;

/** Normalizes codes produced by the website's createPortalRegistrationCode helper. */
export const normalizePortalInviteCode = (value: string) => {
  const trimmed = value.trim();
  const match = portalInvitePattern.exec(trimmed);
  if (!match) return trimmed;
  return `${match[1].toUpperCase()}-Jeroen&Paws-${match[2]}`;
};

export const isValidPortalInviteCode = (value: string) => portalInvitePattern.test(value.trim());

/** Converts an Irish local mobile number (for example 083 301 1988) to E.164. */
export const normalizeIrishPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const nationalNumber = digits.startsWith("353") ? digits.slice(3) : digits.replace(/^0/, "");
  return `+353${nationalNumber}`;
};

export const isValidIrishPhone = (value: string) => /^\+3538\d{8}$/.test(normalizeIrishPhone(value));

type Common = { inviteCode: string; fullName: string; password: string; confirmPassword: string };
export function validateCommon(input: Common): string | null {
  if (!isValidPortalInviteCode(input.inviteCode)) return "Enter the invite code exactly as it was provided.";
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
