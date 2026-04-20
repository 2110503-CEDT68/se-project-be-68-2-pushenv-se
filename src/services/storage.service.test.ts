import { StorageService } from "./storage.service.js";

describe("StorageService.relativeUrl", () => {
  it.each([
    ["avatars", "/uploads/avatars/file.png"],
    ["companyLogos", "/uploads/company-logos/file.png"],
    ["jobAttachments", "/uploads/job-attachments/file.png"],
    ["eventBanners", "/uploads/event-banners/file.png"],
  ] as const)("maps %s to the public upload path", (folder, expected) => {
    expect(StorageService.relativeUrl(folder, "file.png")).toBe(expected);
  });
});
