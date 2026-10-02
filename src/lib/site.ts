/** Site-wide settings. Values can be overridden with environment variables. */
export const site = {
  name: "Blink Reviews",
  brand: "Blink",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://reviews.blink.sg",
  /** WhatsApp number in international format without plus or spaces. */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "6500000000",
  leadsEmail: process.env.LEADS_EMAIL ?? "hello@blink.sg",
  fromEmail: process.env.FROM_EMAIL ?? "Blink Reviews <notifications@reviews.blink.sg>",
  tagline: "Local visibility. Lasting trust.",
};

export function whatsappLink(text: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}

export const nav = [
  { href: "/#solutions", label: "Solutions" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
];

export const plans = [
  {
    id: "basic",
    name: "Basic",
    price: process.env.NEXT_PUBLIC_PRICE_BASIC ?? "20",
    period: "per outlet / month",
    note: "Billed yearly",
    features: [
      "Branded review page and QR code",
      "Smart review routing",
      "Private feedback inbox",
      "Email alert for every review",
      "Client dashboard",
    ],
    cta: "Start Basic",
  },
  {
    id: "pro",
    name: "Pro",
    price: process.env.NEXT_PUBLIC_PRICE_PRO ?? "35",
    period: "per outlet / month",
    note: "Billed yearly",
    featured: true,
    features: [
      "Everything in Basic",
      "Printed QR stand and NFC card",
      "Voucher and social follow prompts",
      "Local SEO health check each quarter",
      "Priority WhatsApp support",
    ],
    cta: "Start Pro",
  },
] as const;

export const faqs = [
  {
    q: "How does the review page work?",
    a: "Your customers scan a QR code or tap an NFC card and land on a page with your logo. They pick a star rating. Happy customers are taken straight to your Google review page. Unhappy customers are asked for private feedback first, so you hear about problems before the public does.",
  },
  {
    q: "Do I need to change anything on my Google listing?",
    a: "No. Blink links to your existing Google Business Profile. Reviews are written on Google by your customers, in their own words.",
  },
  {
    q: "What do I get physically?",
    a: "A printed table stand with your QR code, and on Pro an NFC card customers can tap with their phone. Replacements are included.",
  },
  {
    q: "Can I see the feedback that didn't go to Google?",
    a: "Yes. Every piece of private feedback is in your dashboard with the customer's message and contact, if they left one, so you can follow up.",
  },
  {
    q: "What happens when my subscription ends?",
    a: "Your review page shows a renewal notice instead of the rating screen. Your data and reviews stay safe, and everything comes back the moment you renew.",
  },
];
