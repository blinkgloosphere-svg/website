import { FeatureCards } from "./features/feature-cards";

/** Four story cards in a Huly-style staggered grid. */
export function FeatureGrid() {
  return (
    <section
      id="solutions"
      className="border-b border-border py-20 sm:py-28"
      style={{ background: "radial-gradient(60% 40% at 15% 0%, #fbf6ec 0%, transparent 70%), linear-gradient(180deg, #f7f8f9 0%, #ffffff 60%)" }}
    >
      <div className="container-x">
        <div className="max-w-3xl">
          <h2 className="t-display">Every review, working for you.</h2>
          <p className="t-lead mt-5 max-w-2xl">
            Blink is one review page, one QR code and one dashboard. Customers scan, rate and review in under a minute, and you hear
            about problems before Google does.
          </p>
        </div>
        <div className="mt-14">
          <FeatureCards />
        </div>
      </div>
    </section>
  );
}
