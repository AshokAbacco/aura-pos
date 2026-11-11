/**
 * Terms, Subscription & Refund policy and Privacy policy.
 * The words live in utils/legalContent.js; this file only lays them out:
 * hero with "at a glance" points → sticky contents (with reading progress) → numbered section cards → contact card.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  LuCalendarDays,
  LuClock,
  LuUsers,
  LuPrinter,
  LuArrowUp,
  LuCheck,
  LuChevronDown,
  LuMail,
  LuMapPin,
  LuBuilding2,
  LuInfo,
} from "react-icons/lu";
import { usePageMeta } from "./hooks/usePageMeta.js";
import { useReveal } from "./hooks/useReveal.js";
import { Eyebrow, LeafSprig, SiteIcon, CtaBanner } from "./components/common";
import { LEGAL_DOCS, LEGAL_CONTACT } from "./utils/legalContent.js";
import { IMG } from "./utils/siteImages.js";
import { printPage } from "../../lib/native.js";
import { cx } from "../../utils/cx.js";

const TABS = [
  ["/terms", "terms"],
  ["/refunds", "refunds"],
  ["/privacy", "privacy"],
];

/** Rough reading time from the number of words in the document. */
function readMinutes(d) {
  const words = JSON.stringify([d.intro, d.sections]).split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

/** Which section is on screen, and how far through the page the reader is (0–1). */
function useReading(ids) {
  const [active, setActive] = useState(ids[0]);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 140) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids]);
  return { active, progress };
}

function Blocks({ body }) {
  return body.map((b, i) => {
    if (typeof b === "string")
      return (
        <p
          key={i}
          className="mt-4 first:mt-0 text-[15.5px] leading-[1.8] text-stone-700"
        >
          {b}
        </p>
      );
    if (b.list)
      return (
        <ul key={i} className="mt-4 space-y-2.5">
          {b.list.map((x) => (
            <li
              key={x}
              className="flex gap-3 text-[15.5px] leading-[1.7] text-stone-700"
            >
              <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-petal text-mauve ring-1 ring-blush">
                <LuCheck size={12} strokeWidth={3} aria-hidden />
              </span>
              <span>{x}</span>
            </li>
          ))}
        </ul>
      );
    if (b.h)
      return (
        <h3 key={i} className="mt-6 text-base font-semibold text-ink">
          {b.h}
        </h3>
      );
    if (b.note)
      return (
        <p
          key={i}
          className="mt-5 flex gap-3 rounded-2xl border border-blush bg-petal/70 px-4 py-3.5 text-sm leading-relaxed text-ink"
        >
          <LuInfo className="mt-0.5 shrink-0 text-mauve" aria-hidden />
          {b.note}
        </p>
      );
    return null;
  });
}

