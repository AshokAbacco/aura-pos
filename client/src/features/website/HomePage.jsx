/** Home: hero, services ribbon, workflow, billing preview + modules, pricing, benefits, FAQ, call to action. */
import { Navigate } from "react-router-dom";
import { isNative } from "../../lib/native.js";
import { usePageMeta } from "./hooks/usePageMeta.js";
import { useReveal } from "./hooks/useReveal.js";
import { CtaBanner } from "./components/common";
import {
  HomeHero,
  ServiceRibbon,
  Workflow,
  FrontDeskSection,
  HomePricing,
  MoreTime,
  HomeFaq,
} from "./components/home";
import { IMG } from "./utils/siteImages.js";

export default function HomePage() {
  if (isNative) return <Navigate to="/app" replace />; // the Android app opens straight into the salon workspace
  return <HomeContent />;
}

function HomeContent() {
  usePageMeta(
    "Salon & Spa Billing Software",
    "GST billing, appointments, memberships, stock, staff commission and profit & loss for salons and spas in India.",
  );
  const ref = useReveal();
  return (
    <div ref={ref}>
      <HomeHero />
      <ServiceRibbon />
      <Workflow />
      <FrontDeskSection />
      <HomePricing />
      <MoreTime />
      <HomeFaq />
      <CtaBanner
        title="Try it with your own price list."
        body="Set up your services and staff in an afternoon. Free for 14 days."
        cta="Start a free trial"
        image={IMG.ctaSpaProducts}
      />
    </div>
  );
}
