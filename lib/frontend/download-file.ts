export function downloadBrowserBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Native fetch of a public file. Not TanStack Query — blob save only. */
export async function downloadHrefAsFile(href: string, filename: string): Promise<void> {
  const response = await fetch(href);
  if (!response.ok) {
    throw new Error("Download failed.");
  }
  downloadBrowserBlob(filename, await response.blob());
}
