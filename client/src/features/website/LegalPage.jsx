import { usePageMeta } from './hooks/usePageMeta.js';
import { Eyebrow, LeafSprig } from './components/common';

/** Placeholder until the operator publishes lawyer-reviewed text. Clearly marked as such. */
export default function LegalPage({ title }) {
  usePageMeta(title, `${title} for Salora Glam.`);
  return (
    <section className="relative mx-auto max-w-3xl px-5 py-16">
      <LeafSprig flip className="absolute -right-10 top-6 h-40 max-md:hidden" />
      <Eyebrow>Legal</Eyebrow>
      <h1 className="mt-4 font-display text-5xl text-ink">{title}</h1>
      <p className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900">This page is a placeholder. The operator of this service must publish a {title.toLowerCase()} reviewed by a qualified lawyer before accepting customers.</p>
    </section>
  );
}
