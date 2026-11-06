import { LuCheck } from "react-icons/lu";
import { Eyebrow, PillLink, LeafSprig } from "../common";
import { TabletFrame, DashboardMock } from "../mockups";
import { HOME_TICKS } from "../../utils/siteContent.js";
import { IMG } from "../../utils/siteImages.js";

export function HomeHero() {
  return (
    <section className="relative -mt-[72px] overflow-hidden pt-[72px]">
      <img
        src={IMG.homeHeroSalon}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="hero-fade-left absolute inset-0 max-md:bg-cream/85" />
      <LeafSprig className="absolute -left-6 bottom-0 h-40 max-md:hidden" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-[1.05fr_1fr] md:pb-20 md:pt-14">
        <div className="fade-up">
          <Eyebrow>Salon &amp; spa billing software</Eyebrow>
          <h1 className="mt-5 font-display text-5xl leading-[1.02] text-ink md:text-[4.1rem]">
            Your salon.
            <br />
            Your numbers.
            <br />
            <span className="text-mauve">All in one place.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-stone-700">
            Salora Glam brings your billing, appointments, staff and GST-ready
            accounts together, so you can run your salon smoother, smarter and
            more profitable.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <PillLink to="/register">Start 14-day free trial</PillLink>
            <PillLink to="/features" variant="outline" arrow={false}>
              See how it works
            </PillLink>
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
        <div className="relative fade-up [animation-delay:.15s]">
          {/* <TabletFrame className="mx-auto max-w-[540px] md:rotate-[-1.5deg]">
            <DashboardMock />
          </TabletFrame> */}
          <div className="float-slow absolute -bottom-6 left-2 rounded-xl bg-white px-4 py-3 shadow-xl md:-left-8 md:bottom-12">
            <p className="text-[11px] text-stone-500">Today’s Sales</p>
            <p className="flex items-end gap-2 font-display text-2xl text-ink">
              ₹12,480{" "}
              <span className="mb-1 rounded bg-emerald-50 px-1 font-sans text-[10px] font-semibold text-emerald-700">
                ▲ 12%
              </span>
              <span className="mb-1 flex items-end gap-0.5">
                {[6, 10, 8, 14].map((h, i) => (
                  <i
                    key={i}
                    className="w-1.5 rounded-sm bg-mauve/80"
                    style={{ height: h }}
                  />
                ))}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
