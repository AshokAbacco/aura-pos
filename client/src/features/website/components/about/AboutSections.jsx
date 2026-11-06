import {
  Eyebrow,
  PillLink,
  LeafSprig,
  SectionTitle,
  IconCircle,
  SiteIcon,
  CheckList,
} from "../common";
import {
  TabletFrame,
  LaptopFrame,
  PhoneFrame,
  OverviewMock,
  DashboardMock,
  AppointmentFormMock,
} from "../mockups";
import {
  ABOUT_PRODUCT_POINTS,
  APPROACH,
  COMPANY,
  VALUES,
} from "../../utils/siteContent.js";
import { IMG } from "../../utils/siteImages.js";

export function AboutHero() {
  return (
    <section className="relative -mt-[72px] overflow-hidden pt-[72px]">
      <img
        src={IMG.aboutHeroStylist}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="hero-fade-left absolute inset-0 max-md:bg-cream/85" />
      <LeafSprig className="absolute -left-6 top-24 h-44 max-md:hidden" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-10 md:grid-cols-[1.1fr_1fr]">
        <div className="fade-up">
          <Eyebrow>About Salora Glam</Eyebrow>
          <h1 className="mt-5 font-display text-[2.7rem] leading-[1.05] text-ink md:text-[3.5rem]">
            Built by
            <br />
            {COMPANY.name}
            <br />
            for the <span className="text-mauve">Salon &amp; Spa Industry</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-stone-700">
            Salora Glam is a powerful salon and spa management software by{" "}
            {COMPANY.name}. We combine technology, creativity and business
            understanding to help salon owners run their businesses with ease
            and grow efficiently.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <PillLink to="/register">Get Started</PillLink>
            <PillLink to="/features" variant="outline" arrow={false}>
              Learn More
            </PillLink>
          </div>
        </div>
        <div className="hidden md:block">
          {/* <TabletFrame className="float-slow ml-auto w-[80%] -rotate-1">
            <OverviewMock />
          </TabletFrame> */}
        </div>
      </div>
    </section>
  );
}

export function WhoWeAre() {
  return (
    <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2">
      <img
        data-reveal
        src={IMG.aboutOfficeReception}
        alt=""
        className="h-80 w-full rounded-3xl object-cover shadow-lg"
      />
      <div data-reveal className="relative">
        <LeafSprig flip className="absolute -right-6 -top-10 h-36" />
        <Eyebrow>Who we are</Eyebrow>
        <h2 className="mt-4 font-display text-4xl text-ink">{COMPANY.name}</h2>
        <p className="mt-4 text-sm leading-relaxed text-stone-600">
          {COMPANY.name} is a software development company focused on building
          practical and high-quality digital solutions for businesses. We work
          with organizations across different industries to develop web
          applications, mobile apps, CRM and ERP systems, business automation
          tools and custom software.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          We understand real business challenges and create technology solutions
          that make operations simpler, faster and more efficient.
        </p>
        <PillLink href={COMPANY.website} className="mt-6">
          Visit {COMPANY.name}
        </PillLink>
      </div>
    </section>
  );
}

export function WhyWeCreated() {
  return (
    <section className="bg-gradient-to-b from-cream to-petal/60">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2">
        <div data-reveal>
          <Eyebrow>Why we created Salora Glam</Eyebrow>
          <h2 className="mt-4 font-display text-4xl leading-tight text-ink">
            A POS Designed Specifically for Salon &amp; Spa Businesses
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            Through our experience in building industry-specific software, we
            saw the need for a simple, powerful and affordable salon management
            solution. That’s how Salora Glam was created.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Salora Glam helps salon and spa owners manage appointments, billing,
            customers, inventory, staff, memberships and business performance —
            all in one place.
          </p>
          <PillLink to="/features" className="mt-6">
            Explore Features
          </PillLink>
        </div>
        <div data-reveal className="relative">
          <img
            src={IMG.aboutSalonInterior}
            alt=""
            className="h-[26rem] w-full rounded-3xl object-cover"
          />
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0">
            <AppointmentFormMock avatars={[IMG.avatar2, IMG.avatar1]} />
          </div>
          <div className="float-slower absolute right-3 top-4 hidden items-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold leading-tight text-ink shadow-lg sm:flex">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-petal text-mauve">
              <SiteIcon name="calendar" size={16} />
            </span>
            Manage
            <br />
            Appointments
            <br />
            Easily
          </div>
        </div>
      </div>
    </section>
  );
}

