import { useEffect, useState } from "react";
import { usePageMeta } from "./hooks/usePageMeta.js";

/* Icons – inline SVG (24x24, stroke) */
const ICONS = {
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  fileText: (
    <>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 4a4 4 0 010 8M22 21c0-3-2-5-4-5.6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  store: (
    <>
      <path d="M3 9l1-5h16l1 5M3 9v11h18V9" />
      <path d="M3 9c0 2 4 2 4 0 0 2 5 2 5 0 0 2 5 2 5 0 0 2 4 2 4 0M9 20v-6h6v6" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M8.6 10.6l6.8-3.2M8.6 13.4l6.8 3.2" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  alert: <path d="M12 3l10 18H2L12 3zM12 10v5M12 18h0" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-6" />
    </>
  ),
  message: (
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2c3 3 4 6 4 10s-1 7-4 10c-3-3-4-6-4-10s1-7 4-10z" />
    </>
  ),
  refresh: <path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5" />,
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 11v6M12 7h0" />
    </>
  ),
  check: <path d="M5 12l5 5 9-10" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  external: <path d="M14 4h6v6M20 4L10 14M18 14v6H4V6h6" />,
  headset: (
    <>
      <path d="M4 14v-2a8 8 0 0116 0v2" />
      <rect x="2" y="14" width="4" height="6" rx="1" />
      <rect x="18" y="14" width="4" height="6" rx="1" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M16 7l3 3" />
    </>
  ),
  pen: <path d="M4 20h4L20 8l-4-4L4 16v4zM14 6l4 4" />,
  scale: (
    <path d="M12 3v18M5 21h14M5 7h14M5 7l-3 7a3 3 0 006 0L5 7zM19 7l-3 7a3 3 0 006 0l-3-7z" />
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M5 5l14 14" />
    </>
  ),
  power: <path d="M12 3v9M6.3 6.3a8 8 0 1011.4 0" />,
  gavel: <path d="M14 4l6 6M10 8l6 6M4 20l8-8M8 4l6 6-3 3-6-6 3-3zM12 20h8" />,
  box: <path d="M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8" />,
};

