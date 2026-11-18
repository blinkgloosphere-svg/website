"use server";

import { getSession } from "@/lib/auth";

/** Called after the signed-in person changes their own password. */
export async function passwordChangedAction(): Promise<void> {
  const user = await getSession();
  if (!user?.email) return;
  try {
    const { sendPasswordChangedEmail } = await import("@/lib/password-notice");
    await sendPasswordChangedEmail(user.email);
  } catch (e) {
    console.error("[password notice]", e);
  }
}
