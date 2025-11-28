// lib/mailer.ts
import nodemailer from "nodemailer";

export function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, MAIL_FROM, MAIL_APP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !MAIL_FROM || !MAIL_APP_PASSWORD) {
    throw new Error("SMTP env not configured");
  }

  const port = Number(SMTP_PORT);
  const secure = port === 465;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    requireTLS: !secure,
    auth: { user: MAIL_FROM, pass: MAIL_APP_PASSWORD },
    // name: "gonsters.com",
    tls: { servername: SMTP_HOST },
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  });
}
