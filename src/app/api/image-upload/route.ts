import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/src/lib/cloudinary";
import { auth } from "@clerk/nextjs/server";

interface CloudinaryUploadResponse {
  public_id: string;
  [key: string]: any; // Allow additional properties
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
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
              folder: "cloudora-images",
              resource_type: "auto",
            },
            (error, result) => {
              if (error || !result) {
                reject(error ?? new Error("Upload failed"));
              } else {
                resolve(result);
              }
            }
          )
          .end(buffer);
      }
    );

    return NextResponse.json({ public_id: result.public_id }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
  }
}
