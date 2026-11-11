/**
 * Brand: the one place to change the product name and logos.
 *
 * Logo files live in src/assets/brand/ (bundled and cached by Vite):
 *   logo-full.png  — emblem + wordmark, transparent PNG, ~900 px wide (shown 32–48 px tall)
 *   logo-mark.png  — emblem only, square transparent PNG, 256 × 256
 * Favicons and app icons are separate files: public/favicon.png, public/apple-touch-icon.png,
 * public/icon-512.png, and client/assets/* for the Android/iOS app (see docs/06-android.md).
 */
import full from "/logo/brand-logo.png";
import mark from "/logo/brand-logo-circle.png";

export const BRAND = {
  name: "Salora Glam",
  tagline: "Salon & Spa Billing Software",
  full,
  mark,
};
