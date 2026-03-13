import Image from "next/image";
import { notFound } from "next/navigation";

import { generateQrCodeDataUrl } from "@/lib/qrcode";
import { prisma } from "@/lib/prisma";
import {
  buildPublicScanUrl,
  chooseReachableOrigin,
  describeScanReachability,
  isUsingFallbackOrigin,
  itemDetailPath,
} from "@/lib/paths";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export default async function LabelPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const decodedAssetId = decodeURIComponent(assetId);
  const [item, requestOrigin] = await Promise.all([
    prisma.item.findUnique({
      where: { assetId: decodedAssetId },
    }),
    getRequestOrigin(),
  ]);

  if (!item) {
    notFound();
  }

  const scanOrigin = chooseReachableOrigin(requestOrigin);
  const publicScanUrl = buildPublicScanUrl(item.assetId, scanOrigin);
  const scanReachability = describeScanReachability(requestOrigin);
  const qrCode = await generateQrCodeDataUrl(publicScanUrl);

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 print:border-0">
      <div className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gear Locker Label</p>
        <h1 className="text-2xl font-semibold">{item.assetId}</h1>
        <p className="text-sm text-muted-foreground">{item.name}</p>
        <div className="flex justify-center">
          <Image src={qrCode} alt={`QR for ${item.assetId}`} width={260} height={260} />
        </div>
        <p className="text-xs text-muted-foreground">QR destination: {publicScanUrl}</p>
        <p className="text-xs text-muted-foreground">Scan opens the scan action flow first, then links deeper into {itemDetailPath(item.assetId)}.</p>
        {scanReachability.needsLanHostForPhone ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-900">
            This QR still points at a loopback address. For iPhone camera scanning on your local network, use your Mac&apos;s LAN address, such as http://192.168.1.50:3000, and access Gear Locker through that host before printing labels.
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
