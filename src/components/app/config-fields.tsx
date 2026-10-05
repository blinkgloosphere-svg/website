"use client";

import { Field } from "@/components/app/bits";
import { ImageDrop } from "@/components/app/image-drop";
import { ReviewLinkField } from "@/components/app/review-link-field";
import type { BusinessConfig } from "@/lib/types";
import type { UploadResult } from "@/lib/upload-image";

type Props = {
  config: BusinessConfig;
  disabled?: boolean;
  /** Stores a dropped logo or voucher for this business (admin or owner action). */
  uploadImage: (kind: "logo" | "voucher", fd: FormData) => Promise<UploadResult>;
};

/** The review-page settings form, shared by the admin and the client dashboard. */
export function ConfigFields({ config, disabled, uploadImage }: Props) {
  const social = (type: string) => config.socialLinks.find((s) => s.type === type)?.url ?? "";
  return (
    <div className="space-y-8">
      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="t-title-3 mb-2">Branding</legend>
        <Field label="Company name shown to customers" htmlFor="companyName">
          <input id="companyName" name="companyName" className="input" defaultValue={config.companyName} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageDrop
            name="companyLogoUrl"
            label="Logo"
            hint="Shown at the top of the review page."
            initial={config.companyLogoUrl}
            disabled={disabled}
            upload={(fd) => uploadImage("logo", fd)}
          />
          <ImageDrop
            name="voucherImageUrl"
            label="Voucher (optional)"
            hint="Shown after a 4 or 5 star rating."
            initial={config.voucherImageUrl}
            disabled={disabled}
            upload={(fd) => uploadImage("voucher", fd)}
          />
        </div>
        <ReviewLinkField initial={config.reviewLink} disabled={disabled} />
      </fieldset>

      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="t-title-3 mb-2">Rating screen</legend>
        <Field label="Headline" htmlFor="mainHeadline">
          <input id="mainHeadline" name="mainHeadline" className="input" defaultValue={config.mainHeadline} required />
        </Field>
        <Field label="Subheading" htmlFor="mainSubhead">
          <input id="mainSubhead" name="mainSubhead" className="input" defaultValue={config.mainSubhead} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="t-title-3 mb-2">After a 4 or 5 star rating</legend>
        <Field label="Headline" htmlFor="positiveHeadline">
          <input id="positiveHeadline" name="positiveHeadline" className="input" defaultValue={config.positiveHeadline} required />
        </Field>
        <Field label="Subheading" htmlFor="positiveSubhead">
          <input id="positiveSubhead" name="positiveSubhead" className="input" defaultValue={config.positiveSubhead} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="t-title-3 mb-2">After a 1 to 3 star rating</legend>
        <Field label="Headline" htmlFor="negativeHeadline">
          <input id="negativeHeadline" name="negativeHeadline" className="input" defaultValue={config.negativeHeadline} required />
        </Field>
        <Field label="Subheading" htmlFor="negativeSubhead">
          <input id="negativeSubhead" name="negativeSubhead" className="input" defaultValue={config.negativeSubhead} />
        </Field>
        <Field label="Thank-you message after feedback is sent" htmlFor="feedbackSuccessText">
          <input id="feedbackSuccessText" name="feedbackSuccessText" className="input" defaultValue={config.feedbackSuccessText} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="t-title-3 mb-2">Social links</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Facebook" htmlFor="facebook">
            <input id="facebook" name="facebook" className="input" defaultValue={social("facebook")} placeholder="https://facebook.com/…" />
          </Field>
          <Field label="Instagram" htmlFor="instagram">
            <input id="instagram" name="instagram" className="input" defaultValue={social("instagram")} placeholder="https://instagram.com/…" />
          </Field>
          <Field label="Website" htmlFor="website">
            <input id="website" name="website" className="input" defaultValue={social("website")} placeholder="https://…" />
          </Field>
        </div>
      </fieldset>
    </div>
  );
}
