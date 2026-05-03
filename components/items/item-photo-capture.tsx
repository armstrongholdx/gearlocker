"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, RefreshCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function isMobileCaptureEnvironment() {
  if (typeof window === "undefined") return false;

  const mobileUserAgent = /iPhone|iPad|iPod|Android|Mobile/i.test(window.navigator.userAgent);
  const narrowScreen = window.matchMedia("(max-width: 820px)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  return mobileUserAgent || (narrowScreen && coarsePointer);
}

export function ItemPhotoCapture({
  assetId,
  disabled = false,
  compact = false,
}: {
  assetId: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isMobileOnly, setIsMobileOnly] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    setIsMobileOnly(isMobileCaptureEnvironment());
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedPreview) {
        URL.revokeObjectURL(capturedPreview);
      }
    };
  }, [capturedPreview]);

  const statusMessage = useMemo(() => {
    if (message) return message;
    if (capturedPreview) return "Review the photo, then save it to this item.";
    if (isOpen) return "Frame the item and capture a clean cover photo.";
    return "Add a cover photo from your phone camera.";
  }, [capturedPreview, isOpen, message]);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setTone("error");
      setMessage("Camera capture is not supported in this browser.");
      return;
    }

    setIsStarting(true);
    setTone("idle");
    setMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1600 },
          height: { ideal: 1600 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsOpen(true);
    } catch {
      setTone("error");
      setMessage("Could not open the camera. Check mobile camera permission and try again.");
    } finally {
      setIsStarting(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function closeCapture() {
    stopCamera();
    setIsOpen(false);
    setMessage(null);
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
      setCapturedPreview(null);
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      setTone("error");
      setMessage("Could not capture the image.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setTone("error");
        setMessage("Could not capture the image.");
        return;
      }

      if (capturedPreview) {
        URL.revokeObjectURL(capturedPreview);
      }

      const previewUrl = URL.createObjectURL(blob);
      setCapturedPreview(previewUrl);
      stopCamera();
    }, "image/jpeg", 0.92);
  }

  async function savePhoto() {
    if (!canvasRef.current) return;

    setIsUploading(true);
    setTone("idle");
    setMessage("Saving photo…");

    const blob = await new Promise<Blob | null>((resolve) => {
      canvasRef.current?.toBlob((nextBlob) => resolve(nextBlob), "image/jpeg", 0.92);
    });

    if (!blob) {
      setTone("error");
      setMessage("Could not prepare the photo for upload.");
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.set("photo", new File([blob], `${assetId}-cover.jpg`, { type: "image/jpeg" }));

    const response = await fetch(`/api/items/${encodeURIComponent(assetId)}/cover`, {
      method: "POST",
      headers: {
        "x-gear-locker-camera-capture": "1",
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setTone("error");
      setMessage(data.message ?? "Could not save the photo.");
      setIsUploading(false);
      return;
    }

    setTone("success");
    setMessage("Photo added.");
    setIsUploading(false);
    setTimeout(() => {
      closeCapture();
      router.refresh();
    }, 700);
  }

  function retakePhoto() {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCapturedPreview(null);
    void startCamera();
  }

  if (!isMobileOnly) {
    return (
      <div className={cn("rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-muted-foreground", compact && "border-white/10 bg-white/5 text-slate-300")}>
        Cover photos can only be added from a phone camera. Desktop is view-only.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <Button
          type="button"
          onClick={() => void startCamera()}
          disabled={disabled || isStarting || isUploading}
          className={cn("w-full", compact && "h-11 rounded-2xl")}
          variant={compact ? "outline" : "default"}
        >
          <Camera className="h-4 w-4" />
          {isStarting ? "Opening camera…" : "Add photo"}
        </Button>
        {!compact ? <div className="text-xs text-muted-foreground">{statusMessage}</div> : null}
        {message && !isOpen ? (
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
              tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-slate-200 bg-white/80 text-slate-700",
            )}
          >
            {tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : tone === "error" ? <AlertTriangle className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            <span>{message}</span>
          </div>
        ) : null}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/90 md:hidden">
          <div className="flex h-[100svh] w-full flex-col bg-slate-950 text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Add photo</div>
                <div className="mt-1 text-sm font-medium">{assetId}</div>
              </div>
              <Button type="button" variant="ghost" className="text-white hover:bg-white/5 hover:text-white" onClick={closeCapture}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 bg-black">
              {capturedPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={capturedPreview} alt="Captured gear" className="h-full w-full object-cover" />
              ) : (
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
              )}
            </div>

            <div className="space-y-3 border-t border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.99))] px-4 py-4">
              <div className="text-sm text-slate-300">{statusMessage}</div>
              {message && capturedPreview ? (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                    tone === "success"
                      ? "border-emerald-200/30 bg-emerald-500/15 text-emerald-100"
                      : tone === "error"
                        ? "border-rose-200/30 bg-rose-500/15 text-rose-100"
                        : "border-white/10 bg-white/5 text-slate-200",
                  )}
                >
                  {tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : tone === "error" ? <AlertTriangle className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                  <span>{message}</span>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                {capturedPreview ? (
                  <>
                    <Button type="button" variant="outline" className="h-12 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={retakePhoto} disabled={isUploading}>
                      <RefreshCcw className="h-4 w-4" />
                      Retake
                    </Button>
                    <Button type="button" className="h-12 rounded-2xl" onClick={() => void savePhoto()} disabled={isUploading}>
                      <CheckCircle2 className="h-4 w-4" />
                      {isUploading ? "Saving…" : "Save photo"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="outline" className="h-12 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={closeCapture}>
                      <CameraOff className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button type="button" className="h-12 rounded-2xl" onClick={capturePhoto}>
                      <Camera className="h-4 w-4" />
                      Capture
                    </Button>
                  </>
                )}
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      ) : null}
    </>
  );
}
