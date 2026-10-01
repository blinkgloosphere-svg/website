import { Empty, PageHeader } from "@/components/app/shell";
import { isPreview } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { CampaignForm, DeleteCampaign } from "./campaign-form";

export default async function CampaignsPage() {
  const campaigns = await (await getRepo()).listCampaigns();
  const preview = isPreview();
  return (
    <>
      <PageHeader title="Ad campaigns" description="Announcements shown to every client inside their dashboard." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div>
          {campaigns.length === 0 ? (
            <Empty title="No campaigns" text="Create one on the right. Clients see active campaigns on their dashboard home." />
          ) : (
            <ul className="space-y-3">
              {campaigns.map((c) => (
                <li key={c.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="t-title-3">{c.title}</p>
                      <p className="t-ui mt-1 whitespace-pre-line text-fg-secondary">{c.body}</p>
                      {c.linkUrl ? (
                        <a href={c.linkUrl} target="_blank" rel="noopener" className="t-small mt-2 inline-block text-fg-secondary underline">
                          {c.linkUrl}
                        </a>
                      ) : null}
                      <p className="t-small mt-2 text-fg-tertiary">Created {fmtDate(c.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`badge ${c.isActive ? "badge-success" : "badge-muted"}`}>{c.isActive ? "Active" : "Hidden"}</span>
                      <DeleteCampaign id={c.id} disabled={preview} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card self-start p-5">
          <h2 className="t-title-3 mb-4">New campaign</h2>
          <CampaignForm preview={preview} />
        </div>
      </div>
    </>
  );
}
