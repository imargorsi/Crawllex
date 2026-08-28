import {
  deleteStoredImage,
  storeBlobImage,
  validateImageFile,
} from "@/lib/storage/blob-image-storage";

export { validateImageFile as validateClientLogoFile } from "@/lib/storage/blob-image-storage";

export async function storeClientLogoFile(creatorUserId: string, file: File): Promise<string> {
  return storeBlobImage(`client-logos/${creatorUserId}`, file);
}

export async function deleteStoredClientLogo(storedPath: string | null | undefined): Promise<void> {
  return deleteStoredImage(storedPath);
}
