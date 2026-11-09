/**
 * Everything specific to the Android app (Capacitor) lives here, so the rest of the code
 * only asks `isNative` and calls the helpers below. In a normal browser every helper falls
 * back to the web behaviour and no native plugin is loaded.
 */
import { Capacitor, registerPlugin } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'web' | 'android' | 'ios'

// ───────────── Refresh token (the app can't use the HttpOnly cookie) ─────────────
// Stored in the app's private storage (Android SharedPreferences, readable only by this app).
const RT_KEY = "aura.refreshToken";
let rtCache;

export async function getRefreshToken() {
  if (!isNative) return null;
  if (rtCache !== undefined) return rtCache;
  const { Preferences } = await import("@capacitor/preferences");
  rtCache = (await Preferences.get({ key: RT_KEY })).value ?? null;
  return rtCache;
}
export async function setRefreshToken(token) {
  if (!isNative) return;
  rtCache = token ?? null;
  const { Preferences } = await import("@capacitor/preferences");
  if (token) await Preferences.set({ key: RT_KEY, value: token });
  else await Preferences.remove({ key: RT_KEY });
}

// ───────────── Printing (receipts, P&L) ─────────────
// Android's WebView ignores window.print(); the app has a tiny native plugin (PrinterPlugin.java)
// that hands the current page to Android's print service (PDF, Wi-Fi/Bluetooth printers).
const Printer = registerPlugin("Printer");
export async function printPage(jobName = "Salora Glam") {
  if (isNative) {
    await Printer.print({ name: jobName });
    return;
  }
  window.print();
}

// ───────────── Saving files (CSV exports) ─────────────
/** Save a Blob: browser download, or on the phone write it to the app cache and open the share sheet. */
export async function saveFile(blob, filename) {
  if (!isNative) {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: filename,
    });
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);
  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: await blob.text(),
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await Share.share({
    title: filename,
    files: [uri],
    dialogTitle: `Save or send ${filename}`,
  });
}

// ───────────── App shell: back button, status bar, splash ─────────────
/** Call once at start-up. Android back button goes back in the app, and leaves it from the first screen. */
export async function initNativeShell() {
  if (!isNative) return;
  document.documentElement.classList.add("is-native");
  const [{ App }, { StatusBar, Style }, { SplashScreen }] = await Promise.all([
    import("@capacitor/app"),
    import("@capacitor/status-bar"),
    import("@capacitor/splash-screen"),
  ]);
  App.addListener("backButton", ({ canGoBack }) => {
    // Let an open dialog close first (dialogs listen for Escape).
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      return;
    }
    if (canGoBack) window.history.back();
    else App.exitApp();
  });
  await StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  await StatusBar.setBackgroundColor({ color: "#ffffff" }).catch(() => {});
  await SplashScreen.hide().catch(() => {});
}