function ContactCard() {
  const rows = [
    [
      LuBuilding2,
      "Company",
      `${LEGAL_CONTACT.company} · ${LEGAL_CONTACT.platform}`,
    ],
    [LuMapPin, "Address", LEGAL_CONTACT.address],
    [
      LuMail,
      "Email",
      <a
        key="m"
        href={`mailto:${LEGAL_CONTACT.email}`}
        className="font-semibold text-mauve underline-offset-2 hover:underline"
      >
        {LEGAL_CONTACT.email}
      </a>,
    ],
  ];
  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
      {rows.map(([Icon, label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-blush bg-cream/70 p-4"
        >
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <Icon className="text-mauve" aria-hidden />
            {label}
          </dt>
          <dd className="mt-1.5 text-sm leading-relaxed text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Hero({ d, doc }) {
  const h = d.hero;
  return (
    <section className="relative -mt-[72px] overflow-hidden pt-[72px]">
      <img
        src={IMG.legalHero}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="hero-fade-left absolute inset-0 max-lg:bg-cream/90" />
      <LeafSprig className="absolute -left-6 bottom-2 h-44 max-md:hidden" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-10 lg:grid-cols-[1.15fr_1fr] lg:pb-20">
        <div className="fade-up">
          <Eyebrow>Legal · Policies</Eyebrow>
          <h1 className="mt-5 font-display text-5xl leading-[1.05] text-ink md:text-[3.6rem]">
            {h.titleLines[0]}
            <br />
            <span className="text-mauve">{h.titleLines[1]}</span>
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-stone-700">
            {h.summary}
          </p>
          <ul className="mt-6 flex flex-wrap gap-2 text-xs text-ink">
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-blush">
              <LuCalendarDays className="text-mauve" aria-hidden />
              Updated {d.updated}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-blush">
              <LuClock className="text-mauve" aria-hidden />
              {readMinutes(d)} min read
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 ring-1 ring-blush">
              <LuUsers className="text-mauve" aria-hidden />
              For {h.audience}
            </li>
          </ul>
          <nav
            aria-label="Policies"
            className="mt-8 grid grid-cols-3 gap-1 rounded-2xl bg-white/80 p-1 ring-1 ring-blush backdrop-blur sm:inline-flex sm:rounded-full"
          >
            {TABS.map(([to, key]) => (
              <NavLink
                key={to}
                to={to}
                className={cx(
                  "rounded-xl px-2 py-2 text-center text-[12px] font-semibold leading-tight transition sm:rounded-full sm:px-4 sm:text-[13px]",
                  key === doc
                    ? "bg-mauve text-white shadow"
                    : "text-ink/80 hover:text-mauve",
                )}
              >
                {LEGAL_DOCS[key].short}
              </NavLink>
            ))}
          </nav>
        </div>
        {/* <div
          className="fade-up rounded-[1.75rem] bg-white/90 p-6 shadow-[0_24px_60px_-30px_rgb(90_26_48/.45)] ring-1 ring-blush backdrop-blur"
          style={{ animationDelay: ".15s" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mauve">
            At a glance
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {h.highlights.map(([icon, title, text]) => (
              <li key={title} className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-petal text-mauve ring-1 ring-blush">
                  <SiteIcon name={icon} size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {title}
                  </span>
                  <span className="block text-[13px] leading-snug text-stone-600">
                    {text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div> */}
      </div>
    </section>
  );
}

export default function LegalPage({ doc }) {
  const d = LEGAL_DOCS[doc];
  usePageMeta(
    d.title,
    `${d.title} for Salora Glam, the salon and spa billing software by Abacco Technology.`,
  );
  const ids = useMemo(() => d.sections.map((s) => s.id), [d]);
  const { active, progress } = useReading(ids);
  const [tocOpen, setTocOpen] = useState(false);
  const revealRef = useReveal();

  const contents = (
    <ol className="space-y-0.5 text-sm">
      {d.sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            onClick={() => setTocOpen(false)}
            className={cx(
              "flex gap-2.5 rounded-lg px-2.5 py-1.5 transition",
              active === s.id
                ? "bg-petal font-semibold text-mauve"
                : "text-stone-600 hover:bg-cream hover:text-ink",
            )}
          >
            <span className="num w-5 shrink-0 text-right text-xs leading-5 opacity-70">
              {i + 1}
            </span>
            <span>{s.heading}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div ref={revealRef}>
      {/* reading progress */}
      <div
        className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
        aria-hidden
      >
        <div
          className="h-full origin-left bg-mauve"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <Hero d={d} doc={doc} />

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-4">
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          {/* Contents: sticky card on desktop, collapsible on phones */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl bg-white p-4 ring-1 ring-blush">
              <button
                type="button"
                onClick={() => setTocOpen((v) => !v)}
                aria-expanded={tocOpen}
                className="flex w-full items-center justify-between px-2.5 py-1 text-left lg:pointer-events-none"
              >
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                  Contents
                </span>
                <LuChevronDown
                  className={cx(
                    "text-stone-500 transition lg:hidden",
                    tocOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              <div className={cx("mt-2", !tocOpen && "max-lg:hidden")}>
                {contents}
              </div>
            </div>
            <div className="mt-4 flex gap-2 max-lg:hidden">
              <button
                type="button"
                onClick={() => printPage(d.title)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-ink ring-1 ring-blush hover:text-mauve"
              >
                <LuPrinter aria-hidden /> Print
              </button>
              <a
                href="#top"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-ink ring-1 ring-blush hover:text-mauve"
              >
                <LuArrowUp aria-hidden /> Top
              </a>
            </div>
          </aside>

          <article className="print-area min-w-0 space-y-5">
            <div className="rounded-3xl bg-gradient-to-br from-petal to-white p-6 ring-1 ring-blush md:p-8">
              <Blocks body={d.intro} />
            </div>
            {d.sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-24 rounded-3xl bg-white p-6 ring-1 ring-blush md:p-8"
              >
                <h2 className="flex items-center gap-3 font-display text-2xl text-ink md:text-[1.65rem]">
                  <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mauve font-sans text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  {s.heading}
                </h2>
                <div className="mt-4">
                  {s.id === "contact" ? (
                    <>
                      <Blocks
                        body={s.body.filter((b) => typeof b === "string")}
                      />
                      <ContactCard />
                    </>
                  ) : (
                    <Blocks body={s.body} />
                  )}
                </div>
              </section>
            ))}
            <p className="px-2 text-sm text-stone-500">
              Also read:{" "}
              {TABS.filter(([, k]) => k !== doc).map(([to, k], i) => (
                <span key={to}>
                  {i > 0 && " · "}
                  <Link
                    to={to}
                    className="font-semibold text-mauve underline-offset-2 hover:underline"
                  >
                    {LEGAL_DOCS[k].short}
                  </Link>
                </span>
              ))}
            </p>
          </article>
        </div>
      </section>

      <CtaBanner
        eyebrow="Questions about our policies?"
        title="We’re happy to help"
        body="Write to our team about your subscription, a refund, or how your data is handled."
        cta="Contact us"
        to="/contact"
        image={IMG.ctaSpaCandles}
      />
    </div>
  );
}
