"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, CameraOff, ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ZXingControls = {
  stop: () => void;
};

function extractAssetId(rawValue: string) {
  const trimmed = rawValue.trim();

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/scan\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    const match = trimmed.match(/\/scan\/([^/]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }

    return trimmed || null;
  }
}

export function CameraScanner({
  onDetectedAssetId,
  idleMessage = "Use camera scan when supported, or fall back to manual asset ID.",
  autoStart = false,
  compact = false,
  pauseOnDetect = true,
  scanCooldownMs = 1500,
}: {
  onDetectedAssetId?: (assetId: string) => void | Promise<void>;
  idleMessage?: string;
  autoStart?: boolean;
  compact?: boolean;
  pauseOnDetect?: boolean;
  scanCooldownMs?: number;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<ZXingControls | null>(null);
  const lastDetectedRef = useRef<{ assetId: string; at: number } | null>(null);
  const processingRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "starting" | "active" | "unsupported" | "error">("idle");
  const [message, setMessage] = useState(idleMessage);
  const [, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      stopScanner(false);
    };
  }, []);

  useEffect(() => {
    if (autoStart && status === "idle") {
      void startScanner();
    }
  }, [autoStart, status]);

  function stopScanner(resetStatus = true) {
    controlsRef.current?.stop();
    controlsRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    processingRef.current = false;

    if (resetStatus) {
      setStatus("idle");
      setMessage(idleMessage);
    }
  }

  async function handleDetected(rawValue: string) {
    const assetId = extractAssetId(rawValue);
    if (!assetId) return;

    const now = Date.now();
    const lastDetected = lastDetectedRef.current;
    if (processingRef.current || (lastDetected && lastDetected.assetId === assetId && now - lastDetected.at < scanCooldownMs)) {
      return;
    }

    lastDetectedRef.current = { assetId, at: now };
    processingRef.current = true;

    if (pauseOnDetect) {
      stopScanner(false);
    }

    if (onDetectedAssetId) {
      await onDetectedAssetId(assetId);
    } else {
      startTransition(() => {
        router.push(`/scan/${encodeURIComponent(assetId)}`);
      });
    }

    processingRef.current = false;

    if (pauseOnDetect) {
      return;
    }

    setMessage("Ready for the next scan.");
  }

  async function startScanner() {
    if (!videoRef.current || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setMessage("Camera access is not available in this browser. Use manual entry instead.");
      return;
    }

    stopScanner(false);
    setStatus("starting");
    setMessage("Opening camera…");

    try {
      const { BrowserCodeReader, BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      const handleResult = async (result: { getText?: () => string } | undefined | null) => {
        const text = typeof result?.getText === "function" ? result.getText() : "";
        if (!text) return;
        await handleDetected(text);
      };

      let controls: ZXingControls;

      try {
        const devices = await BrowserCodeReader.listVideoInputDevices();
        const preferredDevice =
          devices.find((device) => /back|rear|environment/i.test(device.label)) ??
          devices[0];

        if (preferredDevice?.deviceId) {
          controls = await reader.decodeFromVideoDevice(preferredDevice.deviceId, videoRef.current, async (result) => {
            await handleResult(result);
          });
        } else {
          throw new Error("No video device available.");
        }
      } catch {
        controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: compact ? 1280 : 960 },
              height: { ideal: compact ? 1280 : 720 },
            },
          },
          videoRef.current,
          async (result) => {
            await handleResult(result);
          },
        );
      }

      controlsRef.current = controls;
      setStatus("active");
      setMessage("Point the camera at a Gear Locker label.");
    } catch (error) {
      const messageText =
        error instanceof Error && /Permission/i.test(error.message)
          ? "Camera permission was denied. Allow camera access or use manual entry."
          : "Could not start the camera scanner. Use manual entry if needed.";
      setStatus("error");
      setMessage(messageText);
      stopScanner(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className={cn("overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-950", compact && "rounded-[1.5rem] border-slate-800 shadow-[0_24px_60px_rgba(15,23,42,0.28)]")}>
        <video ref={videoRef} className={cn("aspect-[4/3] w-full object-cover", compact && "aspect-square min-h-[44svh] bg-black")} playsInline muted autoPlay />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={() => void startScanner()} disabled={status === "starting" || status === "active"} className={cn("h-11", compact && "h-12 text-base")}>
          <Camera className="h-4 w-4" />
          {status === "active" ? "Scanning…" : "Start camera"}
        </Button>
        <Button type="button" variant="outline" onClick={() => stopScanner()} disabled={status !== "active"} className={cn("h-11", compact && "h-12 text-base")}>
          <CameraOff className="h-4 w-4" />
          Stop camera
        </Button>
      </div>
      <div className={cn("rounded-[1rem] border border-slate-200 bg-white/75 p-3 text-sm text-muted-foreground", compact && "border-slate-800 bg-slate-950 text-slate-300")}>
        <div className="flex items-center gap-2 font-medium text-foreground">
          <ScanLine className="h-4 w-4" />
          QR scanner
        </div>
        <div className="mt-1">{message}</div>
      </div>
    </div>
  );
}