function Icon({ name, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

function IconBadge({ name, tone = "light", size = "h-11 w-11" }) {
  const tones = {
    light: "bg-petal text-mauve",
    dark: "bg-gradient-to-br from-mauve to-mauve-deep text-cream shadow-lg shadow-mauve/25",
    ghost: "bg-cream/10 text-cream",
  };
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
    >
      <Icon name={name} />
    </span>
  );
}

/* Content */
const groups = [
  {
    label: "Getting started",
    items: [
      { id: "acceptance", title: "Accepting these terms", icon: "fileText" },
      { id: "service", title: "About SALORA GLAM", icon: "box" },
      { id: "accounts", title: "Accounts & eligibility", icon: "key" },
    ],
  },
  {
    label: "Using the Platform",
    items: [
      { id: "acceptable-use", title: "Acceptable use", icon: "checkCircle" },
      { id: "salon-duties", title: "Salon responsibilities", icon: "store" },
      { id: "apps", title: "Android & iOS apps", icon: "phone" },
      { id: "third-party", title: "Third-party services", icon: "share" },
    ],
  },
  {
    label: "Payments",
    items: [
      { id: "billing", title: "Subscriptions & billing", icon: "card" },
      { id: "refunds", title: "Cancellation & refunds", icon: "refresh" },
    ],
  },
  {
    label: "Rights & data",
    items: [
      { id: "ip", title: "Intellectual property", icon: "pen" },
      { id: "your-data", title: "Your data & privacy", icon: "database" },
    ],
  },
  {
    label: "Risk & liability",
    items: [
      { id: "availability", title: "Availability & changes", icon: "clock" },
      { id: "termination", title: "Suspension & termination", icon: "power" },
      { id: "disclaimer", title: "Disclaimers", icon: "alert" },
      { id: "liability", title: "Limitation of liability", icon: "scale" },
      { id: "indemnity", title: "Indemnity", icon: "shield" },
    ],
  },
  {
    label: "Legal",
    items: [
      { id: "law", title: "Governing law & disputes", icon: "gavel" },
      { id: "changes", title: "Changes to these terms", icon: "message" },
      { id: "general", title: "General provisions", icon: "globe" },
      { id: "contact", title: "Contact & grievances", icon: "mail" },
    ],
  },
];
const sections = groups.flatMap((g) => g.items);
const groupOf = (id) =>
  groups.find((g) => g.items.some((i) => i.id === id))?.label;

const glance = [
  { icon: "key", text: "Keep your login private and your details accurate." },
  {
    icon: "store",
    text: "Salons own and are responsible for their customer data.",
  },
  { icon: "card", text: "Subscriptions renew until you cancel." },
  { icon: "ban", text: "No misuse, scraping or access to other salons’ data." },
];

const orbitInner = [
  { icon: "store", label: "Salons", angle: 0 },
  { icon: "card", label: "Billing", angle: 120 },
  { icon: "key", label: "Accounts", angle: 240 },
];
const orbitOuter = [
  { icon: "users", label: "Staff", angle: 60 },
  { icon: "phone", label: "Apps", angle: 180 },
  { icon: "headset", label: "Support", angle: 300 },
];

const doList = [
  "Use the Platform for your own lawful salon or spa business",
  "Give staff only the access they need",
  "Keep records accurate and up to date",
  "Report suspected misuse or security issues promptly",
];
const dontList = [
  "Try to access another salon’s data or our systems without permission",
  "Reverse engineer, copy, resell or sub-license the software",
  "Upload malware, or interfere with the Platform’s performance",
  "Scrape, bulk-extract or use bots without our written consent",
  "Use the Platform for unlawful, fraudulent or harassing activity",
  "Send spam or marketing messages without customer consent",
];

const billingSteps = [
  {
    icon: "pen",
    title: "Choose a plan",
    text: "Pick a subscription plan and billing period when you sign up. Fees, features and limits are shown at checkout or in your order.",
  },
  {
    icon: "card",
    title: "Pay securely",
    text: "Payments are processed by Razorpay. We do not store your full card number, CVV or banking password.",
  },
  {
    icon: "refresh",
    title: "Renewal",
    text: "Your plan renews for the same period until you cancel, using the payment method you authorised, where permitted by law and your bank.",
  },
  {
    icon: "alert",
    title: "If a payment fails",
    text: "We may retry, send reminders, limit features or suspend the account until the amount due is paid.",
  },
];

const heroCss = `
@keyframes pp-spin{to{transform:rotate(360deg)}}
@keyframes pp-spin-rev{to{transform:rotate(-360deg)}}
@keyframes pp-aurora{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(40px,30px,0) scale(1.15)}}
@keyframes pp-pulse{0%{transform:scale(.7);opacity:.55}100%{transform:scale(1.6);opacity:0}}
@keyframes pp-sheen{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes pp-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes pp-draw{from{stroke-dashoffset:140}to{stroke-dashoffset:0}}
@keyframes pp-slide{from{transform:translateX(-100%)}to{transform:none}}
.pp-aurora{animation:pp-aurora 14s ease-in-out infinite}
.pp-aurora-b{animation:pp-aurora 18s ease-in-out infinite reverse}
.pp-ring-a{animation:pp-spin 38s linear infinite}
.pp-ring-b{animation:pp-spin-rev 56s linear infinite}
.pp-keep-a{animation:pp-spin-rev 38s linear infinite}
.pp-keep-b{animation:pp-spin 56s linear infinite}
.pp-pulse{animation:pp-pulse 3.2s ease-out infinite}
.pp-pulse-2{animation:pp-pulse 3.2s ease-out 1.6s infinite}
.pp-sheen{background-size:200% 100%;animation:pp-sheen 7s linear infinite}
.pp-rise{opacity:0;animation:pp-rise .8s cubic-bezier(.2,.7,.2,1) forwards}
.pp-draw{stroke-dasharray:140;stroke-dashoffset:140;animation:pp-draw 1.6s .5s ease forwards}
.pp-drawer{animation:pp-slide .28s cubic-bezier(.2,.7,.2,1)}
.pp-scroll{scrollbar-width:thin;scrollbar-color:#e8c9d4 transparent}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .pp-aurora,.pp-aurora-b,.pp-ring-a,.pp-ring-b,.pp-keep-a,.pp-keep-b,.pp-pulse,.pp-pulse-2,.pp-sheen,.pp-drawer{animation:none}
  .pp-rise{animation:none;opacity:1}
  .pp-draw{animation:none;stroke-dashoffset:0}
}`;

/* Building blocks */
function Section({ id, title, icon, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-8 border-t border-blush pt-12 first:border-t-0 first:pt-0"
    >
      <div className="flex items-center gap-4">
        <IconBadge name={icon} tone="dark" size="h-12 w-12" />
        <div>
          <p className="text-xs font-medium text-mauve">{groupOf(id)}</p>
          <h2 className="font-display text-3xl tracking-tight text-ink md:text-4xl">
            {title}
          </h2>
        </div>
      </div>
      <div className="mt-6 max-w-3xl space-y-5 text-[15.5px] leading-8 text-ink/70">
        {children}
      </div>
    </section>
  );
}

function CheckList({ items, icon = "check", tone = "text-mauve" }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-[7px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-petal">
            <Icon name={icon} className={`h-3 w-3 ${tone}`} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Note({ icon = "shield", title, children }) {
  return (
    <div className="flex gap-4 rounded-2xl bg-petal/70 p-5 ring-1 ring-blush/70">
      <Icon name={icon} className="mt-0.5 h-5 w-5 shrink-0 text-mauve" />
      <div className="text-sm leading-7 text-ink/75">
        {title && <p className="font-semibold text-mauve-deep">{title}</p>}
        {children}
      </div>
    </div>
  );
}

function SubHeading({ children }) {
  return <h3 className="pt-3 font-display text-xl text-mauve">{children}</h3>;
}

function Panel({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-blush/80 bg-white p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function OrbitChip({ item, radius, keep }) {
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        transform: `rotate(${
          item.angle
        }deg) translateY(-${radius}px) rotate(${-item.angle}deg)`,
      }}
    >
      <div className={`${keep} -ml-[26px] -mt-[26px]`}>
        <div className="flex h-[52px] items-center gap-2 whitespace-nowrap rounded-full border border-white/40 bg-white/90 pl-3 pr-4 text-xs font-medium text-ink shadow-lg shadow-black/20 backdrop-blur">
          <Icon name={item.icon} className="h-4 w-4 text-mauve" />
          {item.label}
        </div>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[460px]"
      aria-hidden="true"
    >
      <div className="absolute inset-[14%] rounded-full border border-dashed border-cream/25" />
      <div className="absolute inset-[2%] rounded-full border border-dashed border-cream/15" />
      <div className="pp-ring-b absolute inset-0">
        {orbitOuter.map((i) => (
          <OrbitChip key={i.label} item={i} radius={211} keep="pp-keep-b" />
        ))}
      </div>
      <div className="pp-ring-a absolute inset-0">
        {orbitInner.map((i) => (
          <OrbitChip key={i.label} item={i} radius={133} keep="pp-keep-a" />
        ))}
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="pp-pulse absolute inset-0 rounded-full bg-blush/40" />
        <span className="pp-pulse-2 absolute inset-0 rounded-full bg-blush/25" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-[32px] bg-cream text-mauve-deep shadow-2xl shadow-black/40 ring-8 ring-white/20">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-14 w-14"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6" />
            <path className="pp-draw" d="M8.5 14.2l2.5 2.6 4.6-5.2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* Sidebar: desktop rail and mobile drawer */
function Contents({ active, progress, onPick }) {
  const index = sections.findIndex((s) => s.id === active) + 1;
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-5 pt-7">
        <div className="flex items-center gap-3">
          <IconBadge name="fileText" tone="dark" />
          <div>
            <p className="font-display text-lg leading-tight text-ink">
              SALORA GLAM
            </p>
            <p className="text-xs text-ink/55">Terms & Conditions</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-ink/60">
            <span>
              Section {index} of {sections.length}
            </span>
            <span>{Math.round(progress)}% read</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-petal">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blush via-mauve to-mauve-deep transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <nav
        aria-label="Terms and conditions sections"
        className="pp-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-4"
      >
        {groups.map((g) => (
          <div key={g.label} className="mb-4">
            <p className="px-3 pb-1.5 text-xs font-semibold text-ink/45">
              {g.label}
            </p>
            <ul className="ml-3 border-l border-blush">
              {g.items.map((s) => {
                const on = active === s.id;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={onPick}
                      aria-current={on ? "true" : undefined}
                      className={`-ml-px flex items-center gap-2.5 border-l-2 py-2 pl-4 pr-3 text-[13.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-mauve ${
                        on
                          ? "border-mauve bg-petal font-semibold text-mauve-deep"
                          : "border-transparent text-ink/65 hover:border-blush hover:bg-petal/50 hover:text-ink"
                      }`}
                    >
                      <Icon
                        name={s.icon}
                        className={`h-4 w-4 shrink-0 ${
                          on ? "text-mauve" : "text-ink/40"
                        }`}
                      />
                      {s.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-blush p-4">
        <a
          href="mailto:support.tech@abaccotech.com"
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-mauve to-mauve-deep p-3.5 text-cream transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mauve"
        >
          <Icon name="headset" className="h-5 w-5 shrink-0" />
          <span className="min-w-0 text-xs leading-5">
            <span className="block font-semibold">
              Question about these terms?
            </span>
            <span className="block truncate text-blush">
              support.tech@abaccotech.com
            </span>
          </span>
        </a>
      </div>
    </div>
  );
}

/* Page */
export default function Terms() {
  usePageMeta(
    "Terms & Conditions",
    "The terms that apply when you use SALORA GLAM, the salon and spa management and POS platform from Abacco Technology, on web, Android and iOS.",
  );

  const [active, setActive] = useState(sections[0].id);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    const onScroll = () => {
      const h = document.documentElement;
      const body = document.getElementById("terms-body");
      const start = body ? body.offsetTop : 0;
      const max = h.scrollHeight - h.clientHeight - start;
      setProgress(
        max > 0
          ? Math.min(100, Math.max(0, ((h.scrollTop - start) / max) * 100))
          : 0,
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <style>{heroCss}</style>

      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-mauve-deep via-mauve-deep to-mauve text-cream">
        <div
          aria-hidden="true"
          className="pp-aurora pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-blush/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pp-aurora-b pointer-events-none absolute -right-20 top-20 h-[380px] w-[380px] rounded-full bg-mauve/60 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:26px_26px] text-blush/40 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-24 pt-14 md:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
          <div>
            <span className="pp-rise inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/10 px-4 py-2 text-sm font-medium backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="pp-pulse absolute inline-flex h-full w-full rounded-full bg-blush" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blush" />
              </span>
              Terms & Conditions for SALORA GLAM
            </span>

            <h1
              className="pp-rise pp-sheen mt-6 bg-gradient-to-r from-cream via-blush to-cream bg-clip-text font-display text-5xl leading-[1.04] tracking-tight text-transparent md:text-7xl"
              style={{ animationDelay: "0.1s, 0s" }}
            >
              Clear terms for running your salon.
            </h1>

            <p
              className="pp-rise mt-6 max-w-xl text-base leading-8 text-cream/80 md:text-lg"
              style={{ animationDelay: "0.25s" }}
            >
              These terms set out the rules for using SALORA GLAM, the salon and
              spa management and POS platform from Abacco Technology, on the
              web, Android and iOS.
            </p>

            <div
              className="pp-rise mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "0.4s" }}
            >
              <a
                href="#acceptance"
                className="group inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-semibold text-mauve-deep shadow-lg shadow-black/20 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
              >
                Read the terms
                <Icon
                  name="arrowDown"
                  className="h-4 w-4 transition-transform group-hover:translate-y-0.5"
                />
              </a>
              <a
                href="#billing"
                className="inline-flex items-center gap-2 rounded-full border border-cream/30 bg-cream/10 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-cream/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
              >
                Billing & refunds
              </a>
            </div>

            <div
              className="pp-rise mt-8 flex flex-wrap gap-2.5 text-xs font-medium"
              style={{ animationDelay: "0.55s" }}
            >
              {[
                ["clock", "Updated 10 November 2026"],
                ["phone", "Web, Android and iOS"],
                ["globe", "India"],
              ].map(([ic, t]) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/10 px-4 py-2"
                >
                  <Icon name={ic} className="h-4 w-4 text-blush" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <HeroVisual />
        </div>
      </header>

      {/* At a glance */}
      <div className="relative z-10 mx-auto -mt-12 max-w-7xl px-5 lg:px-10">
        <ul className="grid gap-px overflow-hidden rounded-3xl border border-blush bg-blush shadow-[0_30px_60px_-30px] shadow-mauve/40 sm:grid-cols-2 lg:grid-cols-4">
          {glance.map((g) => (
            <li key={g.text} className="flex items-center gap-4 bg-white p-5">
              <IconBadge name={g.icon} />
              <span className="text-sm leading-6 text-ink/75">{g.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sidebar + content */}
      <div
        id="terms-body"
        className="mx-auto mt-12 max-w-7xl lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10 lg:px-10"
      >
        <aside className="hidden lg:block">
          <div className="sticky top-4 h-[calc(100vh-2rem)] overflow-hidden rounded-3xl border border-blush bg-white shadow-[0_24px_50px_-32px] shadow-mauve/40">
            <Contents active={active} progress={progress} />
          </div>
        </aside>

        <article className="min-w-0 space-y-12 px-5 pb-28 pt-2 lg:px-0 lg:pb-20">
          <Note icon="info" title="In short">
            SALORA GLAM is a multi-tenant cloud platform operated by Abacco
            Technology. Independent salon and spa businesses use it to manage
            customers, staff, appointments, services, billing and point of sale.
            Please read these terms before you create an account or use the
            Platform. The summary above is a guide only; the full terms below
            apply.
          </Note>

          <Section
            id="acceptance"
            title="Accepting these terms"
            icon="fileText"
          >
            <p>
              These Terms & Conditions (“Terms”) are an agreement between you
              and Abacco Technology (“Company”, “we”, “our” or “us”). They cover
              your use of SALORA GLAM, including our website, web app, Android
              app and iOS app (together, the “Platform”).
            </p>
            <p>
              By creating an account, signing in, subscribing or otherwise using
              the Platform, you confirm that you have read and agree to these
              Terms and our Privacy Policy. If you use the Platform for a
              business, you confirm that you are authorised to bind that
              business. If you do not agree, please do not use the Platform.
            </p>
            <Note icon="alert" title="Order forms and plans">
              If you sign a separate order form or agreement with us, it applies
              alongside these Terms. If the two conflict, the order form or
              agreement prevails for that subject.
            </Note>
          </Section>

          <Section id="service" title="About SALORA GLAM" icon="box">
            <p>
              SALORA GLAM is a software service that helps salons and spas run
              day-to-day operations. Features depend on your subscription plan
              and may include:
            </p>
            <div className="grid gap-x-8 gap-y-2.5 md:grid-cols-2">
              <CheckList
                items={[
                  "Customer records and visit history",
                  "Appointments and bookings",
                  "Services, staff and roles",
                  "Billing, invoices and POS",
                ]}
              />
              <CheckList
                items={[
                  "Payments and subscription management",
                  "Reminders and notifications",
                  "Reports and exports",
                  "Web, Android and iOS access",
                ]}
              />
            </div>
            <p>
              We provide software and infrastructure only. We are not a party to
              the services a salon provides to its customers, and we do not
              provide beauty, medical, legal, tax or accounting advice.
            </p>
          </Section>

          <Section id="accounts" title="Accounts & eligibility" icon="key">
            <SubHeading>Who can register</SubHeading>
            <CheckList
              items={[
                "You must be at least 18 years old and able to enter a binding contract under Indian law",
                "You must register on behalf of a genuine salon, spa or related business",
                "The details you give us, such as business name, contact and tax details, must be accurate and kept current",
              ]}
            />
            <SubHeading>Keeping your account secure</SubHeading>
            <p>
              You are responsible for activity under your account, including
              actions by staff you authorise. Keep passwords and OTPs private,
              use a screen lock on devices that run the app, and sign out on
              shared devices. Tell us at once if you suspect unauthorised
              access.
            </p>
            <SubHeading>Staff and roles</SubHeading>
            <p>
              The salon owner or admin decides who joins the account and what
              each person can see or do. The salon is responsible for removing
              access when someone leaves and for what its users do on the
              Platform.
            </p>
          </Section>

          <Section
            id="acceptable-use"
            title="Acceptable use"
            icon="checkCircle"
          >
            <p>
              Use the Platform responsibly and lawfully. In practice, that
              means:
            </p>
            <div className="grid max-w-none gap-4 md:grid-cols-2">
              <Panel className="bg-gradient-to-b from-white to-petal/30">
                <p className="mb-3 font-display text-lg text-ink">You can</p>
                <div className="text-sm leading-7">
                  <CheckList items={doList} />
                </div>
              </Panel>
              <Panel className="bg-petal/60">
                <p className="mb-3 font-display text-lg text-ink">
                  You must not
                </p>
                <div className="text-sm leading-7">
                  <CheckList icon="x" tone="text-mauve-deep" items={dontList} />
                </div>
              </Panel>
            </div>
            <p>
              Each salon’s data is kept apart from other salons’. Attempting to
              bypass those controls is a serious breach of these Terms.
            </p>
          </Section>

          <Section
            id="salon-duties"
            title="Salon responsibilities"
            icon="store"
          >
            <p>
              The salon decides what customer and employee information it enters
              and why. As between you and us, the salon is responsible for:
            </p>
            <CheckList
              items={[
                "Giving its customers and employees any privacy notices required by law",
                "Getting consent, or having another lawful basis, before entering or using personal data",
                "Not entering a child’s personal data without verifiable parental or guardian consent",
                "Getting customer consent before sending promotional SMS, WhatsApp, email or push messages",
                "The accuracy of invoices, prices, taxes (including GST) and other records created on the Platform",
                "Holding the licences and registrations its business needs",
              ]}
            />
            <Note icon="shield" title="We do not claim your customer database">
              You keep ownership of the customer and business data you enter. We
              process it to provide, maintain and secure the Platform, as
              described in the Privacy Policy.
            </Note>
          </Section>

          <Section id="apps" title="Android & iOS apps" icon="phone">
            <p>
              We give you a personal, limited, non-exclusive, non-transferable
              and revocable licence to install and use the SALORA GLAM apps on
              devices you own or control, only for your salon’s business and
              only while you have a valid account.
            </p>
            <CheckList
              items={[
                "Download the apps only from Google Play or the Apple App Store",
                "Keep the apps updated; older versions may stop working or lose security fixes",
                "Optional permissions such as camera, notifications, Bluetooth printers or biometrics can be turned off in device settings, which only disables the related feature",
                "Your app store’s own terms also apply to your download and use",
              ]}
            />
            <p>
              Google and Apple are not responsible for the apps or for support
              of them. We are.
            </p>
          </Section>

          <Section id="third-party" title="Third-party services" icon="share">
            <p>
              The Platform relies on services from others, such as Razorpay for
              payments, Render for cloud hosting, and providers of email, SMS,
              WhatsApp and push notifications. Their own terms and policies
              apply to their services.
            </p>
            <p>
              We choose providers with care but do not control them. We are not
              liable for outages, delays or failures that originate with a third
              party, except as the law requires. Links to other websites are
              provided for convenience only.
            </p>
          </Section>

          <Section id="billing" title="Subscriptions & billing" icon="card">
            <p>
              Some features need a paid subscription. This is how billing works:
            </p>
            <div className="grid max-w-none gap-4 md:grid-cols-2">
              {billingSteps.map((s, i) => (
                <Panel
                  key={s.title}
                  className="bg-gradient-to-b from-white to-petal/30"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <IconBadge name={s.icon} />
                    <p className="font-display text-lg leading-tight text-ink">
                      <span className="mr-2 text-mauve">{i + 1}.</span>
                      {s.title}
                    </p>
                  </div>
                  <p className="text-sm leading-7">{s.text}</p>
                </Panel>
              ))}
            </div>
            <CheckList
              items={[
                "Fees are stated in Indian rupees unless shown otherwise, and are exclusive of applicable taxes such as GST unless stated",
                "You authorise us and Razorpay to charge the amounts due for your plan",
                "We may change prices or plans with advance notice; changes apply from your next renewal",
                "Add-ons, SMS or message credits and other usage-based items may be charged separately where your plan says so",
              ]}
            />
          </Section>

          <Section id="refunds" title="Cancellation & refunds" icon="refresh">
            <p>
              You can cancel your subscription at any time from your account or
              by contacting us. Cancellation stops future renewals; you keep
              access until the end of the period you have already paid for.
            </p>
            <p>
              Unless the law or your plan says otherwise, fees already paid are
              non-refundable and we do not give partial refunds for unused time.
              If you were charged in error or twice, tell us promptly and we
              will review and correct it. Approved refunds go back to the
              original payment method, and timing depends on Razorpay and your
              bank.
            </p>
            <Note icon="database" title="Before you leave">
              Export the reports and records you need before closing your
              account. How we handle data afterwards is explained in the Privacy
              Policy under “Retention & deletion”.
            </Note>
          </Section>

          <Section id="ip" title="Intellectual property" icon="pen">
            <p>
              The Platform, including its software, design, logos, text,
              graphics and documentation, belongs to Abacco Technology or its
              licensors and is protected by law. These Terms give you a right to
              use the Platform, not ownership of any part of it.
            </p>
            <p>
              The names SALORA GLAM and Abacco Technology may not be used
              without our written permission. If you send us feedback or
              suggestions, we may use them to improve the Platform without owing
              you anything.
            </p>
            <p>
              You keep all rights in the content and data you put into the
              Platform, and you give us a limited licence to host, process and
              display it only as needed to run the service for you.
            </p>
          </Section>

          <Section id="your-data" title="Your data & privacy" icon="database">
            <p>
              Our Privacy Policy explains what we collect, how we use and
              protect it, and the rights you have under laws such as India’s
              Digital Personal Data Protection Act, 2023. It forms part of these
              Terms.
            </p>
            <CheckList
              items={[
                "We do not sell salon customer databases or personal information for third parties’ independent marketing",
                "We use access controls, encrypted connections and backups to protect the Platform, but no system is completely secure",
                "We keep or delete data as set out in the Privacy Policy and as the law requires",
              ]}
            />
          </Section>

          <Section
            id="availability"
            title="Availability & changes"
            icon="clock"
          >
            <p>
              We work to keep the Platform available and reliable, but we do not
              promise it will be uninterrupted or error-free. It may be
              unavailable for maintenance, upgrades, security work, or because
              of internet, power, device or third-party failures outside our
              control.
            </p>
            <p>
              We may add, change or retire features to improve the service. If
              we make a change that materially reduces what you paid for, we
              will give reasonable notice where practicable.
            </p>
          </Section>

          <Section
            id="termination"
            title="Suspension & termination"
            icon="power"
          >
            <p>
              You may stop using the Platform and close your account at any
              time.
            </p>
            <p>
              We may suspend or end access, with notice where reasonable, if:
            </p>
            <CheckList
              items={[
                "You breach these Terms or misuse the Platform",
                "Payment is overdue or a payment is disputed or reversed without cause",
                "We reasonably suspect fraud, abuse or a security risk",
                "The law or a lawful authority requires it",
                "We discontinue the Platform, in which case we will give reasonable notice",
              ]}
            />
            <p>
              When an account ends, your right to use the Platform stops.
              Sections that by their nature should continue, such as payment
              obligations, intellectual property, disclaimers, liability,
              indemnity and governing law, will continue to apply.
            </p>
          </Section>

          <Section id="disclaimer" title="Disclaimers" icon="alert">
            <p>
              To the extent the law allows, the Platform is provided “as is” and
              “as available”. We do not give warranties of any kind beyond those
              the law makes mandatory, including that the Platform will meet
              every requirement of your business, be free of errors, or that
              reports, tax figures or calculations are suitable for any
              particular filing or legal purpose.
            </p>
            <p>
              You are responsible for checking the information you rely on,
              including GST and invoice details, and for keeping your own
              backups of anything critical.
            </p>
          </Section>

          <Section id="liability" title="Limitation of liability" icon="scale">
            <p>To the fullest extent the law permits:</p>
            <CheckList
              items={[
                "We are not liable for indirect, incidental, special or consequential loss, or for loss of profit, revenue, goodwill or data",
                "Our total liability for any claim relating to the Platform is limited to the subscription fees you paid us in the 12 months before the event that gave rise to the claim",
                "We are not liable for losses caused by events beyond our reasonable control, such as outages of internet, power, hosting or payment providers, natural events or government action",
              ]}
            />
            <Note icon="info">
              Nothing in these Terms excludes or limits liability that cannot be
              excluded or limited under applicable law, including for fraud.
            </Note>
          </Section>

          <Section id="indemnity" title="Indemnity" icon="shield">
            <p>
              You agree to defend and compensate Abacco Technology and its team
              against claims, losses and reasonable costs arising from your
              breach of these Terms, your violation of law, or content and
              customer data you enter without the consents or rights required,
              including claims from your own customers or employees.
            </p>
          </Section>

          <Section id="law" title="Governing law & disputes" icon="gavel">
            <p>
              These Terms are governed by the laws of India. If a dispute
              arises, please write to us first so we can try to resolve it in
              good faith. If it is not resolved, the competent courts in India
              will have jurisdiction, unless a separate agreement between us
              says otherwise.
            </p>
          </Section>

          <Section id="changes" title="Changes to these terms" icon="message">
            <p>
              We may update these Terms when our services, technology, business
              or legal obligations change. The latest version is always on this
              page with its update date. For material changes we may also tell
              you by email or in the app. If you keep using the Platform after
              the new Terms take effect, you accept them; if you do not agree,
              you should stop using the Platform and cancel your subscription.
            </p>
          </Section>

          <Section id="general" title="General provisions" icon="globe">
            <CheckList
              items={[
                "Entire agreement: these Terms, the Privacy Policy and any order form are the whole agreement about the Platform",
                "Severability: if a part is found unenforceable, the rest remains in force",
                "No waiver: not enforcing a right now does not mean we give it up",
                "Assignment: you may not transfer your account or rights without our consent; we may transfer ours in a merger, acquisition or sale of the business",
                "Notices: we may contact you at the email, phone number or in-app address on your account",
              ]}
            />
          </Section>

          <Section id="contact" title="Contact & grievances" icon="mail">
            <p>
              For questions about these Terms, billing or account issues, or to
              raise a complaint, please reach out:
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <a
                href="mailto:support.tech@abaccotech.com"
                className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-mauve to-mauve-deep p-5 text-cream shadow-lg shadow-mauve/25 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mauve"
              >
                <IconBadge name="mail" tone="ghost" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-blush">Email</span>
                  <span className="block break-all text-sm font-medium">
                    support.tech@abaccotech.com
                  </span>
                </span>
                <Icon
                  name="arrowRight"
                  className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1"
                />
              </a>
              <a
                href="https://abacco-aura-pos.onrender.com/"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-blush bg-white p-5 transition hover:-translate-y-0.5 hover:bg-petal/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mauve"
              >
                <IconBadge name="globe" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-ink/50">Website</span>
                  <span className="block text-sm font-medium text-ink">
                    SALORA GLAM
                  </span>
                </span>
                <Icon name="external" className="h-5 w-5 shrink-0 text-mauve" />
              </a>
            </div>
            <Note icon="info" title="When you write to us">
              Tell us your salon name, the email on your account and whether the
              issue is on the website, Android app or iOS app. Never send
              passwords, OTPs, CVV values or banking credentials by email.
            </Note>
          </Section>

          <div className="border-t border-blush pt-8 text-center">
            <p className="font-display text-xl text-mauve">
              Your business. Your customers. Your trust.
            </p>
            {/* <p className="mt-3 text-xs text-ink/50">
              © {new Date().getFullYear()} Abacco Technology. All rights
              reserved.
            </p> */}
          </div>
        </article>
      </div>

      {/* Mobile contents button + drawer */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-mauve-deep px-5 py-3 text-sm font-semibold text-cream shadow-xl shadow-mauve/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mauve lg:hidden"
        aria-haspopup="dialog"
      >
        <Icon name="menu" className="h-4 w-4" />
        Contents
        <span className="rounded-full bg-cream/15 px-2 py-0.5 text-xs">
          {Math.round(progress)}%
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Contents"
        >
          <button
            type="button"
            aria-label="Close contents"
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="pp-drawer relative h-full w-[86%] max-w-sm bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-petal text-mauve"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
            <Contents
              active={active}
              progress={progress}
              onPick={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
