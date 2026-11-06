import { FaqAccordion, LeafSprig } from '../common';
import { FAQ } from '../../utils/siteContent.js';

export function HomeFaq() {
  return (
    <section
      id="faq"
      className="mx-auto grid max-w-6xl scroll-mt-24 gap-10 px-5 py-16 md:grid-cols-[0.8fr_1.4fr] md:py-20"
    >
      <div className="relative" data-reveal>
        <h2 className="font-display text-4xl leading-tight text-ink md:text-5xl">
          Questions salon owners ask
        </h2>
        <p className="mt-4 text-sm text-stone-600">
          Answers to common questions about Salora Glam, so you can get started
          with confidence.
        </p>
        <LeafSprig className="mt-8 h-32 max-md:hidden" />
      </div>
      <FaqAccordion items={FAQ} />
    </section>
  );
}
