"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RealtimeTable = "Item" | "Kit" | "KitVerificationSession" | "KitVerificationItem" | "ItemHistoryEvent" | "KitHistoryEvent";

export function AutoRefresh({
  intervalMs = 30000,
  tables = ["Item", "Kit", "KitVerificationSession", "ItemHistoryEvent", "KitHistoryEvent"],
}: {
  intervalMs?: number;
  tables?: RealtimeTable[];
}) {
  const router = useRouter();
  const refreshTimeoutRef = useRef<number | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let intervalId: number | null = null;
    let isSubscribed = false;
    const channelName = `gear-locker-${tables.join("-")}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase?.channel(channelName);

    function triggerRefresh() {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        router.refresh();
      }, 180);
    }

    function start() {
      if (intervalId !== null || document.visibilityState !== "visible") {
        return;
      }

      intervalId = window.setInterval(() => {
        router.refresh();
      }, intervalMs);
    }

    function stop() {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    }

    if (channel) {
      tables.forEach((table) => {
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
          },
          () => {
            triggerRefresh();
          },
        );
      });

      channel.subscribe((status) => {
        isSubscribed = status === "SUBSCRIBED";
        if (isSubscribed) {
          stop();
        } else if (document.visibilityState === "visible") {
          start();
        }
      });
    } else {
      start();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stop();
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      if (channel) {
        void supabase?.removeChannel(channel);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs, router, supabase, tables]);

  return null;
}
