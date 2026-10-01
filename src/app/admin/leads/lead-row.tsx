"use client";

import { useState, useTransition } from "react";
import type { Lead, LeadStatus } from "@/lib/types";
import { updateLeadAction } from "@/app/admin/actions";

export function LeadRow({ lead, when, preview }: { lead: Lead; when: string; preview: boolean }) {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [pending, start] = useTransition();
  const phone = lead.phone.replace(/[^0-9]/g, "");
  return (
    <tr>
      <td className="whitespace-nowrap text-fg-secondary">{when}</td>
      <td>
        <div className="font-medium">{lead.businessName}</div>
        {lead.reviewLink ? (
          <a href={lead.reviewLink} target="_blank" rel="noopener" className="t-small text-fg-tertiary hover:underline">
            Google review link
          </a>
        ) : null}
      </td>
      <td>
        <div>{lead.contactName}</div>
        <div className="t-small flex gap-2 text-fg-tertiary">
          <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener" className="hover:underline">
            {lead.phone}
          </a>
          <a href={`mailto:${lead.email}`} className="hover:underline">
            {lead.email}
          </a>
        </div>
      </td>
      <td>
        <span className="badge">{lead.tool === "qr" ? "QR generator" : "Calculator"}</span>
      </td>
      <td className="t-small text-fg-secondary">
        {lead.currentRating != null ? `${lead.currentRating}★ · ${lead.currentCount ?? 0} reviews` : "–"}
        {lead.targetRating != null ? <div>Target {lead.targetRating}★ · needs {lead.reviewsNeeded ?? "–"}</div> : null}
      </td>
      <td>
        <select
          className="select h-8 w-32 py-0 text-[13px]"
          value={status}
          disabled={preview || pending}
          onChange={(e) => {
            const next = e.target.value as LeadStatus;
            setStatus(next);
            start(async () => {
              await updateLeadAction(lead.id, next);
            });
          }}
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </td>
    </tr>
  );
}
