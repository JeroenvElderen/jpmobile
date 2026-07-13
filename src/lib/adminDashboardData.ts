import type { Ionicons } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";

export type AdminDashboardStat = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
};

export type AdminScheduleItem = {
  id: string;
  time: string;
  period: string;
  dog: string;
  service: string;
  status: string;
  location: string;
  avatar: string;
};

export type AdminActivityItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
  time: string;
};

export type AdminFormClientOption = { id: string; name: string; address: string };
export type AdminFormDogOption = { id: string; ids: string[]; name: string };

export type AdminDashboardData = {
  stats: AdminDashboardStat[];
  schedule: AdminScheduleItem[];
  bookingTrend: number[];
  revenueTrend: number[];
  activities: AdminActivityItem[];
  notificationCount: number;
  monthLabel?: string;
  formOptions?: {
    clients: AdminFormClientOption[];
    dogsByClient: Record<string, AdminFormDogOption[]>;
    services: string[];
  };
};

type AdminDashboardResponse = {
  data?: AdminDashboardData;
  error?: string;
};

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  return invokeAdminDashboard({ type: "fetch" });
}

export async function createAdminClient(input: { fullName: string; email: string; phone?: string }) {
  await invokeAdminDashboard({ type: "create-client", payload: input });
}

export async function updateAdminClient(input: { clientId: string; fullName: string; email: string }) {
  await invokeAdminDashboard({ type: "update-client", payload: input });
}

export async function deleteAdminClient(clientId: string) {
  await invokeAdminDashboard({ type: "delete-client", payload: { clientId } });
}

export async function createAdminDog(input: { clientId: string; name: string; breed?: string; age?: string; notes?: string }) {
  await invokeAdminDashboard({ type: "create-dog", payload: input });
}

export async function createAdminBooking(input: { clientId: string; dogId?: string; dogIds?: string[]; serviceName: string; startsAt: string; location?: string; notes?: string }) {
  await invokeAdminDashboard({ type: "create-booking", payload: input });
}

export async function updateAdminBooking(input: { bookingId: string; clientId?: string; dogId?: string; dogIds?: string[]; serviceName?: string; startsAt?: string; location?: string; notes?: string; status?: string }) {
  await invokeAdminDashboard({ type: "update-booking", payload: input });
}

export async function cancelAdminBooking(bookingId: string) {
  await invokeAdminDashboard({ type: "cancel-booking", payload: { bookingId } });
}

export async function confirmAdminBooking(bookingId: string) {
  await invokeAdminDashboard({ type: "confirm-booking", payload: { bookingId } });
}

export async function rescheduleAdminBooking(bookingId: string, startsAt: string) {
  await invokeAdminDashboard({ type: "reschedule-booking", payload: { bookingId, startsAt } });
}

export async function setAdminDogStatus(dogId: string, active: boolean) {
  await invokeAdminDashboard({ type: "set-dog-status", payload: { dogId, active } });
}

export async function updateAdminDogInfo(input: { dogId: string; breed?: string; age?: string; notes?: string }) {
  await invokeAdminDashboard({ type: "update-dog", payload: input });
}

export async function deleteAdminDog(dogId: string) {
  await invokeAdminDashboard({ type: "delete-dog", payload: { dogId } });
}

export async function setAdminClientStatus(clientId: string, active: boolean) {
  await invokeAdminDashboard({ type: "set-client-status", payload: { clientId, active } });
}

async function invokeAdminDashboard(body: Record<string, unknown>) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error("Log in again before opening the admin dashboard.");
  }

  const { data, error, response } = await supabase.functions.invoke<AdminDashboardResponse>("admin-dashboard", {
    body,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.data) {
    throw new Error("Admin dashboard returned no data.");
  }

  return data.data;
}

async function getFunctionErrorMessage(error: unknown, response?: Response) {
  const fallback = error instanceof Error && error.message ? error.message : "Admin dashboard request failed.";
  const context = typeof error === "object" && error !== null && "context" in error ? (error as { context?: unknown }).context : undefined;
  const errorResponse = isResponseLike(response) ? response : isResponseLike(context) ? context : undefined;

  if (errorResponse) {
    const message = await readErrorResponse(errorResponse);
    if (message) return message;
  }

  return fallback;
}

function isResponseLike(value: unknown): value is Response {
  return typeof value === "object" && value !== null && "ok" in value && "status" in value && "json" in value && "text" in value;
}

async function readErrorResponse(response: Response) {
  const jsonResponse = typeof response.clone === "function" ? response.clone() : response;

  try {
    const body = (await jsonResponse.json()) as { error?: unknown; message?: unknown };
    if (typeof body.error === "string" && body.error.trim()) return body.error;
    if (typeof body.message === "string" && body.message.trim()) return body.message;
  } catch {
    const textResponse = typeof response.clone === "function" ? response.clone() : response;
    const text = await textResponse.text().catch(() => "");
    if (text.trim()) return text.trim();
  }

  return undefined;
}