/**
 * Imports the Firestore export into Supabase.
 *
 *   npx tsx scripts/import-export.ts --data data/gloosphere-export.json            # dry run
 *   npx tsx scripts/import-export.ts --data data/gloosphere-export.json --commit   # write
 *   npx tsx scripts/import-export.ts --data data/gloosphere-export.json --commit --invite
 *
 * Flags:
 *   --data <path>        export file (default data/gloosphere-export.json)
 *   --env <path>         env file to load (default .env.local)
 *   --commit             actually write; without it only counts are printed
 *   --invite             send a password-reset email to every owner (active businesses)
 *   --include-inactive   with --invite, also email owners of inactive businesses
 *   --admin <email>      create (or reset) the super admin login with a new password
 *   --temp-passwords     give every owner a temporary password (for logging in before emails are set up)
 *
 * New passwords are written only to data/logins/ (private, never committed, never printed).
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Optional
 * NEXT_PUBLIC_SITE_URL is used for the redirect link in reset emails.
 *
 * Privacy: this script prints counts only, never names or email addresses.
 */

import fs from "node:fs";
import { randomInt } from "node:crypto";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Business, Review } from "../src/lib/types";
import type { AdCampaignInsert, BusinessInsert, Database, Json, ReviewInsert } from "../src/lib/supabase/database.types";
import { normalizeBusiness, normalizeReview, type ExportDoc, type ExportFile } from "../src/lib/data/normalize";

type Db = SupabaseClient<Database>;

const BATCH = 500;
const INVITE_DELAY_MS = 1500;
// Run from the project root (paths like data/... and public/logos resolve from here).
const ROOT = process.cwd();

// ---------------------------------------------------------------------------
// CLI + env
// ---------------------------------------------------------------------------

type Args = { data: string; env: string; commit: boolean; invite: boolean; includeInactive: boolean; admin: string | null; tempPasswords: boolean };

