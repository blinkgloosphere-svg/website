"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Notice } from "@/components/app/bits";
import { ConfigFields } from "@/components/app/config-fields";
import { Loader } from "@/components/ui/icons";
import type { Business } from "@/lib/types";
import type { ActionResult } from "@/app/admin/actions";
import { saveMyPageAction, uploadImageAction } from "@/app/dashboard/actions";

export function SettingsForm({ business, preview }: { business: Business; preview: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveMyPageAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Uploads write the resulting URL into the matching text field of the form below.
  function setField(name: string, value: string) {
    const el = formRef.current?.elements.namedItem(name);
    if (el instanceof HTMLInputElement) el.value = value;
  }

  return (
    <form ref={formRef} action={action} className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Uploader kind="logo" label="Logo" current={business.config.companyLogoUrl} disabled={preview} onUploaded={(u) => setField("companyLogoUrl", u)} />
        <Uploader kind="voucher" label="Voucher image" current={business.config.voucherImageUrl} disabled={preview} onUploaded={(u) => setField("voucherImageUrl", u)} />
      </div>

      <ConfigFields config={business.config} disabled={preview} />

      <label className="flex items-start gap-3 text-[14px]">
        <input type="checkbox" name="sendEmailNotifications" defaultChecked={business.sendEmailNotifications} disabled={preview} className="mt-1 size-4 accent-ink" />
        <span>
          <span className="block font-medium">Email me every rating</span>
          <span className="t-small text-fg-tertiary">Private feedback is always emailed to {business.ownerEmail}.</span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || preview} className="btn btn-primary">
          {pending ? <Loader className="size-4 animate-spin" /> : null}
          Save changes
        </button>
        {state ? <Notice kind={state.ok ? "success" : "error"}>{state.ok ? state.message : state.error}</Notice> : null}
        {preview ? <span className="t-small text-fg-tertiary">Editing is disabled in preview mode.</span> : null}
      </div>
    </form>
  );
}

function Uploader({ kind, label, current, disabled, onUploaded }: { kind: "logo" | "voucher"; label: string; current: string | null; disabled: boolean; onUploaded: (url: string) => void }) {
  const [url, setUrl] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadImageAction(kind, fd);
    setBusy(false);
    if (res.ok && res.url) {
      setUrl(res.url);
      onUploaded(res.url);
    } else if (!res.ok) {
      setError(res.error);
    }
  }

  return (
    <div className="card p-4">
      <p className="label">{label}</p>
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-bg-subtle">
          {url ? <Image src={url} alt="" width={80} height={80} className="size-full object-contain" unoptimized /> : <span className="t-small text-fg-tertiary">None</span>}
        </div>
        <div>
          <label className={`btn btn-secondary btn-sm ${disabled || busy ? "pointer-events-none opacity-50" : ""}`}>
            {busy ? <Loader className="size-4 animate-spin" /> : null}
            {url ? "Replace image" : "Upload image"}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={onChange} disabled={disabled || busy} />
          </label>
          <p className="t-small mt-1 text-fg-tertiary">PNG, JPG or SVG, under 3 MB.</p>
          {error ? <p className="t-small text-danger">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
