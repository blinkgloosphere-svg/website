import { Hero } from "@/components/marketing/hero";
import { LogoMarquee } from "@/components/marketing/logo-marquee";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { About, DemoCta, Faq, HowItWorks, Pricing } from "@/components/marketing/sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <FeatureGrid />
      <HowItWorks />
      <Pricing />
      <Faq />
      <About />
      <DemoCta />
    </>
  );
}
