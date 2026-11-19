export interface Video {
  id: string;
  publicId: string;
  title: string;
  description: string | null;
  duration: string;
  createdAt: string | Date;
  originalSize: string;
  compressedSize: string;
}