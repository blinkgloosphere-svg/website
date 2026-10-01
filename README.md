# Blink Reviews

Customer review platform for Singapore businesses: a branded review page per client with smart routing (4 to 5 stars to Google, 1 to 3 stars to private feedback), printable QR codes, a client dashboard, a super admin, and two lead-capture tools.

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase · Resend · Vercel.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Supabase keys the app runs in **preview mode**: it reads `data/gloosphere-export.json` (not committed) and shows every screen read-only with the real imported data. Login is bypassed in preview; `/admin` and `/dashboard` open directly.

## Connect Supabase

See `supabase/README.md`. In short: create a project, run `supabase/migrations/0001_init.sql`, put the keys in `.env.local`, then import:

```bash
npx tsx scripts/import-export.ts --data data/gloosphere-export.json           # dry run
npx tsx scripts/import-export.ts --data data/gloosphere-export.json --commit  # write
npx tsx scripts/import-export.ts --data data/gloosphere-export.json --commit --invite  # email owners
```

## Map

| Path | What |
|---|---|
| `/` | Marketing site (hero, client logo marquee, 4 feature cards, how it works, pricing, FAQ, about, demo CTA) |
| `/tools/qr-code-generator` | Free QR poster tool, lead-gated download |
| `/tools/rating-calculator` | Free rating calculator, lead-gated result |
| `/r/[id]` | Customer review page. `/reviewsoftware.html?id=` from the old QR codes rewrites here |
| `/login` | Client and admin login |
| `/dashboard` | Client: overview, reviews, private feedback, QR code, review page settings |
| `/admin` | Super admin: overview, businesses, reviews, leads, campaigns |
| `/api/places` | Server-side Google Places search (key never reaches the browser) |
| `/api/reviews`, `/api/leads` | Submission endpoints |

## Data layer

`src/lib/data/repo.ts` is the interface. `preview-repo.ts` reads the export; `supabase-repo.ts` talks to Postgres. `getRepo()` picks one from the environment, so pages never know which is active.
