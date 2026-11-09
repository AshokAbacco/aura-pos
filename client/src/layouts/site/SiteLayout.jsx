/** Public website shell: navbar, page, footer. Visually separate from the logged-in POS. */
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SiteHeader } from "./components/SiteHeader.jsx";
import { SiteFooter } from "./components/SiteFooter.jsx";
import { isNative } from "../../lib/native.js";

export default function SiteLayout({ children }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="flex min-h-full flex-col bg-cream text-ink">
      {/* In the Android app the marketing navbar/footer are replaced by a plain brand bar. */}
      {isNative ? (
        <div className="px-5 py-4 font-display text-2xl font-semibold text-ink">
          Salora Glam
        </div>
      ) : (
        <SiteHeader />
      )}
      <main className="flex flex-1 flex-col">{children ?? <Outlet />}</main>
      {!isNative && <SiteFooter />}
    </div>
  );
}
