import { api, errorMessage } from "../lib/api.js";
import { saveFile } from "../lib/native.js";

/** Authenticated file download (the bearer token isn't sent on a plain <a href>). In the app it opens the share sheet. */
export async function downloadCsv(path, toast) {
  try {
    const r = await api.get(path, { responseType: "blob" });
    await saveFile(r.data, path.split("/").pop().split("?")[0]);
  } catch (e) {
    toast?.(errorMessage(e), "error");
  }
}
