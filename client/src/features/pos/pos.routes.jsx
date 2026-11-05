/** Billing counter pages, mounted under /app by app/router.jsx. Pages are lazy-loaded. */
import { lazy } from "react";
import { Route } from "react-router-dom";

const FloorPage = lazy(() => import("./FloorPage.jsx")); // /app/pos — chairs by floor
const ChairPage = lazy(() => import("./ChairPage.jsx")); // /app/pos/chairs/:chairId — add/remove items
const QuickSalePage = lazy(() => import("./QuickSalePage.jsx")); // /app/pos/quick — bill without a chair

export const posRoutes = (
  <>
    <Route path="pos" element={<FloorPage />} />
    <Route path="pos/chairs/:chairId" element={<ChairPage />} />
    <Route path="pos/quick" element={<QuickSalePage />} />
  </>
);
