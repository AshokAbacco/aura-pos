/** About: the company behind Aura POS, why it exists, mission, values, the product and how we work. */
import { usePageMeta } from './hooks/usePageMeta.js';
import { useReveal } from './hooks/useReveal.js';
import { CtaBanner, IconFeatureRow } from './components/common';
import { AboutHero, WhoWeAre, WhyWeCreated, MissionVision, CoreValues, OurProduct, OurApproach } from './components/about/AboutSections.jsx';
import { ABOUT_ICONS, COMPANY } from './utils/siteContent.js';
import { IMG } from './utils/siteImages.js';

export default function AboutPage() {
  usePageMeta(
    "About",
    `Salora Glam is salon and spa management software built by ${COMPANY.name}.`,
  );
  const ref = useReveal();
  return (
    <div ref={ref}>
      <AboutHero />
      <IconFeatureRow items={ABOUT_ICONS} />
      <WhoWeAre />
      <WhyWeCreated />
      <MissionVision />
      <CoreValues />
      <OurProduct />
      <OurApproach />
      <CtaBanner title="Let’s Build Something Meaningful Together" body={`Salora Glam is brought to you by ${COMPANY.name}. Whether you are a single salon or a growing chain, we are here to help you with the right technology.`} cta="Contact Us" to="/contact" image={IMG.ctaSpaCandles} />
    </div>
  );
}
