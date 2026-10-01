import { Stars } from "@/components/ui/stars";
import { QrCode, Smartphone } from "@/components/ui/icons";

/**
 * Four equal dark cards in a 2x2 grid. Each holds a still product mock-up and
 * a one-line description. No motion, no hover effects.
 */
export function FeatureGrid() {
  return (
    <section id="solutions" className="border-b border-border py-20">
      <div className="container-x">
        <div className="max-w-3xl">
          <h2 className="t-title-1">Everything a local business needs to be chosen.</h2>
          <p className="t-lead mt-4">
            Blink gives you one review page, one QR code and one dashboard. Customers scan, rate and review in under a
            minute, and you hear about problems before Google does.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Card title="Smart review routing" text="Happy customers go straight to Google. Unhappy ones reach you first, in private.">
            <RoutingMock />
          </Card>
          <Card title="QR code and NFC" text="A printed stand and a tap card for every outlet, branded with your logo.">
            <QrMock />
          </Card>
          <Card title="Client dashboard" text="Every review, every piece of private feedback, and your subscription in one place.">
            <DashboardMock />
          </Card>
          <Card title="Free growth tools" text="A review QR generator and a rating calculator any business can use today.">
            <ToolsMock />
          </Card>
        </div>
      </div>
    </section>
  );
}

function Card({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <article className="card-dark flex min-h-[420px] flex-col overflow-hidden">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(80%_60%_at_50%_0%,rgba(245,180,0,0.18),transparent_70%)] px-6 pt-10">
        {children}
      </div>
      <p className="px-7 pb-7 pt-5 text-[15px] leading-relaxed text-dark-fg-secondary">
        <span className="font-medium text-dark-fg">{title}.</span> {text}
      </p>
    </article>
  );
}

/* Mock-ups: deliberately simple, static UI drawings. */

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[240px] rounded-[28px] border border-white/10 bg-[#0b0c0e] p-3 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
      <div className="rounded-[20px] bg-[#16181b] p-4">{children}</div>
    </div>
  );
}

function RoutingMock() {
  return (
    <div className="flex items-center gap-5">
      <Phone>
        <div className="mx-auto h-9 w-24 rounded-full bg-white/10" />
        <p className="mt-4 text-center text-[13px] font-medium leading-snug text-white">How was your visit today?</p>
        <div className="mt-3 flex justify-center">
          <Stars value={5} size={22} emptyColor="#2b2e33" />
        </div>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-2.5 text-[11px] text-white/70">
          4 to 5 stars <span className="float-right text-[#F5B400]">to Google</span>
        </div>
        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-2.5 text-[11px] text-white/70">
          1 to 3 stars <span className="float-right text-white/50">private feedback</span>
        </div>
      </Phone>
    </div>
  );
}

function QrMock() {
  return (
    <div className="flex items-end gap-6">
      <div className="w-[190px] rounded-2xl bg-white p-4 text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
        <div className="text-center text-[11px] font-semibold tracking-wide">REVIEW US ON GOOGLE</div>
        <div className="mx-auto mt-3 grid size-28 place-items-center rounded-lg border border-border">
          <QrCode className="size-20" strokeWidth={1.2} aria-hidden />
        </div>
        <div className="mt-3 flex justify-center">
          <Stars value={5} size={14} />
        </div>
        <div className="mt-2 text-center text-[10px] text-fg-secondary">Scan to leave a review</div>
      </div>
      <div className="mb-6 w-[110px] rounded-xl border border-white/10 bg-gradient-to-br from-[#F5B400] to-[#e09a00] p-3 text-ink">
        <Smartphone className="size-5" aria-hidden />
        <div className="mt-6 text-[10px] font-semibold leading-tight">TAP TO REVIEW</div>
        <div className="mt-1 text-[9px] opacity-70">NFC card</div>
      </div>
    </div>
  );
}

function DashboardMock() {
  const rows = [
    { name: "Sarah L.", stars: 5, text: "Fast, friendly, will come back." },
    { name: "Daniel T.", stars: 4, text: "Good value. Parking was tricky." },
    { name: "Private", stars: 2, text: "Waited 25 min for a table." },
  ];
  return (
    <div className="w-full max-w-[420px] rounded-xl border border-white/10 bg-[#0b0c0e] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-[11px] text-white/60">
        <span className="size-2 rounded-full bg-white/20" />
        <span className="size-2 rounded-full bg-white/20" />
        <span className="size-2 rounded-full bg-white/20" />
        <span className="ml-2">Dashboard</span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        <Stat label="Reviews" value="152" />
        <Stat label="Average" value="4.8" />
        <Stat label="This month" value="+19" />
      </div>
      <ul className="divide-y divide-white/10 px-3 pb-3">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3 py-2 text-[11px]">
            <span className="w-16 truncate text-white/80">{r.name}</span>
            <Stars value={r.stars} size={11} emptyColor="#2b2e33" />
            <span className="truncate text-white/50">{r.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[10px] text-white/50">{label}</div>
      <div className="text-base font-semibold text-white">{value}</div>
    </div>
  );
}

function ToolsMock() {
  return (
    <div className="w-full max-w-[400px] rounded-xl border border-white/10 bg-[#0b0c0e] p-4 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
      <div className="text-[11px] text-white/50">Rating calculator</div>
      <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/80">Copper Ladle Kitchen</div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Now" value="4.3" />
        <Stat label="Target" value="4.7" />
        <Stat label="5★ needed" value="38" />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-[62%] bg-[#F5B400]" />
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
        <span>Free to use</span>
        <span className="rounded-full bg-[#F5B400] px-2.5 py-1 font-medium text-ink">Get my plan</span>
      </div>
    </div>
  );
}