function parseArgs(argv: string[]): Args {
  const args: Args = { data: "data/gloosphere-export.json", env: ".env.local", commit: false, invite: false, includeInactive: false, admin: null, tempPasswords: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--data") args.data = argv[++i] ?? args.data;
    else if (a === "--env") args.env = argv[++i] ?? args.env;
    else if (a === "--commit") args.commit = true;
    else if (a === "--invite") args.invite = true;
    else if (a === "--admin") args.admin = (argv[++i] ?? "").trim().toLowerCase() || null;
    else if (a === "--temp-passwords") args.tempPasswords = true;
    else if (a === "--include-inactive") args.includeInactive = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

/** Minimal .env parser so the script has no dotenv dependency. Existing env wins. */
function loadEnvFile(file: string): void {
  const abs = path.resolve(ROOT, file);
  if (!fs.existsSync(abs)) return;
  for (const rawLine of fs.readFileSync(abs, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    const [, key, rawValue] = m;
    let value = rawValue.trim();
    const quoted = /^(['"])(.*)\1$/.exec(value);
    if (quoted) value = quoted[2];
    else value = value.replace(/\s+#.*$/, "");
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}. Add it to .env.local or export it before running.`);
  return v;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Error messages are printed, so scrub anything that looks like an address. */
const redact = (msg: string) => msg.replace(/[^\s@]+@[^\s@]+/g, "[email]");

function errorMessage(e: unknown): string {
  return redact(e instanceof Error ? e.message : String(e));
}

const toJson = (v: unknown): Json => JSON.parse(JSON.stringify(v)) as Json;

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

// ---------------------------------------------------------------------------
// Normalisation of the export
// ---------------------------------------------------------------------------

type Campaign = { id: string; title: string; body: string; imageUrl: string | null; linkUrl: string | null; isActive: boolean; createdAt: string | null };

function normalizeCampaign(doc: ExportDoc): Campaign {
  const d = doc.data;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const createdAt = d.createdAt;
  const createdIso =
    typeof createdAt === "object" && createdAt !== null && "value" in createdAt && typeof createdAt.value === "string"
      ? createdAt.value
      : typeof createdAt === "string"
        ? createdAt
        : null;
  return {
    id: doc.id,
    title: str(d.title),
    body: str(d.body ?? d.description),
    imageUrl: str(d.imageUrl) || null,
    linkUrl: str(d.linkUrl ?? d.url) || null,
    isActive: d.isActive !== false,
    createdAt: createdIso,
  };
}

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

type Dataset = { businesses: Business[]; reviews: Review[]; orphanReviews: number; campaigns: Campaign[] };

function loadDataset(file: string): Dataset {
  const abs = path.resolve(ROOT, file);
  if (!fs.existsSync(abs)) throw new Error(`Export file not found: ${file}`);
  const raw = JSON.parse(fs.readFileSync(abs, "utf8")) as ExportFile;
  const businesses = (raw.collections.businesses ?? []).map(normalizeBusiness);
  const ids = new Set(businesses.map((b) => b.id));
  const allReviews = (raw.collections.reviews ?? []).map(normalizeReview);
  const reviews = allReviews.filter((r) => ids.has(r.businessId));
  const campaigns = (raw.collections.adCampaigns ?? []).map(normalizeCampaign);
  return { businesses, reviews, orphanReviews: allReviews.length - reviews.length, campaigns };
}

/** Local logo paths (/logos/<file>) that exist on disk, per business. */
function localLogoRefs(businesses: Business[]): { present: number; missing: number } {
  let present = 0;
  let missing = 0;
  for (const b of businesses) {
    for (const url of [b.config.companyLogoUrl, b.config.voucherImageUrl]) {
      if (!url?.startsWith("/logos/")) continue;
      if (fs.existsSync(path.join(ROOT, "public", url))) present++;
      else missing++;
    }
  }
  return { present, missing };
}

// ---------------------------------------------------------------------------
// Supabase steps
// ---------------------------------------------------------------------------

type UploadStats = { uploaded: number; missing: number; failed: number };

/** Uploads /logos/<file> to logos/<businessId>/<file> and returns the public URL. */
async function uploadLogo(db: Db, businessId: string, localUrl: string, stats: UploadStats): Promise<string> {
  const filename = path.basename(localUrl);
  const source = path.join(ROOT, "public", "logos", filename);
  if (!fs.existsSync(source)) {
    stats.missing++;
    return localUrl;
  }
  const objectPath = `${businessId}/${filename}`;
  const contentType = MIME[path.extname(filename).toLowerCase()] ?? "application/octet-stream";
  const { error } = await db.storage.from("logos").upload(objectPath, fs.readFileSync(source), { contentType, upsert: true });
  if (error) {
    stats.failed++;
    console.error(`  upload failed (${objectPath}): ${errorMessage(error)}`);
    return localUrl;
  }
  stats.uploaded++;
  return db.storage.from("logos").getPublicUrl(objectPath).data.publicUrl;
}

async function uploadAllLogos(db: Db, businesses: Business[]): Promise<UploadStats> {
  const stats: UploadStats = { uploaded: 0, missing: 0, failed: 0 };
  for (const b of businesses) {
    if (b.config.companyLogoUrl?.startsWith("/logos/")) {
      b.config.companyLogoUrl = await uploadLogo(db, b.id, b.config.companyLogoUrl, stats);
    }
    if (b.config.voucherImageUrl?.startsWith("/logos/")) {
      b.config.voucherImageUrl = await uploadLogo(db, b.id, b.config.voucherImageUrl, stats);
    }
  }
  return stats;
}

async function listAllUsers(db: Db): Promise<Map<string, string>> {
  const byEmail = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) if (u.email) byEmail.set(u.email.toLowerCase(), u.id);
    if (data.users.length < perPage) return byEmail;
  }
}

type UserStats = { existing: number; created: number; failed: number };

/** Readable but strong password, e.g. Kq7m-Tx3p-9wHd-2cRf (no look-alike characters). */
function newPassword(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => A[randomInt(A.length)]).join("")).join("-");
}

const LOGIN_DIR = path.join(ROOT, "data", "logins");
function writePrivate(name: string, text: string) {
  fs.mkdirSync(LOGIN_DIR, { recursive: true, mode: 0o700 });
  const file = path.join(LOGIN_DIR, name);
  fs.writeFileSync(file, text, { mode: 0o600 });
  return path.relative(ROOT, file);
}
const csv = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Creates the public "logos" storage bucket if it does not exist yet. */
async function ensureBucket(db: Db) {
  const { data } = await db.storage.getBucket("logos");
  if (data) return "exists";
  const { error } = await db.storage.createBucket("logos", {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"],
  });
  if (error) throw new Error(`create logos bucket: ${errorMessage(error)}`);
  return "created";
}

/** Creates or resets the super admin login and records it in admin_users. */
async function ensureAdmin(db: Db, email: string) {
  const password = newPassword();
  const users = await listAllUsers(db);
  let id = users.get(email);
  if (id) {
    const { error } = await db.auth.admin.updateUserById(id, { password, email_confirm: true });
    if (error) throw new Error(`update admin: ${errorMessage(error)}`);
  } else {
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw new Error(`create admin: ${errorMessage(error ?? "no user")}`);
    id = data.user.id;
  }
  const { error } = await db.from("admin_users").upsert({ user_id: id, email }, { onConflict: "user_id" });
  if (error) throw new Error(`admin_users: ${errorMessage(error)}`);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://reviews.blink.sg";
  return writePrivate(
    "super-admin.txt",
    `Blink Reviews: super admin login\n\nLogin page: ${site}/login\nEmail:      ${email}\nPassword:   ${password}\n\nChange it after the first login at ${site}/dashboard/password.\n`,
  );
}

/** Gives every owner a temporary password and writes the list for Blink to send out. */
async function setTempPasswords(db: Db, businesses: Business[], ownerIds: Map<string, string>) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://reviews.blink.sg";
  const rows = [["Business", "Active", "Login email", "Temporary password", "Login page", "Review link"]];
  let set = 0, failed = 0;
  const done = new Map<string, string>();
  for (const b of [...businesses].sort((x, y) => x.name.localeCompare(y.name))) {
    const id = b.ownerEmail ? ownerIds.get(b.ownerEmail) : undefined;
    if (!id) continue;
    let pw = done.get(id);
    if (!pw) {
      pw = newPassword();
      const { error } = await db.auth.admin.updateUserById(id, { password: pw });
      if (error) {
        failed++;
        console.error(`  password failed: ${errorMessage(error)}`);
        continue;
      }
      done.set(id, pw);
      set++;
    }
    rows.push([b.name, b.isActive ? "yes" : "no", b.ownerEmail, pw, `${site}/login`, `${site}/r/${b.id}`]);
  }
  const file = writePrivate("client-logins.csv", rows.map((r) => r.map(csv).join(",")).join("\n") + "\n");
  return { set, failed, file };
}

/** Ensures an auth user per distinct owner email; returns email -> user id. */
async function ensureOwners(db: Db, emails: string[]): Promise<{ ids: Map<string, string>; stats: UserStats }> {
  const ids = await listAllUsers(db);
  const stats: UserStats = { existing: 0, created: 0, failed: 0 };
  for (const email of emails) {
    if (ids.has(email)) {
      stats.existing++;
      continue;
    }
    const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true });
    if (error || !data.user) {
      stats.failed++;
      console.error(`  createUser failed: ${errorMessage(error ?? "no user returned")}`);
      continue;
    }
    ids.set(email, data.user.id);
    stats.created++;
  }
  return { ids, stats };
}

function businessRow(b: Business, ownerIds: Map<string, string>): BusinessInsert {
  return {
    id: b.id,
    owner_id: b.ownerEmail ? (ownerIds.get(b.ownerEmail) ?? null) : null,
    name: b.name,
    owner_email: b.ownerEmail,
    is_active: b.isActive,
    link_expires_at: b.linkExpiresAt,
    created_at: b.createdAt ?? new Date().toISOString(),
    send_email_notifications: b.sendEmailNotifications,
    gating_enabled: b.gatingEnabled,
    config: toJson(b.config),
  };
}

const reviewRow = (r: Review): ReviewInsert => ({
  id: r.id,
  business_id: r.businessId,
  rating: r.rating,
  initial_click: r.initialClick,
  name: r.name,
  email: r.email,
  message: r.message,
  created_at: r.createdAt,
});

const campaignRow = (c: Campaign): AdCampaignInsert => ({
  // Firestore ids are not UUIDs; let Postgres assign one unless it already is.
  ...(isUuid(c.id) ? { id: c.id } : {}),
  title: c.title,
  body: c.body,
  image_url: c.imageUrl,
  link_url: c.linkUrl,
  is_active: c.isActive,
  ...(c.createdAt ? { created_at: c.createdAt } : {}),
});

async function upsertBatches<T extends BusinessInsert | ReviewInsert | AdCampaignInsert>(
  label: string,
  rows: T[],
  write: (batch: T[]) => PromiseLike<{ error: { message: string } | null }>,
): Promise<number> {
  let written = 0;
  for (const batch of chunk(rows, BATCH)) {
    const { error } = await write(batch);
    if (error) throw new Error(`${label} upsert failed after ${written} rows: ${redact(error.message)}`);
    written += batch.length;
    process.stdout.write(`  ${label}: ${written}/${rows.length}\r`);
  }
  if (rows.length) process.stdout.write("\n");
  return written;
}

async function sendInvites(db: Db, emails: string[]): Promise<{ sent: number; failed: number }> {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  const redirectTo = base ? `${base}/auth/callback?next=/dashboard/password` : undefined;
  let sent = 0;
  let failed = 0;
  for (const email of emails) {
    const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      failed++;
      console.error(`  reset email failed: ${errorMessage(error)}`);
    } else {
      sent++;
    }
    process.stdout.write(`  invites: ${sent + failed}/${emails.length}\r`);
    await sleep(INVITE_DELAY_MS);
  }
  if (emails.length) process.stdout.write("\n");
  return { sent, failed };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  loadEnvFile(args.env);

  const data = loadDataset(args.data);
  const ownerEmails = [...new Set(data.businesses.map((b) => b.ownerEmail).filter(Boolean))];
  const logos = localLogoRefs(data.businesses);

  console.log("Export summary");
  console.log(`  businesses:        ${data.businesses.length}`);
  console.log(`  active businesses: ${data.businesses.filter((b) => b.isActive).length}`);
  console.log(`  reviews:           ${data.reviews.length} (skipping ${data.orphanReviews} without a business)`);
  console.log(`  ad campaigns:      ${data.campaigns.length}`);
  console.log(`  distinct owners:   ${ownerEmails.length}`);
  console.log(`  local logo files:  ${logos.present} found, ${logos.missing} missing`);

  if (!args.commit && !args.invite && !args.admin) {
    console.log("\nDry run. Re-run with --commit to import, --invite to send password emails.");
    return;
  }

  const db: Db = createClient<Database>(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (args.admin) {
    console.log("\nSuper admin login");
    console.log(`  saved to ${await ensureAdmin(db, args.admin)} (password not shown here)`);
  }

  if (args.commit) {
    console.log("\nLogo storage bucket");
    console.log(`  ${await ensureBucket(db)}`);
    console.log("\nUploading logos");
    const uploads = await uploadAllLogos(db, data.businesses);
    console.log(`  uploaded ${uploads.uploaded}, missing ${uploads.missing}, failed ${uploads.failed}`);

    console.log("\nEnsuring auth users for owners");
    const owners = await ensureOwners(db, ownerEmails);
    console.log(`  existing ${owners.stats.existing}, created ${owners.stats.created}, failed ${owners.stats.failed}`);

    console.log("\nWriting rows");
    const businessRows = data.businesses.map((b) => businessRow(b, owners.ids));
    const nBusinesses = await upsertBatches("businesses", businessRows, (batch) =>
      db.from("businesses").upsert(batch, { onConflict: "id" }),
    );
    const nReviews = await upsertBatches("reviews", data.reviews.map(reviewRow), (batch) =>
      db.from("reviews").upsert(batch, { onConflict: "id" }),
    );
    const nCampaigns = await upsertBatches("ad_campaigns", data.campaigns.map(campaignRow), (batch) =>
      db.from("ad_campaigns").upsert(batch, { onConflict: "id" }),
    );

    console.log("\nRecomputing counters");
    const { data: recomputed, error } = await db.rpc("recompute_business_stats");
    if (error) throw new Error(`recompute_business_stats: ${redact(error.message)}`);
    console.log(`  recomputed ${recomputed ?? 0} businesses`);

    console.log("\nImport complete");
    console.log(`  businesses ${nBusinesses}, reviews ${nReviews}, campaigns ${nCampaigns}`);
    console.log(`  businesses without an owner account: ${businessRows.filter((r) => !r.owner_id).length}`);

    if (args.tempPasswords) {
      console.log("\nTemporary passwords for owners");
      const t = await setTempPasswords(db, data.businesses, owners.ids);
      console.log(`  set ${t.set}, failed ${t.failed}; list saved to ${t.file} (not shown here)`);
    }
  }

  if (args.invite) {
    const targets = [
      ...new Set(
        data.businesses
          .filter((b) => b.ownerEmail && (args.includeInactive || b.isActive))
          .map((b) => b.ownerEmail),
      ),
    ];
    console.log(`\nSending password emails to ${targets.length} owners (${INVITE_DELAY_MS}ms apart)`);
    const result = await sendInvites(db, targets);
    console.log(`  sent ${result.sent}, failed ${result.failed}`);
  }
}

main().catch((e: unknown) => {
  console.error(`\nFailed: ${errorMessage(e)}`);
  process.exit(1);
});
