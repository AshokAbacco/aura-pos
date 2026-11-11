/**
 * Logged-in shell: subscription banner, top bar, sidebar (drawer on phones), and the current page.
 * The page area has pull-to-refresh on touch screens, an error boundary (a crash shows a message,
 * never a blank screen), and respects the notch / home indicator on iPhones and Android cut-outs.
 */
import { Suspense, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth.js";
import { EntitlementBanner } from "./components/EntitlementBanner.jsx";
import { TopBar } from "./components/TopBar.jsx";
import { SidebarNav } from "./components/SidebarNav.jsx";
import { PullToRefresh } from "./components/PullToRefresh.jsx";
import { SlowServerNotice } from "./components/SlowServerNotice.jsx";
import { ErrorBoundary } from "../../components/ui/ErrorBoundary.jsx";
import { BrandLogo } from "../../components/ui/BrandLogo.jsx";

export default function AppLayout() {
  const { me, can, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  // New page → start at the top (the page area scrolls, not the window).
  useEffect(() => {
    setOpen(false);
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="safe-x flex h-full flex-col bg-stone-100">
      <EntitlementBanner e={me?.entitlement} />
      <TopBar me={me} onMenu={() => setOpen(true)} onLogout={logout} />
      <div className="flex min-h-0 flex-1">
        {/* Desktop: a slim icon rail that widens over the page while hovered (or keyboard-focused) */}
        <div className="no-print relative hidden w-[4.25rem] shrink-0 lg:block">
          <aside className="group/side absolute inset-y-0 left-0 z-30 flex w-[4.25rem] flex-col border-r border-stone-200 bg-white transition-[width,box-shadow] duration-200 ease-out hover:w-60 hover:shadow-2xl has-[:focus-visible]:w-60 has-[:focus-visible]:shadow-2xl">
            <SidebarNav can={can} rail />
          </aside>
        </div>
        {open && (
          <div
            className="no-print fixed inset-0 z-40 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div
              className="absolute inset-0 bg-stone-900/40"
              onClick={() => setOpen(false)}
            />
            <aside className="safe-top safe-bottom absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
                <BrandLogo className="h-9" />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="p-1"
                >
                  <FiX />
                </button>
              </div>
              <SidebarNav can={can} />
            </aside>
          </div>
        )}
        <main
          ref={mainRef}
          className="safe-bottom min-w-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <PullToRefresh scrollRef={mainRef}>
            <ErrorBoundary key={pathname}>
              <Suspense
                fallback={
                  <div className="p-6 text-sm text-stone-500" aria-busy="true">
                    Loading…
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </PullToRefresh>
        </main>
      </div>
      <SlowServerNotice />
    </div>
  );
}
