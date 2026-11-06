import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LuArrowRight, LuMenu, LuX } from 'react-icons/lu';
import { cx } from '../../../utils/cx.js';
import { NAV_LINKS } from '../../../features/website';

/** Website navbar (also shown on the sign-in and sign-up pages). Sticky; gains a backdrop once the page scrolls. */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); };
  }, []);
  const linkCls = ({ isActive }) => cx('relative py-1 text-[13px] font-medium transition hover:text-mauve', isActive ? 'text-mauve after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded after:bg-mauve' : 'text-ink/80');

  return (
    <header
      className={cx(
        "sticky top-0 z-40 transition-colors duration-300",
        scrolled || open
          ? "bg-cream/90 shadow-[0_1px_0_var(--color-blush)] backdrop-blur"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center">
          <img
            src="/logo/brand-logo-1.png"
            alt="Brand Logo"
            className="h-15 w-auto object-contain"
          />
        </Link>

        <nav aria-label="Site" className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map(([to, l]) => (
            <NavLink key={to} to={to} end={to === "/"} className={linkCls}>
              {l}
            </NavLink>
          ))}

          <NavLink to="/login" className={linkCls}>
            Sign in
          </NavLink>

          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 rounded-full bg-mauve px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_20px_-10px_rgb(123_40_67/.8)] transition hover:bg-mauve-deep"
          >
            Start free trial <LuArrowRight size={15} />
          </Link>
        </nav>

        <button
          className="lg:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label="Menu"
        >
          {open ? <LuX size={24} /> : <LuMenu size={24} />}
        </button>
      </div>
      <nav
        id="site-menu"
        aria-label="Site"
        className={cx(
          "grid overflow-hidden px-5 transition-[grid-template-rows] duration-300 lg:hidden",
          open ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]",
        )}
      >
        <div className="flex min-h-0 flex-col gap-1 text-base">
          {[...NAV_LINKS, ["/login", "Sign in"]].map(([to, l]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cx(
                  "rounded-lg px-3 py-2",
                  isActive ? "bg-petal font-semibold text-mauve" : "text-ink",
                )
              }
            >
              {l}
            </NavLink>
          ))}
          <Link
            to="/register"
            className="mt-2 rounded-full bg-mauve px-5 py-3 text-center font-semibold text-white"
          >
            Start free trial
          </Link>
        </div>
      </nav>
    </header>
  );
}