export function MissionVision() {
  const cards = [
    [
      "target",
      "Our Mission",
      "To deliver technology solutions that create real value for businesses, improve efficiency and support long-term growth.",
    ],
    [
      "eye",
      "Our Vision",
      "To be a trusted technology partner known for innovation, quality and long-term collaboration, helping businesses transform through digital solutions.",
    ],
  ];
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <SectionTitle
        title="Our Mission & Vision"
        subtitle={`Our mission and vision guide everything we build at ${COMPANY.name}, including Salora Glam.`}
      />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {cards.map(([icon, t, b]) => (
          <div key={t} data-reveal className="site-card flex gap-5 p-7">
            <IconCircle name={icon} size="lg" />
            <div>
              <h3 className="font-display text-xl text-ink">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{b}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CoreValues() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 pb-16">
      <LeafSprig className="absolute -left-4 top-0 h-36 max-md:hidden" />
      <SectionTitle
        title="Our Core Values"
        subtitle="These values reflect how we work and the solutions we create for our clients."
      />
      <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-blush">
        {VALUES.map(([icon, t, b], i) => (
          <li
            key={t}
            data-reveal
            style={{ transitionDelay: `${i * 80}ms` }}
            className="px-4 text-center"
          >
            <IconCircle name={icon} size="lg" />
            <h3 className="mt-4 font-semibold text-ink">{t}</h3>
            <p className="mx-auto mt-2 max-w-[14rem] text-sm text-stone-600">
              {b}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OurProduct() {
  return (
    <section className="border-t border-blush/70 bg-gradient-to-b from-cream to-petal/50">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <SectionTitle
          title="Our Product – Salora Glam"
          subtitle={`A complete salon and spa management software by ${COMPANY.name}.`}
        />
        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
          <div data-reveal className="relative mx-auto w-full max-w-xl pb-6">
            <LaptopFrame className="mx-auto w-[82%]">
              <OverviewMock />
            </LaptopFrame>
            <TabletFrame className="absolute -left-2 bottom-0 w-[30%] !p-1.5">
              <DashboardMock />
            </TabletFrame>
            <PhoneFrame className="absolute -right-1 bottom-0 w-[18%]">
              <div className="aspect-[9/17] bg-[#fcfafa] p-1.5 text-[5px]">
                <p className="font-semibold text-ink">Salora Glam</p>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="mt-1 h-3 rounded bg-white shadow-sm"
                  />
                ))}
                <div className="mt-1.5 rounded bg-mauve py-0.5 text-center text-white">
                  New Bill
                </div>
              </div>
            </PhoneFrame>
          </div>
          <div data-reveal>
            <CheckList items={ABOUT_PRODUCT_POINTS} />
            <div className="mt-7 flex flex-wrap gap-3">
              <PillLink to="/features" variant="outline">
                View All Features
              </PillLink>
              <PillLink to="/register">Start Free Trial</PillLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEP_COLORS = ["bg-mauve", "bg-rose-400", "bg-emerald-600", "bg-mauve"];
export function OurApproach() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <SectionTitle
        title="Our Approach"
        subtitle="We follow a clear and structured process to understand your needs and deliver the right solution."
      />
      <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {APPROACH.map(([icon, t, b], i) => (
          <li
            key={t}
            data-reveal
            style={{ transitionDelay: `${i * 90}ms` }}
            className="relative flex gap-4"
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white ${STEP_COLORS[i]}`}
            >
              0{i + 1}
            </span>
            <div>
              <SiteIcon name={icon} size={28} className="text-ink" />
              <h3 className="mt-3 font-semibold text-ink">{t}</h3>
              <p className="mt-1 text-sm text-stone-600">{b}</p>
            </div>
            {i < APPROACH.length - 1 && (
              <span
                className="absolute left-[6.5rem] right-[-1.25rem] top-5 hidden border-t-2 border-dashed border-blush lg:block"
                aria-hidden
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
