import SiteLayout from "../../../layouts/site/SiteLayout.jsx";
import { IMG, IconCircle, LeafSprig } from "../../website";

const DEFAULT_HERO = {
  eyebrow: "Salora Glam",
  title: ["Run your salon", "the simple way"],
  accentLine: 1,
  body: "Billing, appointments, clients, staff and reports for your salon or spa — all in one place.",
  points: [
    [
      "calendar",
      "Manage Appointments",
      "Keep your schedule organized and your clients happy.",
    ],
    [
      "card",
      "Easy Billing",
      "Accept cash, card, UPI and more with GST-ready invoicing.",
    ],
    [
      "users",
      "Grow Your Business",
      "Manage clients, staff and reports to take your salon further.",
    ],
  ],
  image: "authLoginSalon",
};

/**
 * Sign-in / sign-up / recovery screens: website navbar + footer, a salon photo on the left with a
 * curved edge, a short pitch with three points, and the form card on the right.
 * hero: { eyebrow?, title: [lines], accentLine (index of the wine line), body, points: [[icon, title, text]], image }
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  hero = DEFAULT_HERO,
  cardTop,
  centered = false,
}) {
  const h = { ...DEFAULT_HERO, ...hero };
  return (
    <SiteLayout>
      <div className="relative -mt-[72px] flex flex-1 items-center overflow-hidden pt-[72px]">
        {/* photo with a curved right edge (large screens) */}
        <div
          className="absolute inset-y-0 left-0 hidden w-[27%] xl:block"
          aria-hidden
        >
          <div className="absolute inset-0 bg-blush/60 [clip-path:ellipse(100%_78%_at_0%_50%)] translate-x-4" />
          <img
            src={IMG[h.image]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover [clip-path:ellipse(100%_78%_at_0%_50%)]"
          />
        </div>
        <LeafSprig
          flip
          className="absolute -right-6 top-20 h-56 max-md:hidden"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blush/50"
          aria-hidden
        />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-12 md:py-16 lg:grid-cols-[1fr_1.05fr] xl:max-w-none xl:grid-cols-[27%_1fr_1fr] xl:pr-[6%]">
          <span className="hidden xl:block" />
          <section className="order-2 lg:order-1 xl:pl-10">
            {h.eyebrow && (
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-mauve">
                {h.eyebrow}
                <span className="h-px w-10 bg-mauve/40" />
              </p>
            )}
            <h2 className="mt-4 font-display text-[2.6rem] leading-[1.05] text-ink md:text-[3.4rem]">
              {h.title.map((line, i) => (
                <span
                  key={i}
                  className={`block ${i === h.accentLine ? "text-mauve" : ""}`}
                >
                  {line}
                </span>
              ))}
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-stone-700">
              {h.body}
            </p>
            <ul className="mt-8 space-y-5">
              {h.points.map(([icon, t, b]) => (
                <li key={t} className="flex items-center gap-5">
                  <IconCircle
                    name={icon}
                    size="lg"
                    className="h-16 w-16 shrink-0"
                  />
                  <span>
                    <b className="block font-display text-lg font-medium text-ink">
                      {t}
                    </b>
                    <span className="block max-w-[16rem] text-sm text-stone-600">
                      {b}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="order-1 lg:order-2">
            <div className="site-card mx-auto w-full max-w-lg p-7 md:p-9">
              {cardTop}
              <h1
                className={`font-display text-[2.1rem] leading-tight text-ink ${
                  centered ? "text-center" : ""
                }`}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className={`mt-1.5 text-[15px] text-stone-600 ${
                    centered ? "text-center" : ""
                  }`}
                >
                  {subtitle}
                </p>
              )}
              <div className="mt-6">{children}</div>
              {footer && (
                <div className="mt-6 flex items-center gap-3 text-sm text-stone-600">
                  <span className="h-px flex-1 bg-blush" />
                  <span className="text-center">{footer}</span>
                  <span className="h-px flex-1 bg-blush" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

export const FormError = ({ msg }) =>
  msg ? (
    <p
      role="alert"
      className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800"
    >
      {msg}
    </p>
  ) : null;
