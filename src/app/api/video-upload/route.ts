import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/src/lib/cloudinary";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/src/lib/prisma";

interface CloudinaryUploadResponse {
  public_id: string;
  bytes: number;
  duration?: number;
  [key: string]: any; // Allow additional properties
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const title = formData.get("title");
    const description = formData.get("description");
    const originalSize = formData.get("originalSize");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate video
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Only video files are allowed" },
        { status: 400 },
      );
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof originalSize !== "string" ||
      !originalSize.trim()
    ) {
      return NextResponse.json(
        { error: "Title and original size are required" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<CloudinaryUploadResponse>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "cloudora-videos",
              resource_type: "video",
              transformation: [
                {
                  quality: "auto",
                  fetch_format: "mp4",
                },
              ],
            },
            (error, result) => {
              if (error || !result) {
                reject(error ?? new Error("Upload failed"));
              } else {
                resolve(result);
              }
            },
          )
          .end(buffer);
      },
    );

    const video = await prisma.video.create({
      data: {
        title,
        description: typeof description === "string" ? description : null,
        publicId: result.public_id,
        originalSize,
        compressedSize: String(result.bytes),
        duration: String(result.duration ?? 0),
      },
    });

    return NextResponse.json(video, { status: 200 });
  } catch (error) {
    console.error("Video upload failed:", error);

    return NextResponse.json({ error: "Video upload failed" }, { status: 500 });
  }
}
