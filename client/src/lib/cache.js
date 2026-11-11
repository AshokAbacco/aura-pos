/**
 * Last-known API data, so screens open instantly and refresh in the background
 * (stale-while-revalidate, like Instagram showing your feed before it reloads).
 *
 * - Web: kept in memory only (fast back/forward between pages; gone on reload).
 * - Phone app: also saved in the app's private storage, so the app opens with the last data even
 *   before the server answers (or while it wakes up).
 * Entries are scoped to the signed-in user and branch, and everything is wiped on sign-out.
 */
import { isNative } from "./native.js";

const PREFIX = "aura.cache:";
const MAX_ENTRY = 250_000; // bytes of JSON; bigger responses are not persisted
const MAX_KEYS = 60;
const mem = new Map();
let scope = "";

/** Called by AuthContext: `${userId}` once signed in, '' when signed out. */
export function setCacheScope(s) {
  scope = s ?? "";
}

const keyOf = (url) =>
  `${scope}|${sessionStorage.getItem("aura.branch") ?? ""}|${url}`;
const safe = (fn, fallback) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export function readCache(url) {
  if (!scope || !url) return undefined;
  const k = keyOf(url);
  if (mem.has(k)) return mem.get(k);
  if (!isNative) return undefined;
  const raw = safe(() => localStorage.getItem(PREFIX + k), null);
  if (!raw) return undefined;
  const v = safe(() => JSON.parse(raw), undefined);
  if (v) mem.set(k, v);
  return v;
}

export function writeCache(url, value) {
  if (!scope || !url) return;
  const k = keyOf(url);
  mem.set(k, value);
  if (!isNative) return;
  const json = safe(() => JSON.stringify(value), "");
  if (!json || json.length > MAX_ENTRY) return;
  safe(() => {
    localStorage.setItem(PREFIX + k, json);
    // Keep the newest MAX_KEYS entries.
    const index = JSON.parse(
      localStorage.getItem(`${PREFIX}index`) ?? "[]",
    ).filter((x) => x !== k);
    index.push(k);
    while (index.length > MAX_KEYS)
      localStorage.removeItem(PREFIX + index.shift());
    localStorage.setItem(`${PREFIX}index`, JSON.stringify(index));
  });
}

/** Sign-out: forget everything. */
export function clearCache() {
  mem.clear();
  safe(() =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k)),
  );
}

// The signed-in profile, so the app can show the dashboard before the server answers.
const ME_KEY = "aura.me";
export const readSavedMe = () =>
  isNative
    ? safe(() => JSON.parse(localStorage.getItem(ME_KEY) ?? "null"), null)
    : null;
export const saveMe = (me) => {
  if (isNative)
    safe(() =>
      me
        ? localStorage.setItem(ME_KEY, JSON.stringify(me))
        : localStorage.removeItem(ME_KEY),
    );
};
