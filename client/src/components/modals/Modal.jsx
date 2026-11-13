import { useEffect, useId, useRef } from "react";
import { FiX } from "react-icons/fi";
import { cx } from "../../utils/cx.js";

/**
 * Accessible dialog: focus moves in, Tab is trapped, Esc closes, focus returns to the trigger.
 * Focus moves in ONCE, when the dialog opens. `onClose` is read through a ref, so a parent that
 * passes a new arrow function on every render (every keystroke) doesn't pull focus back to the
 * first field while someone is typing.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}) {
  const ref = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const node = ref.current;
    const focusables = () =>
      [
        ...node.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => !el.disabled);
    (focusables()[1] ?? focusables()[0])?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") closeRef.current?.();
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === f.at(-1)) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          "flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-bold text-stone-900">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-stone-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-stone-500 hover:bg-stone-100"
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-stone-200 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
