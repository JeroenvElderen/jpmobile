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

export type AdminDashboardData = {
  stats: AdminDashboardStat[];
  schedule: AdminScheduleItem[];
  bookingTrend: number[];
  revenueTrend: number[];
  activities: AdminActivityItem[];
  notificationCount: number;
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

export async function createAdminDog(input: { clientId: string; name: string; breed?: string; age?: string; notes?: string }) {
  await invokeAdminDashboard({ type: "create-dog", payload: input });
}

export async function createAdminBooking(input: { clientId: string; dogId: string; serviceName: string; startsAt: string; location?: string; notes?: string }) {
  await invokeAdminDashboard({ type: "create-booking", payload: input });
}

async function invokeAdminDashboard(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<AdminDashboardResponse>("admin-dashboard", {
    body,
  });

  if (error) {
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.data) {
    throw new Error("Admin dashboard returned no data.");
  }

  return data.data;
}