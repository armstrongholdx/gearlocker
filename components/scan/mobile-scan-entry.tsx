"use client";

import { useEffect, useState } from "react";

import { CameraScanner } from "@/components/scan/camera-scanner";
import { cn } from "@/lib/utils";

export function MobileScanEntry() {
  const [isCompactViewport, setIsCompactViewport] = useState(false);

  useEffect(() => {
    function updateViewport() {
      setIsCompactViewport(window.matchMedia("(max-width: 767px)").matches);
    }

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className={cn("space-y-1", isCompactViewport ? "sr-only" : "")}>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Scan</div>
        <h1 className="text-3xl font-semibold tracking-tight">Scan gear</h1>
      </div>
      <CameraScanner
        autoStart={isCompactViewport}
        compact={isCompactViewport}
        idleMessage={isCompactViewport ? "Opening camera…" : "Use camera scan or enter an asset ID below."}
      />
    </div>
  );
}
