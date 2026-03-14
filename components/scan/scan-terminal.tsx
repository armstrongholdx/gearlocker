"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ItemStatus } from "@prisma/client";
import { AlertTriangle, CheckCircle2, ChevronRight, History, MapPinned, PackageCheck, ScanLine, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";

import { CameraScanner } from "@/components/scan/camera-scanner";
import { StatusBadge } from "@/components/inventory/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type LocationOption = { id: string; label: string };

type ActiveReturn = {
  id: string;
  kitAssetId: string;
  kitName: string;
  verifiedCount: number;
  expectedCount: number;
  pendingCount: number;
};

type ItemTerminalEntity = {
  type: "item";
  entity: {
    assetId: string;
    name: string;
    status: string;
    statusLabel: string;
    locationId: string | null;
    locationLabel: string;
    kitsCount: number;
    trackedContentsCount: number;
    checklistContentsCount: number;
    containedInCount: number;
    packageRole: "parent" | "contained" | "standalone";
  };
  locations: LocationOption[];
  activeReturn: ActiveReturn | null;
  returnContext?: {
    state: "expected_item" | "already_verified" | "other_kit" | "unexpected";
    message: string;
  };
};

type KitTerminalEntity = {
  type: "kit";
  entity: {
    assetId: string;
    name: string;
    status: string;
    statusLabel: string;
    locationLabel: string;
    memberCount: number;
    verificationLabel: string;
  };
  activeReturn: ActiveReturn | null;
};

type TerminalPayload = ItemTerminalEntity | KitTerminalEntity;

type PanelState =
  | { phase: "idle" }
  | { phase: "loading"; assetId: string }
  | { phase: "warning"; payload: TerminalPayload; message: string }
  | { phase: "scanned"; payload: TerminalPayload; accent?: "green" | "red" | "amber" }
  | { phase: "confirmed"; payload: TerminalPayload; message: string; accent: "green" }
  | { phase: "error"; assetId?: string; message: string };

type ScanHistoryEntry = {
  id: string;
  assetId: string;
  label: string;
  result: "success" | "error" | "warning";
  detail: string;
};

type ToneKind = "success" | "error" | "complete";

export function ScanTerminal() {
  const router = useRouter();
  const [assetIdInput, setAssetIdInput] = useState("");
  const [panelState, setPanelState] = useState<PanelState>({ phase: "idle" });
  const [note, setNote] = useState("");
  const [moveOpen, setMoveOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const lastScanRef = useRef<{ assetId: string; at: number } | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const supabaseRef = useRef(createSupabaseBrowserClient());

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const payload = panelState.phase === "warning" || panelState.phase === "scanned" || panelState.phase === "confirmed" ? panelState.payload : null;
  const isReturnMode = Boolean(payload?.activeReturn);

  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase) return;

    const channel = supabase
      .channel(`scan-terminal-${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "Item" }, () => {
        if (payload) {
          void resolveScan(payload.entity.assetId, true);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "Kit" }, () => {
        if (payload) {
          void resolveScan(payload.entity.assetId, true);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "KitVerificationSession" }, () => {
        if (payload) {
          void resolveScan(payload.entity.assetId, true);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "KitVerificationItem" }, () => {
        if (payload) {
          void resolveScan(payload.entity.assetId, true);
        }
      });

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [payload]);

  const packageSummary = useMemo(() => {
    if (!payload || payload.type !== "item") return null;

    if (payload.entity.packageRole === "parent") {
      return `${payload.entity.trackedContentsCount} tracked · ${payload.entity.checklistContentsCount} checklist`;
    }

    if (payload.entity.packageRole === "contained") {
      return `Inside ${payload.entity.containedInCount} package${payload.entity.containedInCount === 1 ? "" : "s"}`;
    }

    return "Standalone item";
  }, [payload]);

  const recentTitle =
    history.length > 0
      ? history[0]?.result === "success"
        ? "Last action confirmed"
        : history[0]?.result === "warning"
          ? "Check the last scan"
          : "Last scan needs attention"
      : "Recent scans";

  function scheduleReset(delay = 2600) {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setPanelState({ phase: "idle" });
      setNote("");
      setMoveOpen(false);
      setSelectedLocationId("");
    }, delay);
  }

  function pushHistory(entry: Omit<ScanHistoryEntry, "id">) {
    setHistory((current) => [
      { ...entry, id: `${entry.assetId}-${Date.now()}` },
      ...current,
    ].slice(0, 4));
  }

  function playTone(kind: ToneKind) {
    try {
      const AudioContextCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;

      const audioContext = audioContextRef.current ?? new AudioContextCtor();
      audioContextRef.current = audioContext;

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      const now = audioContext.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(kind === "error" ? 220 : kind === "complete" ? 740 : 620, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "complete" ? 0.22 : 0.12));
      oscillator.start(now);
      oscillator.stop(now + (kind === "complete" ? 0.24 : 0.14));
    } catch {
      // Browser audio feedback is optional.
    }
  }

  function applySuccess(payloadToUse: TerminalPayload, message: string, tone: ToneKind = "success") {
    setPanelState({ phase: "confirmed", payload: payloadToUse, message, accent: "green" });
    playTone(tone);
    router.refresh();
    scheduleReset(tone === "complete" ? 3200 : 2600);
  }

  async function resolveScan(assetId: string, allowOverride = false) {
    const trimmed = assetId.trim();
    if (!trimmed) return;

    const lastScan = lastScanRef.current;
    const now = Date.now();
    if (lastScan && lastScan.assetId === trimmed && now - lastScan.at < 2500) {
      setPanelState({ phase: "error", assetId: trimmed, message: "Already scanned. Point at the next label." });
      pushHistory({ assetId: trimmed, label: "Duplicate scan", result: "warning", detail: "Already scanned" });
      playTone("error");
      scheduleReset(1800);
      return;
    }

    lastScanRef.current = { assetId: trimmed, at: now };
    setAssetIdInput(trimmed);
    setPanelState({ phase: "loading", assetId: trimmed });

    const response = await fetch(`/api/scan/resolve?assetId=${encodeURIComponent(trimmed)}`, { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      setPanelState({ phase: "error", assetId: trimmed, message: data.message ?? "Item not recognized." });
      pushHistory({ assetId: trimmed, label: "Unknown code", result: "error", detail: data.message ?? "Item not recognized" });
      playTone("error");
      scheduleReset(2200);
      return;
    }

    const nextPayload = data as TerminalPayload;
    if (!allowOverride && nextPayload.activeReturn && nextPayload.activeReturn.kitAssetId !== trimmed) {
      if (nextPayload.type === "item" && nextPayload.returnContext?.state === "already_verified") {
        setPanelState({
          phase: "error",
          assetId: trimmed,
          message: "Already verified for this kit.",
        });
        pushHistory({ assetId: trimmed, label: nextPayload.entity.name, result: "warning", detail: "Already verified" });
        playTone("error");
        scheduleReset(2000);
        return;
      }

      if (nextPayload.type === "item" && nextPayload.returnContext?.state === "other_kit") {
        setPanelState({
          phase: "error",
          assetId: trimmed,
          message: nextPayload.returnContext.message,
        });
        pushHistory({ assetId: trimmed, label: nextPayload.entity.name, result: "error", detail: nextPayload.returnContext.message });
        playTone("error");
        scheduleReset(2200);
        return;
      }

      if (nextPayload.type === "item" && nextPayload.returnContext?.state === "unexpected") {
        setPanelState({
          phase: "error",
          assetId: trimmed,
          message: "Not part of this return.",
        });
        pushHistory({ assetId: trimmed, label: nextPayload.entity.name, result: "error", detail: "Not part of this return" });
        playTone("error");
        scheduleReset(2200);
        return;
      }

      setPanelState({
        phase: "warning",
        payload: nextPayload,
        message:
          nextPayload.type === "item" && nextPayload.returnContext?.state === "expected_item"
            ? nextPayload.returnContext.message
            : `Kit return still in progress for ${nextPayload.activeReturn.kitAssetId}.`,
      });
      pushHistory({ assetId: trimmed, label: nextPayload.entity.name, result: "warning", detail: `Return open for ${nextPayload.activeReturn.kitAssetId}` });
      return;
    }

    setSelectedLocationId(nextPayload.type === "item" ? nextPayload.entity.locationId ?? "" : "");
    setPanelState({ phase: "scanned", payload: nextPayload });
    pushHistory({ assetId: nextPayload.entity.assetId, label: nextPayload.entity.name, result: "success", detail: nextPayload.type === "item" ? nextPayload.entity.statusLabel : nextPayload.entity.verificationLabel });
  }

  async function runItemAction(action: "check_in" | "check_out" | "repair" | "missing" | "move") {
    if (!payload || payload.type !== "item") return;

    const response = await fetch("/api/scan/item-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: payload.entity.assetId,
        action,
        note,
        locationId: action === "move" ? selectedLocationId || null : undefined,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setPanelState({ phase: "error", assetId: payload.entity.assetId, message: data.message ?? "Could not update item." });
      pushHistory({ assetId: payload.entity.assetId, label: payload.entity.name, result: "error", detail: data.message ?? "Could not update item." });
      playTone("error");
      scheduleReset(2200);
      return;
    }

    const refreshed = await fetch(`/api/scan/resolve?assetId=${encodeURIComponent(payload.entity.assetId)}`, { cache: "no-store" }).then((result) => result.json());
    pushHistory({ assetId: payload.entity.assetId, label: payload.entity.name, result: "success", detail: data.message ?? "Done." });
    setNote("");
    setMoveOpen(false);
    applySuccess(refreshed as TerminalPayload, data.message ?? "Done.");
  }

  async function runKitAction(action: "check_out" | "start_return" | "verify_member", itemAssetId?: string) {
    if (!payload || payload.type !== "kit") return;

    const response = await fetch("/api/scan/kit-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: payload.entity.assetId,
        action,
        note,
        itemAssetId,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setPanelState({ phase: "error", assetId: payload.entity.assetId, message: data.message ?? "Could not update kit." });
      pushHistory({ assetId: payload.entity.assetId, label: payload.entity.name, result: "error", detail: data.message ?? "Could not update kit." });
      playTone("error");
      scheduleReset(2200);
      return;
    }

    const refreshed = await fetch(`/api/scan/resolve?assetId=${encodeURIComponent(payload.entity.assetId)}`, { cache: "no-store" }).then((result) => result.json());
    pushHistory({ assetId: payload.entity.assetId, label: payload.entity.name, result: "success", detail: data.message ?? "Done." });
    setNote("");
    applySuccess(refreshed as TerminalPayload, data.message ?? "Done.", data.kitComplete ? "complete" : "success");
  }

  async function handleContinueReturn() {
    if (panelState.phase !== "warning" || !panelState.payload.activeReturn) return;

    const scannedPayload = panelState.payload;
    const activeReturn = scannedPayload.activeReturn;
    if (!activeReturn) return;
    if (scannedPayload.type === "item") {
      const response = await fetch("/api/scan/kit-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: activeReturn.kitAssetId,
          action: "verify_member",
          itemAssetId: scannedPayload.entity.assetId,
          note: "Scanned into return",
        }),
      });
      const data = await response.json();

      if (response.ok) {
        pushHistory({
          assetId: scannedPayload.entity.assetId,
          label: scannedPayload.entity.name,
          result: "success",
          detail: data.kitComplete ? "Kit complete" : `Returned to ${activeReturn.kitAssetId}`,
        });
        applySuccess(
          scannedPayload,
          data.kitComplete ? "Kit complete." : `${scannedPayload.entity.assetId} returned to ${activeReturn.kitAssetId}.`,
          data.kitComplete ? "complete" : "success",
        );
        return;
      }

      setPanelState({ phase: "error", assetId: scannedPayload.entity.assetId, message: data.message ?? "Item not part of this kit." });
      pushHistory({ assetId: scannedPayload.entity.assetId, label: scannedPayload.entity.name, result: "error", detail: data.message ?? "Item not part of this kit." });
      playTone("error");
      scheduleReset(2200);
      return;
    }

    router.push(`/kits/${encodeURIComponent(activeReturn.kitAssetId)}/return`);
  }

  const primaryItemAction =
    payload?.type === "item"
      ? payload.entity.status === "active"
        ? { label: "Check in", action: "check_in" as const }
        : { label: "Check out", action: "check_out" as const }
      : null;

  return (
    <div className="min-h-[calc(100svh-7rem)] overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950 text-white shadow-[0_28px_80px_rgba(2,6,23,0.42)] md:hidden">
      <div className="flex min-h-[calc(100svh-7rem)] flex-col">
        <div className="flex-[0_0_48%] border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.14),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,1))] p-3">
          <CameraScanner
            onDetectedAssetId={resolveScan}
            autoStart
            compact
            pauseOnDetect={false}
            idleMessage="Point at a Gear Locker label."
          />
        </div>

        <div
          className={cn(
            "flex-1 space-y-4 overflow-y-auto border-t border-white/8 bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(2,6,23,0.995))] p-4 transition-all duration-300",
            panelState.phase === "confirmed" && "scan-success-flash",
            panelState.phase === "error" && "scan-error-shake",
            panelState.phase === "warning" && "border-t border-amber-300/30 bg-[linear-gradient(180deg,rgba(120,53,15,0.34),rgba(2,6,23,0.995))]",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{isReturnMode ? "Return in progress" : "Scan gear"}</div>
              <div className="mt-1 text-sm font-medium text-slate-200">
                {isReturnMode ? "Keep scanning until every expected item is accounted for." : "Ready for the next label."}
              </div>
            </div>
            <div className={cn("flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", isReturnMode ? "border-amber-300/25 bg-amber-400/10 text-amber-100" : "border-white/10 bg-white/5 text-slate-300")}>
              <ScanLine className="h-3.5 w-3.5" />
              {panelState.phase === "idle"
                ? "Ready"
                : panelState.phase === "loading"
                  ? "Scanning"
                  : panelState.phase === "warning"
                    ? "Blocked"
                    : panelState.phase === "error"
                      ? "Error"
                      : panelState.phase === "confirmed"
                        ? "Done"
                        : "Scanned"}
            </div>
          </div>

          {isReturnMode ? (
            <div className="rounded-[1.15rem] border border-amber-300/30 bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(120,53,15,0.16))] px-3 py-3 text-sm text-amber-100 shadow-[0_10px_30px_rgba(120,53,15,0.24)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-amber-100/70">Return mode</div>
                  <div className="mt-1 font-semibold">{payload?.activeReturn?.kitAssetId} · {payload?.activeReturn?.kitName}</div>
                </div>
                <div className="rounded-full border border-amber-200/20 bg-black/15 px-2.5 py-1 text-[11px] font-medium text-amber-50">
                  {payload?.activeReturn?.pendingCount ?? 0} pending
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-amber-100/80">
                <span>Progress</span>
                <span>
                  {payload?.activeReturn?.verifiedCount ?? 0} / {payload?.activeReturn?.expectedCount ?? 0} verified
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-100/15">
                <div
                  className="h-full rounded-full bg-amber-300 transition-all duration-500"
                  style={{
                    width: `${payload?.activeReturn?.expectedCount ? Math.round(((payload?.activeReturn?.verifiedCount ?? 0) / payload.activeReturn.expectedCount) * 100) : 0}%`,
                  }}
                />
              </div>
              {(payload?.activeReturn?.pendingCount ?? 0) > 0 ? (
                <div className="mt-3 rounded-xl border border-amber-200/20 bg-black/15 px-3 py-2 text-xs text-amber-50/90">
                  Stay in return mode until all remaining items are verified or flagged missing.
                </div>
              ) : null}
            </div>
          ) : null}

          {panelState.phase === "idle" ? (
            <div className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_10px_30px_rgba(2,6,23,0.18)]">
              <div className="text-lg font-semibold">Ready to scan</div>
              <div className="mt-2 text-sm text-slate-300">Point the camera at the next label.</div>
            </div>
          ) : null}

          {panelState.phase === "loading" ? (
            <TerminalPanel title={panelState.assetId} subtitle="Looking up gear…" tone="neutral" />
          ) : null}

          {panelState.phase === "error" ? (
            <TerminalPanel
              title={panelState.assetId ?? "Scan failed"}
              subtitle={panelState.message}
              tone="error"
              icon={<AlertTriangle className="h-5 w-5" />}
            />
          ) : null}

          {payload ? (
            <div
              className={cn(
                "rounded-[1.45rem] border p-4 shadow-[0_20px_50px_rgba(2,6,23,0.28)]",
                panelState.phase === "warning"
                  ? "border-amber-300/40 bg-[linear-gradient(180deg,rgba(245,158,11,0.14),rgba(255,255,255,0.03))]"
                  : panelState.phase === "confirmed"
                    ? "border-emerald-300/40 bg-[linear-gradient(180deg,rgba(16,185,129,0.16),rgba(255,255,255,0.03))]"
                    : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{payload.entity.assetId}</div>
                  <div className="mt-1 text-xl font-semibold">{payload.entity.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {payload.type === "item" ? (
                      <StatusBadge status={payload.entity.status as ItemStatus} />
                    ) : (
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{payload.entity.statusLabel}</div>
                    )}
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {payload.entity.locationLabel}
                    </div>
                  </div>
                </div>
                {panelState.phase === "confirmed" ? <CheckCircle2 className="h-6 w-6 text-emerald-300" /> : null}
              </div>

              {payload.type === "item" ? (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <MetaChip label="Tracked" value={String(payload.entity.trackedContentsCount)} />
                  <MetaChip label="Checklist" value={String(payload.entity.checklistContentsCount)} />
                  <MetaChip label="Kits" value={String(payload.entity.kitsCount)} />
                  <MetaChip label="Package" value={packageSummary ?? "Standalone"} />
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <MetaChip label="Members" value={String(payload.entity.memberCount)} />
                  <MetaChip label="Return" value={payload.entity.verificationLabel} />
                </div>
              )}

              {"message" in panelState ? (
                <div className={cn("mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm", panelState.phase === "error" ? "border-rose-300/20 bg-rose-500/10 text-rose-200" : panelState.phase === "warning" ? "border-amber-300/20 bg-amber-500/10 text-amber-100" : "border-emerald-300/20 bg-emerald-500/10 text-emerald-100")}>
                  {panelState.phase === "confirmed" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <span>{panelState.message}</span>
                </div>
              ) : null}

              {panelState.phase === "warning" ? (
                <div className="mt-4 grid gap-2">
                  <Button type="button" className="h-13 rounded-2xl bg-amber-400 text-slate-950 hover:bg-amber-300" onClick={handleContinueReturn}>
                    Continue verification
                  </Button>
                  <Button type="button" variant="outline" className="h-12 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setPanelState({ phase: "scanned", payload: panelState.payload, accent: "amber" })}>
                    Use this scan anyway
                  </Button>
                </div>
              ) : null}

              {panelState.phase !== "warning" && payload.type === "item" ? (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    {primaryItemAction ? <ActionChip label={primaryItemAction.label} priority="primary" onClick={() => runItemAction(primaryItemAction.action)} /> : null}
                    {payload.entity.status !== "active" && primaryItemAction?.action !== "check_out" ? (
                      <ActionChip label="Check out" onClick={() => runItemAction("check_out")} />
                    ) : null}
                    {payload.entity.status !== "available" && primaryItemAction?.action !== "check_in" ? (
                      <ActionChip label="Check in" onClick={() => runItemAction("check_in")} />
                    ) : null}
                    <ActionChip label="Repair" icon={<Wrench className="h-4 w-4" />} onClick={() => runItemAction("repair")} />
                    <ActionChip label="Missing" icon={<AlertTriangle className="h-4 w-4" />} onClick={() => runItemAction("missing")} />
                    <ActionChip label="Move" icon={<MapPinned className="h-4 w-4" />} onClick={() => setMoveOpen((current) => !current)} />
                    <Button asChild variant="outline" className="h-12 justify-center border-white/15 bg-white/5 text-white hover:bg-white/10">
                      <Link href={`/items/${encodeURIComponent(payload.entity.assetId)}`}>
                        Inspect
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  {moveOpen ? (
                    <div className="mt-3 space-y-2 rounded-[1rem] border border-white/10 bg-black/20 p-3">
                      <select
                        value={selectedLocationId}
                        onChange={(event) => setSelectedLocationId(event.target.value)}
                        className="flex h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
                      >
                        <option value="">Unassigned</option>
                        {payload.locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.label}
                          </option>
                        ))}
                      </select>
                      <Button type="button" className="h-12 w-full rounded-2xl" onClick={() => runItemAction("move")}>
                        Apply location
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : null}

              {panelState.phase !== "warning" && payload.type === "kit" ? (
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <ActionChip label="Check out" priority="primary" onClick={() => runKitAction("check_out")} />
                  <ActionChip label="Return kit" icon={<PackageCheck className="h-4 w-4" />} onClick={() => runKitAction("start_return")} />
                  <Button asChild variant="outline" className="h-12 rounded-2xl justify-center border-white/15 bg-white/5 text-white hover:bg-white/10">
                    <Link href={`/kits/${encodeURIComponent(payload.entity.assetId)}`}>
                      Inspect
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 rounded-2xl justify-center border-white/15 bg-white/5 text-white hover:bg-white/10">
                    <Link href={`/kits/${encodeURIComponent(payload.entity.assetId)}/return`}>
                      Continue return
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : null}

              {payload.type === "item" ? (
                <div className="mt-3">
                  <Input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Quick note"
                    className="h-11 border-white/10 bg-slate-900 text-white placeholder:text-slate-500"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {history.length > 0 ? (
            <div className="rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-3">
              <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                <History className="h-3.5 w-3.5" />
                {recentTitle}
              </div>
              <div className="mb-3 text-xs text-slate-400">Last {history.length} scan{history.length === 1 ? "" : "s"}</div>
              <div className="space-y-2">
                {history.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{entry.assetId}</div>
                      <div className="truncate text-sm font-medium text-white">{entry.detail}</div>
                      <div className="truncate text-xs text-slate-400">{entry.label}</div>
                    </div>
                    <div
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                        entry.result === "success"
                          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
                          : entry.result === "warning"
                            ? "border-amber-400/20 bg-amber-500/15 text-amber-200"
                            : "border-rose-400/20 bg-rose-500/15 text-rose-200",
                      )}
                    >
                      {entry.result}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              void resolveScan(assetIdInput);
            }}
          >
            <Input
              value={assetIdInput}
              onChange={(event) => setAssetIdInput(event.target.value)}
              placeholder="Type asset ID"
              className="h-12 border-white/10 bg-slate-900 text-white placeholder:text-slate-500"
            />
            <Button type="submit" variant="outline" className="h-11 w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10">
              Open by asset ID
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function TerminalPanel({
  title,
  subtitle,
  tone,
  icon,
}: {
  title: string;
  subtitle: string;
  tone: "neutral" | "error";
  icon?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-[1.4rem] border p-4", tone === "error" ? "border-rose-300/40 bg-rose-500/10 text-rose-100" : "border-white/10 bg-white/5 text-white")}>
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-lg font-semibold">{title}</div>
      </div>
      <div className="mt-2 text-sm opacity-90">{subtitle}</div>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
      <span className="text-slate-500">{label}</span>
      <span className="ml-2 font-medium text-white">{value}</span>
    </div>
  );
}

function ActionChip({
  label,
  onClick,
  icon,
  priority = "secondary",
}: {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  priority?: "primary" | "secondary";
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={cn(
        "h-12 rounded-2xl justify-center shadow-sm",
        priority === "primary"
          ? "bg-accent text-slate-950 shadow-[0_10px_24px_rgba(245,158,11,0.24)] hover:bg-accent/90"
          : "border border-white/10 bg-white text-slate-950 hover:bg-slate-100",
      )}
    >
      {icon}
      {label}
    </Button>
  );
}
