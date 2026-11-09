/**
 * Every page of the client, assembled from each feature's own <feature>.routes.jsx.
 *   /              public website          features/website   (layouts/site)
 *   /login …       sign-in & recovery      features/auth
 *   /app/…         salon workspace         one feature folder per page (layouts/app)
 *   /platform      Super Admin             features/platform-admin (web only)
 * In the Android app, "/" opens the salon workspace instead of the marketing home page (see HomePage).
 * To add a page: create features/<name>/<Name>Page.jsx + <name>.routes.jsx, export it from
 * features/<name>/index.js, add it below and (if it needs a menu entry) to layouts/app/navItems.js.
 */
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { isNative } from "../lib/native.js";
import { RequireAuth } from "./RequireAuth.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import SiteLayout from "../layouts/site/SiteLayout.jsx";

import { websiteRoutes } from "../features/website";
import { authRoutes } from "../features/auth";
import { dashboardRoutes } from "../features/dashboard";
import { posRoutes } from "../features/pos";
import { appointmentsRoutes } from "../features/appointments";
import { clientsRoutes } from "../features/clients";
import { catalogRoutes } from "../features/catalog";
import { inventoryRoutes } from "../features/inventory";
import { staffRoutes } from "../features/staff";
import { membershipsRoutes } from "../features/memberships";
import { expensesRoutes } from "../features/expenses";
import { invoicesRoutes } from "../features/invoices";
import { pnlRoutes } from "../features/pnl";
import { reportsRoutes } from "../features/reports";
import { settingsRoutes } from "../features/settings";
import { subscriptionRoutes } from "../features/subscription";
import { platformAdminRoutes } from "../features/platform-admin";

const AppLayout = lazy(() => import("../layouts/app/AppLayout.jsx"));
const Loading = <div className="p-6 text-sm text-stone-500">Loading…</div>;

export function AppRoutes() {
  return (
    <Suspense fallback={Loading}>
      <Routes>
        <Route element={<SiteLayout />}>{websiteRoutes}</Route>
        {authRoutes}
        <Route
          path="app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          {dashboardRoutes}
          {posRoutes}
          {appointmentsRoutes}
          {clientsRoutes}
          {catalogRoutes}
          {inventoryRoutes}
          {staffRoutes}
          {membershipsRoutes}
          {expensesRoutes}
          {invoicesRoutes}
          {pnlRoutes}
          {reportsRoutes}
          {settingsRoutes}
          {subscriptionRoutes}
        </Route>
        {!isNative && platformAdminRoutes}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
