import Link from "next/link";
import { getSession, isAdminUser } from "@/lib/auth";
import { AuthCard } from "../auth-card";
import { SetPasswordForm } from "./set-password-form";

export const metadata = { title: "Set password" };
export const dynamic = "force-dynamic";

/** Choose a new password after an email link. Works for business owners and admins alike. */
export default async function SetPasswordPage() {
  const user = await getSession();
  if (!user) {
    return (
      <AuthCard title="Link needed" description="Open the link from your email again, or ask for a new one.">
        <Link href="/login" className="btn btn-primary w-full">
          Go to login
        </Link>
      </AuthCard>
    );
  }
  const after = (await isAdminUser(user.id)) ? "/admin" : "/dashboard";
  return (
    <AuthCard title="Choose your password" description={user.email ?? undefined}>
      <SetPasswordForm after={after} />
    </AuthCard>
  );
}
