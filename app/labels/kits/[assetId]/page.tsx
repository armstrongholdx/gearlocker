import Image from "next/image";
import { notFound } from "next/navigation";

import { generateQrCodeDataUrl } from "@/lib/qrcode";
import { prisma } from "@/lib/prisma";
import {
  buildPublicScanUrl,
  chooseReachableOrigin,
  describeScanReachability,
  isUsingFallbackOrigin,
  kitDetailPath,
} from "@/lib/paths";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export default async function KitLabelPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const decodedAssetId = decodeURIComponent(assetId);
  const [kit, requestOrigin] = await Promise.all([
    prisma.kit.findUnique({
      where: { assetId: decodedAssetId },
      include: { _count: { select: { items: true } } },
    }),
    getRequestOrigin(),
  ]);

  if (!kit) {
    notFound();
  }

  const scanOrigin = chooseReachableOrigin(requestOrigin);
  const publicScanUrl = buildPublicScanUrl(kit.assetId, scanOrigin);
  const scanReachability = describeScanReachability(requestOrigin);
  const qrCode = await generateQrCodeDataUrl(publicScanUrl);

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 print:border-0">
      <div className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gear Locker Kit Label</p>
        <div className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
          Kit · {kit._count.items} members
        </div>
        <h1 className="text-2xl font-semibold">{kit.assetId}</h1>
        <p className="text-sm text-muted-foreground">{kit.name}</p>
        <div className="flex justify-center">
          <Image src={qrCode} alt={`QR for ${kit.assetId}`} width={260} height={260} />
        </div>
        <p className="text-xs text-muted-foreground">QR destination: {publicScanUrl}</p>
        <p className="text-xs text-muted-foreground">Scan opens kit quick actions first, then links deeper into {kitDetailPath(kit.assetId)}.</p>
        {scanReachability.needsLanHostForPhone ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-900">
            This QR still points at a loopback address. Use a reachable public or LAN host before printing labels for phone scanning.
          </div>
        ) : null}
        {isUsingFallbackOrigin(requestOrigin) ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-left text-xs text-sky-900">
            QR origin is currently inferred from the request host: <span className="font-mono">{scanOrigin}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
