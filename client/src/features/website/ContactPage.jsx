/** Contact: details, enquiry form (stored on the server), location map, FAQ, call to action. */
import { LuArrowRight, LuExternalLink } from "react-icons/lu";
import { usePageMeta } from "./hooks/usePageMeta.js";
import { useReveal } from "./hooks/useReveal.js";
import {
  CtaBanner,
  Eyebrow,
  FaqAccordion,
  IconCircle,
  LeafSprig,
  SiteIcon,
} from "./components/common";
import { ContactForm } from "./components/contact/ContactForm.jsx";
import {
  COMPANY,
  CONTACT_FAQ,
  CONTACT_PERKS,
  CONTACT_PRODUCTS,
} from "./utils/siteContent.js";
import { IMG } from "./utils/siteImages.js";

const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  COMPANY.mapQuery,
)}`;
const mapsEmbed = `https://www.google.com/maps?q=${encodeURIComponent(
  COMPANY.mapQuery,
)}&output=embed`;

export default function ContactPage() {
  usePageMeta(
    "Contact",
    "Talk to the Salora Glam team about a demo, pricing or a custom solution.",
  );
  const ref = useReveal();
  const cards = [
    [
      "mail",
      "Email",
      <a
        key="e"
        href={`mailto:${COMPANY.email}`}
        className="text-mauve hover:underline"
      >
        {COMPANY.email}
      </a>,
      "Drop us an email anytime",
    ],
    [
      "phone",
      "Phone",
      <a
        key="p"
        href={`tel:${COMPANY.phoneHref}`}
        className="text-mauve hover:underline"
      >
        {COMPANY.phone}
      </a>,
      COMPANY.hours,
    ],
  ];
  return (
    <div ref={ref}>
      <section className="relative -mt-[72px] overflow-hidden pt-[72px]">
        <img
          src={IMG.contactHeroPhone}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-fade-left absolute inset-0 max-md:bg-cream/85" />
        <LeafSprig className="absolute -left-6 top-24 h-40 max-md:hidden" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-10 md:pb-20">
          <div className="max-w-xl fade-up">
            <Eyebrow>Contact us</Eyebrow>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] text-ink md:text-[3.5rem]">
              Let’s Talk About
              <br />
              Your <span className="text-mauve">Next Project</span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-stone-700">
              Tell us about your business requirements, software idea, or
              questions about our products. Our team is ready to discuss the
              next steps.
            </p>
            <ul className="mt-7 flex flex-wrap gap-6 text-xs font-semibold text-ink">
              {CONTACT_PERKS.map(([icon, l]) => (
                <li key={l} className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-mauve shadow-sm">
                    <SiteIcon name={icon} size={16} />
                  </span>
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[1fr_1.05fr]">
        <div className="space-y-6">
          <div data-reveal className="site-card p-7">
            <h2 className="font-display text-3xl text-ink">Get in Touch</h2>
            <p className="mt-2 text-sm text-stone-600">
              Reach out to us using the details below or fill out the form and
              we’ll get back to you soon.
            </p>
            <div className="mt-6 space-y-4">
              {cards.map(([icon, t, v, s]) => (
                <div
                  key={t}
                  className="flex items-start gap-5 rounded-xl border border-blush/70 p-5"
                >
                  <IconCircle name={icon} size="lg" />
                  <div className="text-sm">
                    <p className="font-semibold text-ink">{t}</p>
                    <p className="mt-1 text-base font-semibold">{v}</p>
                    <p className="text-stone-500">{s}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-5 rounded-xl border border-blush/70 p-5">
                <IconCircle name="pin" size="lg" />
                <div className="text-sm">
                  <p className="font-semibold text-ink">Our Office</p>
                  <address className="mt-1 not-italic text-stone-600">
                    {COMPANY.address.map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </address>
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 font-semibold text-mauve"
                  >
                    View on Google Maps <LuArrowRight size={14} />
                    <LuExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div data-reveal className="rounded-2xl bg-petal/80 p-7">
            <h2 className="font-display text-2xl text-mauve-deep">
              Discuss Any of Our Products
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Get expert guidance on the right solution for your business.
            </p>
            <ul className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-6">
              {CONTACT_PRODUCTS.map(([icon, l]) => (
                <li
                  key={l}
                  className="text-center text-[11px] font-semibold leading-tight text-ink"
                >
                  <IconCircle name={icon} className="mb-2 bg-white" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div data-reveal className="site-card p-7 md:p-8">
          <h2 className="font-display text-3xl text-ink">Send Us a Message</h2>
          <p className="mb-6 mt-2 text-sm text-stone-600">
            Fill out the form below and our team will get back to you soon.
          </p>
          <ContactForm />
        </div>
      </section>

      <section
        id="faq"
        className="mx-auto grid max-w-6xl scroll-mt-24 gap-8 px-5 py-14 lg:grid-cols-2"
      >
        <div data-reveal>
          <h2 className="font-display text-3xl text-ink">Our Location</h2>
          <p className="mt-2 text-sm text-stone-600">
            Visit our office or get in touch with our team. We’d love to hear
            from you.
          </p>
          <iframe
            title={`Map: ${COMPANY.name}`}
            src={mapsEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="mt-5 h-80 w-full rounded-2xl border border-blush"
          />
        </div>
        <div data-reveal>
          <h2 className="font-display text-3xl text-ink">
            Frequently Asked Questions
          </h2>
          <p className="mb-5 mt-2 text-sm text-stone-600">
            Quick answers to common questions about Salora Glam and our
            services.
          </p>
          <FaqAccordion items={CONTACT_FAQ} defaultOpen={-1} />
        </div>
      </section>

      <CtaBanner
        eyebrow="Ready to grow your salon business?"
        title="Let’s Build Something Amazing Together"
        body="Whether you have a question, need a demo, or want a custom solution, our team is here to help you get started with Salora Glam."
        cta="Contact Us"
        to="/contact"
        image={IMG.ctaSpaCandles}
      />
    </div>
  );
}
