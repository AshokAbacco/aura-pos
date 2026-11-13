/** /platform — platform admin with its own login (not inside the salon app shell). */
import { lazy } from "react";
import { Route } from "react-router-dom";

/**
 * Lazy page that works whether the file uses `export default function X` or `export function X`.
 * If neither is there (an empty or half-pasted file), say which file to fix instead of React's
 * cryptic "Cannot convert object to primitive value".
 */
const page = (load, name, file) =>
  lazy(() =>
    load().then((m) => {
      const C = m.default ?? m[name];
      if (typeof C !== "function")
        throw new Error(
          `${file} does not export ${name}. Copy this file again in full.`,
        );
      return { default: C };
    }),
  );

const PlatformAdminPage = page(
  () => import("./PlatformAdminPage.jsx"),
  "PlatformAdminPage",
  "platform-admin/PlatformAdminPage.jsx",
);
const OverviewPage = page(
  () => import("./pages/OverviewPage.jsx"),
  "OverviewPage",
  "platform-admin/pages/OverviewPage.jsx",
);
const SalonsPage = page(
  () => import("./pages/SalonsPage.jsx"),
  "SalonsPage",
  "platform-admin/pages/SalonsPage.jsx",
);
const SalonPage = page(
  () => import("./pages/SalonPage.jsx"),
  "SalonPage",
  "platform-admin/pages/SalonPage.jsx",
);
const SalonUserPage = page(
  () => import("./pages/SalonUserPage.jsx"),
  "SalonUserPage",
  "platform-admin/pages/SalonUserPage.jsx",
);
const FollowUpsPage = page(
  () => import("./pages/FollowUpsPage.jsx"),
  "FollowUpsPage",
  "platform-admin/pages/FollowUpsPage.jsx",
);
const MessagesPage = page(
  () => import("./pages/MessagesPage.jsx"),
  "MessagesPage",
  "platform-admin/pages/MessagesPage.jsx",
);
const SearchPage = page(
  () => import("./pages/SearchPage.jsx"),
  "SearchPage",
  "platform-admin/pages/SearchPage.jsx",
);
const TeamPage = page(
  () => import("./pages/TeamPage.jsx"),
  "TeamPage",
  "platform-admin/pages/TeamPage.jsx",
);
const SettingsPage = page(
  () => import("./pages/SettingsPage.jsx"),
  "SettingsPage",
  "platform-admin/pages/SettingsPage.jsx",
);
const PanelPage = page(
  () => import("./pages/PanelPage.jsx"),
  "PanelPage",
  "platform-admin/pages/PanelPage.jsx",
);

export const platformAdminRoutes = (
  <Route path="platform" element={<PlatformAdminPage />}>
    <Route index element={<OverviewPage />} />
    <Route path="salons" element={<SalonsPage />} />
    <Route path="salons/:id" element={<SalonPage />} />
    <Route path="salons/:id/users/:userId" element={<SalonUserPage />} />
    <Route path="follow-ups" element={<FollowUpsPage />} />
    <Route path="messages" element={<MessagesPage />} />
    <Route path="search" element={<SearchPage />} />
    <Route path="team" element={<TeamPage />} />
    <Route path="settings" element={<SettingsPage />} />
    <Route path="plans" element={<PanelPage panel="plans" />} />
    <Route path="payments" element={<PanelPage panel="payments" />} />
    <Route path="activity" element={<PanelPage panel="activity" />} />
    <Route path="webhooks" element={<PanelPage panel="webhooks" />} />
    <Route path="enquiries" element={<PanelPage panel="enquiries" />} />
  </Route>
);
