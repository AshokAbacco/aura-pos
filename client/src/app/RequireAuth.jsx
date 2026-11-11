import { Suspense } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { BrandLoader } from "../components/ui/BrandLoader.jsx";

/**
 * Protects the logged-in app (UI convenience only; the API checks every request).
 * - loading: restoring your session → brand loader
 * - offline: still signed in, but the server can't be reached yet (asleep / no internet) →
 *   brand loader with a "Try now" button; it keeps retrying and never sends you to the login page
 * - anon:    signed out → login page
 */
export function RequireAuth({ children }) {
  const { status, retry } = useAuth();
  const loc = useLocation();

  if (status === "loading") return <BrandLoader />;
  if (status === "offline")
    return (
      <BrandLoader
        message="Connecting to the server — you are still signed in"
        onRetry={retry}
      />
    );
  if (status !== "authed")
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  return <Suspense fallback={<BrandLoader />}>{children}</Suspense>;
}
