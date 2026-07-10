"use client";

import { useEffect, useState } from "react";

type LiveQueryOptions<T> = {
  accessToken?: string;
  fallback: T;
  path: string;
  realtimeTables: string[];
  map: (rows: unknown) => T;
  load?: (token?: string) => Promise<T>;
};

async function getSupabaseErrorMessage(response: Response) {
  const fallback = `Your portal details could not be loaded (${response.status})`;
  return fallback;
}

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export function useSupabaseLiveQuery<T>({ accessToken, fallback, path, realtimeTables, map, load: loadOverride }: LiveQueryOptions<T>) {
  const [data, setData] = useState<T>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const config = getConfig();
    let isMounted = true;
    let socket: WebSocket | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    const token = accessToken ?? config?.key;

    async function load() {
      if (loadOverride) {
        try {
          const nextData = await loadOverride(token);
          if (!isMounted) return;
          setData(nextData);
          setError(null);
        } catch (queryError) {
          if (isMounted) setError(queryError instanceof Error ? queryError.message : "Unable to load data.");
        } finally {
          if (isMounted) setIsLoading(false);
        }
        return;
      }

      if (!config || !token) {
        setError("Portal data is not available right now.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${config.url}${path}`, {
          cache: "no-store",
          headers: { apikey: config.key, Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const message = await getSupabaseErrorMessage(response);
          throw new Error(message);
        }
        const rows = await response.json();
        if (!isMounted) return;
        setData(map(rows));
        setError(null);
      } catch (queryError) {
        if (isMounted) setError(queryError instanceof Error ? queryError.message : "Unable to load portal data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void load();

    if (loadOverride) {
      poll = setInterval(() => void load(), 30000);
    }

    if (config && token && realtimeTables.length) {
      const wsUrl = `${config.url.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${encodeURIComponent(config.key)}&vsn=1.0.0`;
      socket = new WebSocket(wsUrl);
      socket.addEventListener("open", () => {
        if (!isMounted || socket?.readyState !== WebSocket.OPEN) {
          socket?.close();
          return;
        }

        socket.send(JSON.stringify({ topic: "realtime:portal-live", event: "phx_join", payload: { config: { postgres_changes: realtimeTables.map((table) => ({ event: "*", schema: "public", table })) }, access_token: token }, ref: "1" }));
        heartbeat = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(Date.now()) }));
          }
        }, 25000);
      });
      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data as string) as { event?: string };
          if (message.event === "postgres_changes") void load();
        } catch {
          // Ignore non-JSON realtime frames.
        }
      });
    }

    return () => {
      isMounted = false;
      if (heartbeat) clearInterval(heartbeat);
      if (poll) clearInterval(poll);
      if (socket?.readyState === WebSocket.OPEN) socket.close();
    };
  }, [accessToken, fallback, loadOverride, map, path, realtimeTables]);

  return { data, isLoading, error };
}
