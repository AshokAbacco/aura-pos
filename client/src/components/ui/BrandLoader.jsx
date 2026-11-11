import { BRAND } from "../../config/brand.js";
import "./BrandLoader.css";

/**
 * Full-screen Salora Glam loader: shown while the app restores your session or loads a page.
 * Pass `message` to change the line under the bar, and `onRetry` to show a "Try now" button
 * (used when the server can't be reached yet).
 */
export function BrandLoader({
  message = "Preparing your experience",
  onRetry,
}) {
  return (
    <div className="salora-loader" role="status" aria-live="polite">
      <div className="salora-loader-glow" />
      <div className="salora-loader-content">
        <div className="salora-logo-wrapper">
          <div className="salora-orbit salora-orbit-one" />
          <div className="salora-orbit salora-orbit-two" />
          <span className="salora-sparkle sparkle-one" aria-hidden>
            ✦
          </span>
          <span className="salora-sparkle sparkle-two" aria-hidden>
            ✧
          </span>
          <span className="salora-sparkle sparkle-three" aria-hidden>
            ✦
          </span>
          <div className="salora-logo-card">
            <img
              src={BRAND.mark}
              alt={`${BRAND.name} logo`}
              className="salora-logo"
            />
          </div>
        </div>

        <div className="salora-loader-brand">
          <h1>{BRAND.name.toUpperCase()}</h1>
          <p>{BRAND.tagline.toUpperCase()}</p>
        </div>

        <div className="salora-loading-section">
          <div className="salora-loading-track">
            <div className="salora-loading-progress" />
          </div>
          <p className="salora-loading-text">
            {message}
            <span className="salora-loading-dots" aria-hidden>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </p>
          {onRetry && (
            <button
              type="button"
              className="salora-loader-retry"
              onClick={onRetry}
            >
              Try now
            </button>
          )}
        </div>

        <div className="salora-loader-footer">BEAUTY IN EVERY DETAIL</div>
      </div>
    </div>
  );
}
