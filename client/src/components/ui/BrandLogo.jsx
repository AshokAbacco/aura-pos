import { BRAND } from "../../config/brand.js";
import { cx } from "../../utils/cx.js";

/**
 * The Salora Glam logo. `variant="full"` is emblem + wordmark; `"mark"` is the emblem alone.
 * Height comes from className (e.g. h-10); width follows the image's proportions.
 */
export function BrandLogo({ variant = "full", className, alt = BRAND.name }) {
  return (
    <img
      src={variant === "mark" ? BRAND.mark : BRAND.full}
      alt={alt}
      className={cx("w-auto select-none", className)}
      draggable="false"
      decoding="async"
    />
  );
}
