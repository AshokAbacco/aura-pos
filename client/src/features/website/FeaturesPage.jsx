/** Features: hero, module icons, seven numbered feature sections with illustrated screens, call to action. */
import { usePageMeta } from "./hooks/usePageMeta.js";
import { useReveal } from "./hooks/useReveal.js";
import { CtaBanner, IconFeatureRow, SectionTitle } from "./components/common";
import { FeaturesHero } from "./components/features/FeaturesHero.jsx";
import { FeatureSection } from "./components/features/FeatureSection.jsx";
import { FEATURE_ICONS, FEATURE_SECTIONS } from "./utils/siteContent.js";
import { IMG } from "./utils/siteImages.js";

export default function FeaturesPage() {
  usePageMeta(
    "Features",
    "POS billing, appointments, CRM, memberships, inventory, staff commission and profit & loss for salons and spas.",
  );
  const ref = useReveal();
  return (
    <div ref={ref}>
      <FeaturesHero />
      <IconFeatureRow items={FEATURE_ICONS} />
      <div className="pt-14">
        <p className="flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-mauve">
          <span className="h-px w-10 bg-mauve/40" />
          Powerful features
          <span className="h-px w-10 bg-mauve/40" />
        </p>
        <SectionTitle
          className="mt-3 px-5"
          title="Designed for Modern Salon & Spa Businesses"
          subtitle="From front desk to back office, Salora Glam has everything you need to run your salon smoothly, save time and grow your business."
        />
      </div>
      {FEATURE_SECTIONS.map((s, i) => (
        <FeatureSection key={s.id} section={s} index={i} />
      ))}
      <div className="pt-6">
        <CtaBanner
          eyebrow="Ready to transform your salon?"
          title="Start using Salora Glam today"
          body="Set up your salon, add your services and staff, and start billing in minutes. No card needed. Free for 14 days."
          cta="Get started free"
          image={IMG.ctaSpaCandles}
        />
      </div>
    </div>
  );
}
