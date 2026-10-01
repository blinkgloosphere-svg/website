import Link from "next/link";
import { PageHeader } from "@/components/app/shell";
import { isPreview, requireOwnerBusiness } from "@/lib/auth";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const business = (await requireOwnerBusiness())!;
  return (
    <>
      <PageHeader
        title="Review page"
        description="What customers see after they scan. Changes go live immediately."
        actions={
          <Link href={`/r/${business.id}`} target="_blank" className="btn btn-secondary btn-sm">
            Preview page
          </Link>
        }
      />
      <div className="card max-w-3xl p-6">
        <SettingsForm business={business} preview={isPreview()} />
      </div>
    </>
  );
}
