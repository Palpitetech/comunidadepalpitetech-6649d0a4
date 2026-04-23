import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "app_version";
const POLL_INTERVAL_MS = 30_000;

/**
 * Listens for global force-update signals from `app_config.current_version`.
 *
 * - On mount: reads server version, stores in localStorage if absent (no reload).
 * - Subscribes via Supabase Realtime; falls back to 30s polling.
 * - When server version > local version:
 *   1. Persists new version in localStorage (prevents loop).
 *   2. Unregisters service workers + clears all caches.
 *   3. Hard reloads the page.
 */
export function useForceUpdate() {
  const reloadingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const triggerReload = async (serverVersion: number) => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;

      try {
        localStorage.setItem(STORAGE_KEY, String(serverVersion));

        // Force SW to check for updates
        if ("serviceWorker" in navigator) {
          try {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.update().catch(() => {})));
          } catch {
            /* noop */
          }
        }

        // Clear all caches
        if ("caches" in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          } catch {
            /* noop */
          }
        }
      } finally {
        window.location.reload();
      }
    };

    const checkVersion = async () => {
      if (cancelled || reloadingRef.current) return;

      const { data, error } = await supabase
        .from("app_config")
        .select("current_version")
        .eq("id", 1)
        .maybeSingle();

      if (error || !data || cancelled) return;

      const serverVersion = Number(data.current_version);
      if (!Number.isFinite(serverVersion)) return;

      const localRaw = localStorage.getItem(STORAGE_KEY);

      // First load — just persist, no reload
      if (localRaw === null) {
        localStorage.setItem(STORAGE_KEY, String(serverVersion));
        return;
      }

      const localVersion = Number(localRaw);
      if (Number.isFinite(localVersion) && serverVersion > localVersion) {
        await triggerReload(serverVersion);
      }
    };

    // Initial check
    checkVersion();

    // Realtime subscription
    const channel = supabase
      .channel("app_config_force_update")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_config" },
        (payload) => {
          const next = Number((payload.new as { current_version?: number })?.current_version);
          if (!Number.isFinite(next) || reloadingRef.current) return;

          const localRaw = localStorage.getItem(STORAGE_KEY);
          if (localRaw === null) {
            localStorage.setItem(STORAGE_KEY, String(next));
            return;
          }
          const localVersion = Number(localRaw);
          if (Number.isFinite(localVersion) && next > localVersion) {
            void triggerReload(next);
          }
        },
      )
      .subscribe();

    // Polling fallback
    const pollId = window.setInterval(checkVersion, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, []);
}
