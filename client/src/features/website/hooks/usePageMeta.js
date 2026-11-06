import { useEffect } from 'react';

/** Title, description, Open Graph and canonical URL for public pages. */
export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = `${title} | Salora Glam`;
    const upsert = (selector, tag, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) { el = document.createElement(tag); document.head.appendChild(el); }
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    };
    upsert('meta[name="description"]', 'meta', { name: 'description', content: description });
    upsert('meta[property="og:title"]', "meta", {
      property: "og:title",
      content: `${title} | Salora Glam`,
    });
    upsert('meta[property="og:description"]', 'meta', { property: 'og:description', content: description });
    upsert('link[rel="canonical"]', 'link', { rel: 'canonical', href: window.location.origin + window.location.pathname });
  }, [title, description]);
}
