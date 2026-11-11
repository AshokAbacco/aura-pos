/** Public marketing pages, rendered inside layouts/site (navbar + footer). Loaded eagerly: this is the first thing visitors see. */
import { Route } from "react-router-dom";
import HomePage from "./HomePage.jsx";
import FeaturesPage from "./FeaturesPage.jsx";
import PricingPage from "./PricingPage.jsx";
import AboutPage from "./AboutPage.jsx";
import ProductsPage from "./ProductsPage.jsx";
import ContactPage from "./ContactPage.jsx";
import LegalPage from "./LegalPage.jsx";

export const websiteRoutes = (
  <>
    <Route index element={<HomePage />} />
    <Route path="features" element={<FeaturesPage />} />
    <Route path="pricing" element={<PricingPage />} />
    <Route path="about" element={<AboutPage />} />
    <Route path="products" element={<ProductsPage />} />
    <Route path="contact" element={<ContactPage />} />
    <Route path="privacy" element={<LegalPage doc="privacy" />} />
    <Route path="terms" element={<LegalPage doc="terms" />} />
    <Route path="refunds" element={<LegalPage doc="refunds" />} />
  </>
);
