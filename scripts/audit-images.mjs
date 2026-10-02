// Lists every business image (logo, voucher) that is not served from our Supabase storage.
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await db.from("businesses").select("id,name,config");
if (error) throw error;
const rows = [];
for (const b of data) for (const k of ["companyLogoUrl", "voucherImageUrl"]) {
  const u = b.config?.[k];
  if (u && !u.includes("/storage/v1/object/public/")) rows.push({ id: b.id, name: b.name, field: k, url: u });
}
console.log(JSON.stringify(rows, null, 1));
