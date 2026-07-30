export const ADMIN_EMAIL = "jeroen@jeroenandpaws.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
}

export function isAdminUser(user: { email?: string } | null): boolean {
  return isAdminEmail(user?.email);
}
