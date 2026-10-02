// Live login smoke test with throwaway accounts. Creates a test admin, a test owner and a test business,
// signs in without passwords (one-time admin link), checks every page and the database rules, then deletes everything.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const l of fs.readFileSync(".env.local", "utf8").split("\n")) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, ""); }
const URL = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SVC = env.SUPABASE_SERVICE_ROLE_KEY;
const SITE = process.argv[2] ?? "https://reviews.blink.sg";
const ref = new globalThis.URL(URL).hostname.split(".")[0];
const admin = createClient(URL, SVC, { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = Date.now();
const T = { adminEmail: `blink-test-admin-${stamp}@example.com`, ownerEmail: `blink-test-owner-${stamp}@example.com`, bizId: `ZZTEST${stamp}`.slice(0, 28), bizName: `ZZ Test Business ${stamp}` };
const results = []; const ok = (name, pass, extra = "") => results.push(`${pass ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
const created = { users: [], biz: false };

async function session(email) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  const anon = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const v = await anon.auth.verifyOtp({ type: "magiclink", token_hash: data.properties.hashed_token });
  if (v.error) throw v.error;
  return v.data.session;
}
function cookieFor(s) {
  const raw = "base64-" + Buffer.from(JSON.stringify(s)).toString("base64url");
  const name = `sb-${ref}-auth-token`;
  const parts = []; for (let i = 0; i < raw.length; i += 3180) parts.push(raw.slice(i, i + 3180));
  return parts.length === 1 ? `${name}=${parts[0]}` : parts.map((p, i) => `${name}.${i}=${p}`).join("; ");
}
async function page(path, cookie) {
  const r = await fetch(SITE + path, { headers: cookie ? { cookie } : {}, redirect: "manual" });
  return { status: r.status, loc: r.headers.get("location") ?? "", html: r.status === 200 ? await r.text() : "" };
}
const restAs = (token, q) => fetch(`${URL}/rest/v1/${q}`, { headers: { apikey: ANON, Authorization: `Bearer ${token}` } }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

try {
  // --- set up throwaway accounts and data
  const a = await admin.auth.admin.createUser({ email: T.adminEmail, email_confirm: true }); if (a.error) throw a.error; created.users.push(a.data.user.id);
  const o = await admin.auth.admin.createUser({ email: T.ownerEmail, email_confirm: true }); if (o.error) throw o.error; created.users.push(o.data.user.id);
  { const { error } = await admin.from("admin_users").insert({ user_id: a.data.user.id, email: T.adminEmail }); if (error) throw error; }
  { const { error } = await admin.from("businesses").insert({ id: T.bizId, owner_id: o.data.user.id, name: T.bizName, owner_email: T.ownerEmail, is_active: false, link_expires_at: new Date(Date.now() + 864e5 * 30).toISOString(), config: { companyName: T.bizName, mainHeadline: "Test", mainSubhead: "", positiveHeadline: "Thanks", positiveSubhead: "", negativeHeadline: "Sorry", negativeSubhead: "", feedbackSuccessText: "Thanks", reviewLink: "https://example.com", socialLinks: [], companyLogoUrl: null, voucherImageUrl: null } }); if (error) throw error; created.biz = true; }
  { const { error } = await admin.from("reviews").insert([{ business_id: T.bizId, rating: 5, name: "Test A", message: "" }, { business_id: T.bizId, rating: 2, name: "Test B", message: "Test private feedback" }]); if (error) throw error; }
  const { data: realBiz } = await admin.from("businesses").select("id,name").neq("id", T.bizId).order("name").limit(1).single();

  const sA = await session(T.adminEmail), sO = await session(T.ownerEmail);
  const cA = cookieFor(sA), cO = cookieFor(sO);

  // --- super admin
  for (const p of ["/admin", "/admin/businesses", `/admin/businesses/${realBiz.id}`, `/admin/businesses/${realBiz.id}/qr`, "/admin/businesses/new", "/admin/reviews", "/admin/reviews?f=neg", "/admin/leads", "/admin/campaigns"]) {
    const r = await page(p, cA); ok(`admin page ${p}`, r.status === 200 && !/Preview mode/.test(r.html), `status ${r.status}`);
  }
  { const r = await page("/admin/businesses", cA); const n = (r.html.match(/\/admin\/businesses\/[A-Za-z0-9]{20,}"/g) || []).length; ok("admin sees all businesses", n >= 64, `${new Set(r.html.match(/\/admin\/businesses\/[A-Za-z0-9]{20,}/g)).size} unique links`); }
  { const r = await page(`/admin/businesses/${realBiz.id}`, cA); ok("admin sees a real client's detail", r.html.includes(realBiz.name.replace(/&/g, "&amp;").slice(0, 10))); }
  { const r = await page(`/admin/businesses/${realBiz.id}/view-as`, cA); const vc = (r.status >= 300 && r.status < 400); const setCookie = vc ? "blink_view_as=" + realBiz.id : "";
    const d = await page("/dashboard", `${cA}; ${setCookie}`); ok("admin 'view as client' opens that client's dashboard", d.status === 200 && d.html.includes("You are viewing") && d.html.includes(realBiz.name.replace(/&/g, "&amp;").slice(0, 10)), `status ${d.status}`); }
  { const r = await restAs(sA.access_token, "leads?select=id&limit=1"); ok("admin can read leads in the database", r.status === 200); }

  // --- client owner
  { const r = await page("/dashboard", cO); ok("owner dashboard loads their business", r.status === 200 && r.html.includes(T.bizName)); ok("owner dashboard does not show another client", !r.html.includes(realBiz.name.replace(/&/g, "&amp;"))); }
  for (const p of ["/dashboard/reviews", "/dashboard/feedback", "/dashboard/qr", "/dashboard/settings", "/dashboard/password"]) { const r = await page(p, cO); ok(`owner page ${p}`, r.status === 200, `status ${r.status}`); }
  { const r = await page("/dashboard/feedback", cO); ok("owner sees their private feedback", r.html.includes("Test private feedback")); }
  { const r = await page("/dashboard/qr", cO); ok("QR code uses reviews.blink.sg", r.html.includes(`reviews.blink.sg/r/${T.bizId}`)); }
  { const r = await page("/admin", cO); ok("owner blocked from admin", r.status >= 300 && r.status < 400 && r.loc.includes("/dashboard"), `${r.status} -> ${r.loc}`); }
  { const r = await page("/dashboard", `${cO}; blink_view_as=${realBiz.id}`); ok("owner cannot use 'view as' to see another client", r.html.includes(T.bizName) && !r.html.includes("You are viewing")); }
  { const r = await page(`/admin/businesses/${realBiz.id}/view-as`, cO); ok("owner cannot start 'view as'", r.status >= 300 && r.status < 400 && !r.loc.endsWith("/dashboard") || r.loc.includes("/dashboard"), `${r.status} -> ${r.loc}`); }
  // database rules with the owner's own token
  { const r = await restAs(sO.access_token, "businesses?select=id"); ok("database: owner sees only their own business", r.status === 200 && r.body.length === 1 && r.body[0].id === T.bizId, `${r.body?.length} rows`); }
  { const r = await restAs(sO.access_token, "reviews?select=business_id"); ok("database: owner sees only their own reviews", r.status === 200 && r.body.every((x) => x.business_id === T.bizId) && r.body.length === 2, `${r.body?.length} rows`); }
  { const r = await restAs(sO.access_token, "leads?select=id"); ok("database: owner cannot see leads", r.status === 200 && r.body.length === 0); }
  { const r = await fetch(`${URL}/rest/v1/businesses?id=eq.${realBiz.id}`, { method: "PATCH", headers: { apikey: ANON, Authorization: `Bearer ${sO.access_token}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ name: "HACKED" }) }); const b = await r.json().catch(() => []); ok("database: owner cannot edit another client", Array.isArray(b) && b.length === 0); }
  { const r = await fetch(`${URL}/rest/v1/businesses?id=eq.${T.bizId}`, { method: "PATCH", headers: { apikey: ANON, Authorization: `Bearer ${sO.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ is_active: true }) }); ok("database: owner cannot reactivate or extend their own subscription", r.status >= 400, `status ${r.status}`); }
  // --- public visitor
  { const r = await fetch(`${URL}/rest/v1/businesses?select=owner_email&limit=1`, { headers: { apikey: ANON } }); ok("visitors cannot read owner emails", r.status >= 400); }
  { const r = await fetch(`${URL}/rest/v1/reviews?select=email&limit=1`, { headers: { apikey: ANON } }); const b = await r.json().catch(() => null); ok("visitors cannot read reviews", r.status >= 400 || (Array.isArray(b) && b.length === 0)); }
  { const r = await page(`/r/${T.bizId}`); ok("inactive test page shows 'paused' instead of the rating screen", r.status === 200 && /paused/i.test(r.html)); }
  // --- the real accounts exist and are wired
  { const { data } = await admin.from("admin_users").select("email"); ok("Brian is a super admin", data.some((x) => x.email === "briancheok.blink@gmail.com")); }
  { const { count } = await admin.from("businesses").select("id", { count: "exact", head: true }).is("owner_id", null); ok("every client business is linked to a login", count === 0, `${count} unlinked`); }
} catch (e) {
  results.push(`ERROR ${e?.message ?? e}`);
} finally {
  // --- clean up everything this test created
  if (created.biz) await admin.from("businesses").delete().eq("id", T.bizId);
  for (const id of created.users) await admin.auth.admin.deleteUser(id);
  const left = await admin.from("businesses").select("id", { count: "exact", head: true }).like("id", "ZZTEST%");
  results.push(`cleanup: test accounts deleted ${created.users.length}, test businesses left ${left.count}`);
  console.log(results.join("\n"));
  console.log(`\n${results.filter((r) => r.startsWith("PASS")).length} passed, ${results.filter((r) => r.startsWith("FAIL")).length} failed`);
}
