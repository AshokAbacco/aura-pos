import { LuCheck } from "react-icons/lu";
import { Eyebrow, PillLink, LeafSprig, SiteIcon } from "../common";
import { TabletFrame, DashboardMock } from "../mockups";
import { HOME_TICKS } from "../../utils/siteContent.js";
import { IMG } from "../../utils/siteImages.js";

const CHIPS = [
  ["bolt", "Fast Billing\nand Invoicing", "left-0 top-2"],
  ["calendar", "Smart\nScheduling", "right-0 -top-4"],
  ["chart", "Business\nInsights", "right-[-1rem] top-1/2"],
];

export function FeaturesHero() {
  return (
    <section className="relative -mt-[72px] overflow-hidden pt-[72px]">
      <img
        src={IMG.featuresHeroSalon}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="hero-fade-left absolute inset-0 max-md:bg-cream/85" />
      <LeafSprig className="absolute -left-4 top-24 h-44 max-md:hidden" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-2 md:pb-20">
        <div className="fade-up">
          <Eyebrow>Features</Eyebrow>
          <h1 className="mt-5 font-display text-[2.7rem] leading-[1.05] text-ink md:text-[3.6rem]">
            Everything Your Salon Needs to Grow in{" "}
            <span className="text-mauve">One Smart Platform</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-stone-700">
            Manage appointments, billing, customers, inventory, staff and
            business performance from one powerful salon and spa management
            platform.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <PillLink to="/register">Get started</PillLink>
            <a
              href="#billing"
              className="inline-flex items-center rounded-full border border-mauve/70 bg-white/60 px-6 py-3 text-sm font-semibold text-mauve hover:bg-white"
            >
              Explore features
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-600">
            {HOME_TICKS.map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <LuCheck size={14} className="text-mauve" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative px-6 py-8 fade-up [animation-delay:.15s]">
          {/* <TabletFrame className="mx-auto max-w-[520px] md:rotate-[-2deg]">
            <DashboardMock stats />
          </TabletFrame> */}
          {CHIPS.map(([icon, label, pos], i) => (
            <div
              key={label}
              className={`absolute hidden items-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold leading-tight text-ink shadow-lg sm:flex ${pos} ${i % 2 ? "float-slower" : "float-slow"}`}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-petal text-mauve">
                <SiteIcon name={icon} size={16} />
              </span>
              <span className="whitespace-pre-line">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
