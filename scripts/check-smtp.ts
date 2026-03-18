import dotenv from "dotenv";
import {
  getEmailTransportDiagnostics,
  sendTestEmail,
  verifyEmailTransport,
} from "../server/emailService";

dotenv.config();

function parseBoolean(value: string | undefined): boolean {
  return value === "1" || value === "true";
}

async function main() {
  const diagnostics = getEmailTransportDiagnostics();
  const shouldSendTestEmail = parseBoolean(process.env.SMTP_CHECK_SEND_TEST_EMAIL);
  const recipient = process.env.SMTP_CHECK_RECIPIENT?.trim() || undefined;

  console.log(
    JSON.stringify({
      event: "smtp_diagnostics",
      diagnostics,
      willSendTestEmail: shouldSendTestEmail,
      recipientConfigured: Boolean(recipient),
    }),
  );

  const verified = await verifyEmailTransport();
  if (!verified) {
    throw new Error("SMTP transport verification failed.");
  }

  if (shouldSendTestEmail) {
    await sendTestEmail(recipient);
    console.log(
      JSON.stringify({
        event: "smtp_test_email_sent",
        recipient: recipient ?? process.env.ADMIN_EMAIL ?? process.env.EMAIL_USER ?? null,
      }),
    );
  } else {
    console.log(JSON.stringify({ event: "smtp_transport_verified" }));
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: "smtp_healthcheck_failed",
      message: error instanceof Error ? error.message : "Unknown error",
    }),
  );
  process.exit(1);
});
