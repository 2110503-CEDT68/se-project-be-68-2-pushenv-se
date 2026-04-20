import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import {
  storageDirectories,
  StorageService,
} from "../services/storage.service.js";

const storage = multer.memoryStorage();
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const upload = multer({
  storage,
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Only JPEG, PNG, and WebP images are allowed"));
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export async function saveAvatarFile(
  file: Express.Multer.File,
): Promise<string> {
  await fs.mkdir(storageDirectories.avatars, { recursive: true });
  const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
  await fs.writeFile(
    path.join(storageDirectories.avatars, fileName),
    file.buffer,
  );
  return StorageService.relativeUrl("avatars", fileName);
}
