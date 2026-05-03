import { NextResponse } from "next/server";
import { AttachmentType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const captureHeader = request.headers.get("x-gear-locker-camera-capture");
  const userAgent = request.headers.get("user-agent") ?? "";

  if (captureHeader !== "1") {
    return NextResponse.json({ message: "Use the in-app camera capture flow to add a photo." }, { status: 400 });
  }

  if (!/iPhone|iPad|iPod|Android|Mobile/i.test(userAgent)) {
    return NextResponse.json({ message: "Gear photos can only be added from a mobile device camera." }, { status: 400 });
  }

  const { assetId } = await params;
  const item = await prisma.item.findUnique({
    where: { assetId: decodeURIComponent(assetId) },
    include: { attachments: true },
  });

  if (!item) {
    return NextResponse.json({ message: "Item not found." }, { status: 404 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  const supabase = createSupabaseServiceClient();

  if (!bucket || !supabase) {
    return NextResponse.json(
      { message: "Photo capture is not configured yet." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("photo");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Capture a photo before saving." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "Only image captures are supported." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ message: "Photo is too large. Try a smaller capture." }, { status: 400 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `items/${item.assetId}/cover-${Date.now()}.${extension}`;
  const upload = await supabase.storage.from(bucket).upload(storagePath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  });

  if (upload.error) {
    return NextResponse.json({ message: "Could not save the photo right now." }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  await prisma.item.update({
    where: { id: item.id },
    data: { imageCoverUrl: publicUrl },
  });

  await prisma.attachment.create({
    data: {
      workspaceId: item.workspaceId,
      itemId: item.id,
      type: AttachmentType.photo,
      title: "Cover photo",
      fileName: file.name || `cover-${item.assetId}.${extension}`,
      fileUrl: publicUrl,
      storageBucket: bucket,
      storagePath,
      fileSize: file.size,
      mimeType: file.type,
      notes: "Captured from camera on mobile.",
    },
  });

  return NextResponse.json({ success: true, imageCoverUrl: publicUrl });
}
