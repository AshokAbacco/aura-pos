/** Salon settings: business & GST, each branch's receipt details and chairs by floor, coupons, team access. */
import { Fragment, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { PageHeader, ErrorNote, Skeleton } from "../../components/ui";
import { useApi } from "../../hooks/useApi.js";
import { SettingsSection } from "./components/SettingsSection.jsx";
import { BusinessProfileForm } from "./components/BusinessProfileForm.jsx";
import { BranchForm } from "./components/BranchForm.jsx";
import { CouponsSection } from "./components/CouponsSection.jsx";
import { ChairsSection } from "./components/ChairsSection.jsx";
import { TeamSection } from "./components/TeamSection.jsx";

export default function SettingsPage() {
  const { can, reload } = useAuth();
  const s = useApi("/settings");
  const [formKey, setFormKey] = useState(0); // remount forms with fresh values after a save
  useEffect(() => {
    if (s.data) setFormKey((k) => k + 1);
  }, [s.data]);
  // Deep links such as /app/settings#chairs (from the billing counter) scroll once the page has loaded.
  const loaded = !!s.data;
  useEffect(() => {
    if (loaded && window.location.hash)
      document
        .getElementById(window.location.hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth" });
  }, [loaded]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <PageHeader
        title="Salon settings"
        subtitle="Business details, GST, receipts, coupons and team access."
      />
      {s.error && <ErrorNote onRetry={s.reload}>{s.error}</ErrorNote>}
      {s.loading || !s.data ? (
        <Skeleton rows={6} />
      ) : (
        <>
          <SettingsSection
            title="Business & GST"
            description="Used on every invoice. Changes apply to new bills; past invoices keep their original details."
          >
            <BusinessProfileForm
              key={`p${formKey}`}
              tenant={s.data}
              onSaved={() => {
                s.reload();
                reload();
              }}
            />
          </SettingsSection>
          {s.data.branches.map((b, i) => (
            <Fragment key={b.id}>
              <SettingsSection
                title={`Branch: ${b.name}`}
                description="Address, phone and UPI ID printed on this branch’s receipts."
              >
                <BranchForm key={`b${formKey}`} branch={b} onSaved={s.reload} />
              </SettingsSection>
              <SettingsSection
                id={i === 0 ? "chairs" : undefined}
                title={`Chairs & floors: ${b.name}`}
                description="The floor plan on the billing counter. Group chairs, rooms and stations by floor and set their order."
              >
                <ChairsSection branch={b} onChanged={s.reload} />
              </SettingsSection>
            </Fragment>
          ))}
          <SettingsSection
            title="Coupons"
            description="Codes cashiers can apply at the counter."
          >
            <CouponsSection />
          </SettingsSection>
          {can("users.manage") && (
            <SettingsSection
              title="Team access"
              description="Who can sign in, and with which role. Disabling someone signs them out everywhere."
            >
              <TeamSection />
            </SettingsSection>
          )}
        </>
      )}
    </div>
  );
}
