"use client";

import { useEffect, useRef, useState } from "react";

import { CameraScanner } from "@/components/scan/camera-scanner";
import { Button } from "@/components/ui/button";

export function ReturnSessionScanner({
  action,
  kitAssetId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  kitAssetId: string;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [itemAssetId, setItemAssetId] = useState("");
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

  function handleDetectedAssetId(assetId: string) {
    setItemAssetId(assetId);
    requestAnimationFrame(() => {
      formRef.current?.requestSubmit();
    });
  }

  return (
    <div className="space-y-4">
      <CameraScanner
        onDetectedAssetId={handleDetectedAssetId}
        idleMessage="Scan kit members directly into the active return session."
        autoStart={isCompactViewport}
        compact={isCompactViewport}
      />
      <form ref={formRef} action={action} className="space-y-3">
        <input type="hidden" name="assetId" value={kitAssetId} />
        <input type="hidden" name="isPresent" value="present" />
        <label className="space-y-2 text-sm font-medium">
          <span>Manual member asset ID</span>
          <input
            name="itemAssetId"
            value={itemAssetId}
            onChange={(event) => setItemAssetId(event.target.value)}
            placeholder="Scan or type member asset ID"
            className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm"
          />
        </label>
        <input
          name="note"
          placeholder="Scanned into return session"
          className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" variant="outline" className="w-full">
          Mark scanned item present
        </Button>
      </form>
    </div>
  );
}
