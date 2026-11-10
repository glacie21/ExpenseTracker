/** The server's message from a failed response, or a generic one. */
async function errorMessage(res: Response): Promise<string> {
  try {
    const json = await res.json();
    if (json?.message) return json.message;
  } catch {
    // non-JSON error body
  }
  return "Gagal mengunduh file.";
}

/**
 * Client helper for files that can be large: the browser's own download manager
 * writes the file straight to disk and shows progress, so it never has to fit in
 * this page's memory. It cannot report errors back to the page, so the endpoint
 * is asked first (`check=1`) whether the request is acceptable. Resolves once
 * the download has been handed over, not when it has finished.
 */
export async function startFileDownload(url: string): Promise<void> {
  const check = await fetch(`${url}${url.includes("?") ? "&" : "?"}check=1`, { cache: "no-store" });
  if (!check.ok) throw new Error(await errorMessage(check));

  const link = document.createElement("a");
  link.href = url;
  link.download = ""; // keep the filename the server sends
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Client helper: fetch a file endpoint and save it, holding the whole file in
 * memory on the way. Throws an Error with the server's message when the request
 * fails (e.g. no data, invalid filter).
 */
export async function downloadFile(url: string, fallbackName: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) throw new Error(await errorMessage(res));

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
