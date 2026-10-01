import { PageHeader } from "@/components/app/shell";
import { isPreview } from "@/lib/auth";
import { NewBusinessForm } from "./new-form";

export default function NewBusinessPage() {
  return (
    <>
      <PageHeader title="New business" description="Creates the review page, the owner login and a 12-month subscription in one step." />
      <div className="card max-w-2xl p-6">
        <NewBusinessForm preview={isPreview()} />
      </div>
    </>
  );
}
