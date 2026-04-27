import prisma from "./prisma.js";
import { deleteStoredUpload, saveAvatarFile } from "./uploads.js";

/** Validate name field — returns error message or null */
export function validateName(name: string): string | null {
  if (typeof name !== "string") return "Invalid name format";
  if (name.trim() === "") return "Name cannot be empty";
  return null;
}

/** Validate phone field — returns error message or null */
export function validatePhone(phone: string): string | null {
  if (typeof phone !== "string") return "Invalid phone format";
  if (phone.trim() === "") return "Phone cannot be empty";
  return null;
}

/** Delete old avatar file and save new one, returns new avatar path */
export async function replaceAvatar(
  userId: string,
  file: Express.Multer.File,
): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true },
  });
  if (existing?.avatar) {
    try {
      await deleteStoredUpload(existing.avatar);
    } catch (error) {
      const fileError = error as NodeJS.ErrnoException;
      if (fileError.code !== "ENOENT") {
        console.error("Failed to delete old avatar:", error);
      }
    }
  }
  return saveAvatarFile(file);
}

/** Shared profile-update logic: validate, handle avatar, then save */
export async function updateUserProfile<T>({
  userId,
  name,
  phone,
  file,
  selectFields,
}: {
  userId: string;
  name?: string | undefined;
  phone?: string | undefined;
  file?: Express.Multer.File | undefined;
  selectFields: T;
}): Promise<{ error: string } | { data: unknown }> {
  if (name !== undefined) {
    const err = validateName(name);
    if (err) return { error: err };
  }
  if (phone !== undefined) {
    const err = validatePhone(phone);
    if (err) return { error: err };
  }

  const data: { name?: string; phone?: string; avatar?: string } = {};
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (file) data.avatar = await replaceAvatar(userId, file);

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: selectFields as Record<string, boolean>,
  });
  return { data: updated };
}
