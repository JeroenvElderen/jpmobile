import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

const DEFAULT_REFRESH_INTERVAL_MS = 60_000;

type AutoRefreshOptions = {
  intervalMs?: number;
};

/**
 * Keeps screen data fresh while avoiding overlapping refresh requests.
 * The screen still owns its initial loading state and error presentation.
 */
export function useAutoRefresh(
  refresh: () => Promise<unknown>,
  { intervalMs = DEFAULT_REFRESH_INTERVAL_MS }: AutoRefreshOptions = {},
) {
  const refreshRef = useRef(refresh);
  const requestInFlightRef = useRef<Promise<void> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const runRefresh = useCallback((showIndicator = false) => {
    if (requestInFlightRef.current) return requestInFlightRef.current;

    if (showIndicator) setIsRefreshing(true);

    const request = Promise.resolve(refreshRef.current())
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        requestInFlightRef.current = null;
        if (showIndicator) setIsRefreshing(false);
      });

    requestInFlightRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (appStateRef.current === "active") void runRefresh();
    }, intervalMs);

    const subscription = AppState.addEventListener("change", (nextState) => {
      const returningToForeground = appStateRef.current !== "active" && nextState === "active";
      appStateRef.current = nextState;
      if (returningToForeground) void runRefresh();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [intervalMs, runRefresh]);

  const onRefresh = useCallback(() => {
    void runRefresh(true);
  }, [runRefresh]);

  return { isRefreshing, onRefresh };
}
