"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, ClipboardCheck, ScanLine } from "lucide-react";
import type { ComponentType } from "react";

import { ScanTerminal } from "@/components/scan/scan-terminal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="md:hidden">
        <ScanTerminal />
      </div>

      <div className="hidden space-y-4 md:block">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Scan</div>
          <h1 className="text-3xl font-semibold tracking-tight">Scan gear</h1>
        </div>
      </div>

      <div className="hidden gap-4 xl:grid-cols-[0.8fr_1.2fr] md:grid">
        <Card className="bg-slate-950 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ScanLine className="h-5 w-5 text-accent" />
              Scan tools
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ScanConcept icon={Boxes} title="Item" body="Check out, move, inspect, repair." />
            <ScanConcept icon={ClipboardCheck} title="Kit" body="Check out or return verify." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Manual lookup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input value={assetId} onChange={(event) => setAssetId(event.target.value)} placeholder="CAM-001 or KIT-001" />
              <Button type="submit" className="w-full sm:w-auto">Open scan</Button>
            </form>
            <div className="grid gap-3 md:grid-cols-2">
              <QuickActionHint title="Item" items="Inspect, check out, check in, move." />
              <QuickActionHint title="Kit" items="Inspect, check out, return verify." />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickActionHint({ title, items }: { title: string; items: string }) {
  return (
    <div className="rounded-[1.1rem] border border-slate-200 bg-secondary/55 p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{title}</div>
      <div className="mt-2 text-sm text-muted-foreground">{items}</div>
    </div>
  );
}

function ScanConcept({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-white/5 p-4">
      <Icon className="h-4 w-4 text-accent" />
      <div className="mt-3 font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-slate-300">{body}</div>
    </div>
  );
}
