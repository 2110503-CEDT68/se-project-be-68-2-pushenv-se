import path from "node:path";

export const storageDirectories = {
  avatars: path.join(process.cwd(), "uploads", "avatars"),
  companyLogos: path.join(process.cwd(), "uploads", "company-logos"),
  jobAttachments: path.join(process.cwd(), "uploads", "job-attachments"),
  eventBanners: path.join(process.cwd(), "uploads", "event-banners"),
};

export class StorageService {
  static relativeUrl(folder: keyof typeof storageDirectories, filename: string) {
    const map = {
      avatars: "avatars",
      companyLogos: "company-logos",
      jobAttachments: "job-attachments",
      eventBanners: "event-banners",
    } as const;

    return `/uploads/${map[folder]}/${filename}`;
  }
}
