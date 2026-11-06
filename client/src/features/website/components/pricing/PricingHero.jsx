import { Eyebrow, LeafSprig, SiteIcon } from "../common";
import { TabletFrame, OverviewMock } from "../mockups";
import { PRICING_PERKS } from "../../utils/siteContent.js";
import { IMG } from "../../utils/siteImages.js";

export function PricingHero() {
  return (
    <section className="relative -mt-[72px] overflow-hidden pt-[72px]">
      <img
        src={IMG.pricingHeroStylist}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="hero-fade-left absolute inset-0 max-md:bg-cream/85" />
      <LeafSprig className="absolute -left-6 bottom-4 h-44 max-md:hidden" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 pb-14 pt-10 md:grid-cols-[1.1fr_1fr]">
        <div className="fade-up">
          <Eyebrow>Simple · Transparent · Value for salons</Eyebrow>
          <h1 className="mt-5 font-display text-5xl leading-[1.05] text-ink md:text-[3.6rem]">
            Choose the plan
            <br />
            that fits <span className="text-mauve">your salon.</span>
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-stone-700">
            Get all the tools you need to manage billing, appointments,
            customers, inventory, staff and grow your salon or spa business — at
            a price that makes sense.
          </p>
          <ul className="mt-8 grid max-w-lg grid-cols-2 gap-6 sm:grid-cols-4">
            {PRICING_PERKS.map(([icon, label]) => (
              <li key={label} className="text-center text-xs text-ink">
                <SiteIcon
                  name={icon}
                  size={28}
                  className="mx-auto mb-2 text-mauve"
                />
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative hidden md:block">
          {/* <TabletFrame className="float-slow w-[78%] -rotate-2">
            <OverviewMock />
          </TabletFrame> */}
          <p className="absolute right-0 top-0 rotate-[-6deg] font-display text-lg italic leading-tight text-mauve">
            Grow your
            <br />
            salon with
            <br />
            Salora Glam
          </p>
        </div>
      </div>
    </section>
  );
}
