/** Stand-in for the resend package while it is not installed. Emails are skipped until RESEND_API_KEY is set anyway. */
export class Resend {
  constructor(_key?: string) {
    void _key;
  }
  emails = {
    send: async (): Promise<{ error: { message: string } }> => ({ error: { message: "Resend is not installed. Run: npm install resend" } }),
  };
}
