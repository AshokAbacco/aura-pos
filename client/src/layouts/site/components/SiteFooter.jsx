import { Link } from "react-router-dom";
import {
  LuInstagram,
  LuFacebook,
  LuLinkedin,
  LuYoutube,
  LuHeart,
  LuMail,
  LuPhone,
  LuClock,
  LuMapPin,
  LuArrowRight,
} from "react-icons/lu";
import {
  BRAND,
  COMPANY,
  FOOTER_GROUPS,
  SOCIAL,
} from "../../../features/website";
import { BrandLogo } from "../../../components/ui/BrandLogo.jsx";

const SOCIAL_ICON = {
  instagram: LuInstagram,
  facebook: LuFacebook,
  linkedin: LuLinkedin,
  youtube: LuYoutube,
};

/**
 * Website footer: brand + social, link columns, contact details, and a bottom bar with the
 * copyright and the developer credit (logo inside a spinning ring — .logo-ring in styles/index.css).
 * Links and contact details come from features/website/utils/siteContent.js.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-blush bg-gradient-to-b from-cream to-petal/60 text-sm">
      <div className="mx-auto max-w-6xl px-5 pb-8 pt-14">
        {/* Top: brand + columns + contact */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-[1.3fr_repeat(3,0.7fr)_1.2fr]">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link
              to="/"
              aria-label={`${BRAND.name} home`}
              className="inline-block"
            >
              <BrandLogo className="h-16" />
            </Link>
            <p className="mt-4 max-w-xs leading-relaxed text-stone-600">
              {BRAND.tagline}
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIAL.map(({ id, label, url }) => {
                const Icon = SOCIAL_ICON[id];
                if (!Icon) return null;
                const cls =
                  "grid h-9 w-9 place-items-center rounded-full ring-1 transition";
                return url ? (
                  <a
                    key={id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`${cls} bg-white text-mauve ring-blush hover:bg-mauve hover:text-white`}
                  >
                    <Icon size={16} />
                  </a>
                ) : (
                  <span
                    key={id}
                    title={`${label} (link not set yet)`}
                    className={`${cls} bg-white/60 text-stone-400 ring-blush/70`}
                  >
                    <Icon size={16} aria-hidden />
                  </span>
                );
              })}
            </div>
            <Link
              to="/register"
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-mauve px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_20px_-10px_rgb(123_40_67/.8)] transition hover:bg-mauve-deep"
            >
              Start free trial <LuArrowRight size={15} aria-hidden />
            </Link>
          </div>

          {FOOTER_GROUPS.map(([title, links]) => (
            <nav key={title} aria-label={title}>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-mauve">
                {title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {links.map(([to, label]) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-stone-700 transition hover:pl-1 hover:text-mauve"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-mauve">
              Get in touch
            </p>
            <ul className="mt-4 space-y-3 text-stone-700">
              <li>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="flex items-start gap-2.5 hover:text-mauve"
                >
                  <LuMail className="mt-0.5 shrink-0 text-mauve" aria-hidden />
                  {COMPANY.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${COMPANY.phoneHref}`}
                  className="flex items-start gap-2.5 hover:text-mauve"
                >
                  <LuPhone className="mt-0.5 shrink-0 text-mauve" aria-hidden />
                  {COMPANY.phone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <LuClock className="mt-0.5 shrink-0 text-mauve" aria-hidden />
                {COMPANY.hours}
              </li>
              <li className="flex items-start gap-2.5">
                <LuMapPin className="mt-0.5 shrink-0 text-mauve" aria-hidden />
                <span className="leading-relaxed">
                  {COMPANY.address.join(" ")}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar: copyright · made with love · developer credit */}
        <div className="mt-12 flex flex-col items-center gap-5 border-t border-blush pt-6 text-xs text-stone-600 md:flex-row md:justify-between">
          <p className="text-center md:text-left">
            © {year} {BRAND.name}. All rights reserved.
            <span className="mx-2 text-blush max-md:hidden">|</span>
            <span className="inline-flex items-center gap-1 max-md:mt-1 max-md:flex max-md:justify-center">
              Made with{" "}
              <LuHeart
                size={12}
                className="fill-mauve text-mauve"
                aria-label="love"
              />{" "}
              for salon owners
            </span>
          </p>

          <a
            href={COMPANY.website}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 rounded-full bg-white/80 py-1.5 pl-1.5 pr-5 ring-1 ring-blush transition hover:shadow-md"
          >
            <span className="logo-ring h-12 w-12 p-[3px]">
              <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-white">
                <img
                  src={COMPANY.logo}
                  alt=""
                  className="h-full w-full object-contain p-0.5 transition-transform duration-500 group-hover:scale-110"
                />
              </span>
            </span>
            <span className="leading-tight">
              <span className="block text-[10px] uppercase tracking-[0.18em] text-stone-500">
                Built & developed by
              </span>
              <span className="block text-[15px] font-extrabold tracking-wide text-ink group-hover:text-mauve">
                {COMPANY.name}
              </span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
