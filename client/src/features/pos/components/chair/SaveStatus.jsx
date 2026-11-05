import {
  LuCheck,
  LuLoaderCircle,
  LuCloudAlert,
  LuCloudUpload,
} from "react-icons/lu";

/** "Saved" / "Saving…" indicator for the chair's ticket (edits save automatically). */
export function SaveStatus({ status }) {
  const map = {
    saved: [LuCheck, "Saved", "text-emerald-700"],
    dirty: [LuCloudUpload, "Saving…", "text-stone-500"],
    saving: [LuLoaderCircle, "Saving…", "text-stone-500 [&>svg]:animate-spin"],
    error: [LuCloudAlert, "Not saved — check connection", "text-rose-700"],
    loading: [
      LuLoaderCircle,
      "Loading…",
      "text-stone-500 [&>svg]:animate-spin",
    ],
  };
  const [Icon, label, cls] = map[status] ?? map.saved;
  return (
    <span
      role="status"
      className={`flex items-center gap-1 text-xs font-medium ${cls}`}
    >
      <Icon size={14} aria-hidden />
      {label}
    </span>
  );
}
