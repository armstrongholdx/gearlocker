import Image from "next/image";
import { notFound } from "next/navigation";

import { generateQrCodeDataUrl } from "@/lib/qrcode";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LabelPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const decodedAssetId = decodeURIComponent(assetId);
  const item = await prisma.item.findUnique({
    where: { assetId: decodedAssetId },
  });

  if (!item) {
    notFound();
  }

  const qrCode = await generateQrCodeDataUrl(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${item.qrCodeValue}`);

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 print:border-0">
      <div className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gear Locker Label</p>
        <h1 className="text-2xl font-semibold">{item.assetId}</h1>
        <p className="text-sm text-muted-foreground">{item.name}</p>
        <div className="flex justify-center">
          <Image src={qrCode} alt={`QR for ${item.assetId}`} width={260} height={260} />
        </div>
        <p className="text-xs text-muted-foreground">Scan to open the asset record on mobile.</p>
      </div>
    </div>
  );
}
