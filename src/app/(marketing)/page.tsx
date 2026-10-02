import { Hero } from "@/components/marketing/hero";
import { IntroPreloader } from "@/components/intro/preloader";
import { LogoMarquee } from "@/components/marketing/logo-marquee";
import { RatingCheck } from "@/components/marketing/rating-check";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { DemoCta, Faq, HowItWorks, Pricing } from "@/components/marketing/sections";

export default function HomePage() {
  return (
    <>
      <IntroPreloader />
      <Hero />
      <LogoMarquee />
      <RatingCheck />
      <FeatureGrid />
      <HowItWorks />
      <Pricing />
      <Faq />
      <DemoCta />
    </>
  );
}
