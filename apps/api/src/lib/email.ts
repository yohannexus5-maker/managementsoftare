interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
}

/**
 * Dev-mode email stub: logs instead of sending. Swap the body of this
 * function for a real provider call (SendGrid/SES) when credentials are
 * available — every caller goes through `notify()` in lib/notify.ts, so
 * this is the only place that needs to change.
 */
export async function sendEmail({ to, subject, text }: SendEmailParams): Promise<void> {
  console.log(`[email:dev-stub] to=${to} subject="${subject}" text="${text}"`);
}
