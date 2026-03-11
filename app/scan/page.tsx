"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ScanPage() {
  const router = useRouter();
  const [assetId, setAssetId] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assetId.trim()) {
      return;
    }

    router.push(`/scan/${encodeURIComponent(assetId.trim())}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Scan</h1>
        <p className="text-muted-foreground">Mobile-first resolver page with manual fallback. Camera scanning is staged for the next pass.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manual lookup</CardTitle>
          <CardDescription>
            Browser camera scanning is not wired in this first pass because reliability varies across iOS/Android browsers. Manual asset ID fallback keeps the scan workflow usable immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input value={assetId} onChange={(event) => setAssetId(event.target.value)} placeholder="CAM-001" />
            <Button type="submit">Open item</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
