import { Link } from 'react-router-dom';
import { LuInstagram, LuFacebook, LuLinkedin, LuYoutube, LuHeart } from 'react-icons/lu';
import { BRAND, FOOTER_LINKS, SOCIAL } from '../../../features/website';

const SOCIAL_ICON = { instagram: LuInstagram, facebook: LuFacebook, linkedin: LuLinkedin, youtube: LuYoutube };

/** Website footer. Social links are set in features/website/utils/siteContent.js (SOCIAL). */
export function SiteFooter() {
  return (
    <footer className="border-t border-blush bg-cream px-5 py-8 text-xs">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
        <div>
          <Link to="/" className="inline-flex items-center">
            <img
              src="/logo/brand-logo.png"
              alt="Brand Logo"
              className="h-20 w-auto object-contain"
            />
          </Link>
          <p className="mt-2 max-w-xs text-stone-600">{BRAND.tagline}</p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-6 gap-y-2 text-stone-700"
        >
          {FOOTER_LINKS.map(([to, l]) => (
            <Link key={to} to={to} className="hover:text-mauve">
              {l}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3 text-ink">
            {SOCIAL.map(({ id, label, url }) => {
              const Icon = SOCIAL_ICON[id];
              return url ? (
                <a
                  key={id}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="hover:text-mauve"
                >
                  <Icon size={16} />
                </a>
              ) : (
                <span key={id} title={`${label} (link not set yet)`}>
                  <Icon size={16} aria-hidden />
                </span>
              );
            })}
          </div>

          <p className="flex items-center gap-1 text-stone-600">
            Made with
            <LuHeart
              size={12}
              className="fill-mauve text-mauve"
              aria-label="love"
            />
            for salon owners
          </p>
        </div>
      </div>
    </footer>
  );
}
