import { PageHeader } from "@/components/app/shell";
import { PasswordForm } from "./password-form";

export const metadata = { title: "Set password" };

export default function PasswordPage() {
  return (
    <>
      <PageHeader title="Set your password" description="Choose a password for your Blink login. You can change it any time from this page." />
      <div className="card max-w-md p-6">
        <PasswordForm />
      </div>
    </>
  );
}
