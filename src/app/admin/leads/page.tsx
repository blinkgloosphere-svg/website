import { Empty, PageHeader } from "@/components/app/shell";
import { isPreview } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import { LeadRow } from "./lead-row";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const sp = await searchParams;
  const leads = await (await getRepo()).listLeads();
  const shown = sp.s ? leads.filter((l) => l.status === sp.s) : leads;
  const counts = { new: 0, contacted: 0, won: 0, lost: 0 } as Record<string, number>;
  for (const l of leads) counts[l.status] = (counts[l.status] ?? 0) + 1;

  return (
    <>
      <PageHeader title="Leads" description="People who used the free tools and agreed to be contacted." />
      <div className="mb-4 flex flex-wrap gap-1">
        {[
          ["", `All (${leads.length})`],
          ["new", `New (${counts.new})`],
          ["contacted", `Contacted (${counts.contacted})`],
          ["won", `Won (${counts.won})`],
          ["lost", `Lost (${counts.lost})`],
        ].map(([k, label]) => (
          <a key={k} href={k ? `/admin/leads?s=${k}` : "/admin/leads"} className={`btn btn-sm ${(sp.s ?? "") === k ? "btn-primary" : "btn-secondary"}`}>
            {label}
          </a>
        ))}
      </div>
      {shown.length === 0 ? (
        <Empty title="No leads yet" text={isPreview() ? "Leads are stored once Supabase is connected." : "Leads appear here the moment someone uses a tool and leaves their details."} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table min-w-[900px]">
            <thead>
              <tr>
                <th>When</th>
                <th>Business</th>
                <th>Contact</th>
                <th>Tool</th>
                <th>Numbers</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => (
                <LeadRow key={l.id} lead={l} when={fmtDateTime(l.createdAt)} preview={isPreview()} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
