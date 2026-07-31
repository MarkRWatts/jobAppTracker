import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readAttachmentFile } from "@/lib/attachments/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return new NextResponse("Not found", { status: 404 });

  const bytes = await readAttachmentFile(attachment.storedName);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.originalName)}"`,
      "Content-Length": String(attachment.sizeBytes),
    },
  });
}
