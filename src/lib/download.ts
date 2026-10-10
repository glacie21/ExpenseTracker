/**
 * Client helper: fetch a file endpoint and save it. Throws an Error with the
 * server's message when the request fails (e.g. no data, invalid filter).
 */
export async function downloadFile(url: string, fallbackName: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    let message = "Gagal mengunduh file.";
    try {
      const json = await res.json();
      if (json?.message) message = json.message;
    } catch {
      // non-JSON error body
    }
    throw new Error(message);
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] || fallbackName;

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before revoking
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

  return filename;
}
