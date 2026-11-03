import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { Transporter } from "nodemailer";
import { env } from "@/lib/config/env";

export {
  emailVerificationMailContent,
  passwordResetMailContent,
  projectActivatedMailContent,
  projectApprovedMailContent,
  projectCreatedMailContent,
  projectDeactivatedMailContent,
  projectDeletedMailContent,
  projectInviteMailContent,
  projectRejectedMailContent,
  reportReadyMailContent,
  userActivatedMailContent,
  userDeactivatedMailContent,
} from "@/lib/mail/templates";
export type { TMailContent } from "@/lib/mail/templates";

let transporter: Transporter | null = null;

function smtpTransportOptions(): SMTPTransport.Options {
  const port = env.smtpPort();
  const secure = port === 465;

  return {
    host: env.smtpHost(),
    port,
    secure,
    requireTLS: !secure,
    auth: {
      user: env.smtpUser(),
      pass: env.smtpPass(),
    },
  };
}

function getTransporter(): Transporter | null {
  if (!env.smtpConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport(smtpTransportOptions());
  }

  return transporter;
}

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

export type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: MailAttachment[];
};

/**
 * Sends one message. Resolves `true` when SMTP accepted it, `false` when no SMTP transport is
 * configured (the message is only logged). Throws when SMTP rejects the message.
 */
export async function sendMail(payload: MailPayload): Promise<boolean> {
  const from = `"${env.mailFromName()}" <${env.mailFrom()}>`;
  const transport = getTransporter();
  const { attachments, ...message } = payload;

  if (!transport) {
    console.info("[mail] SMTP not configured, message not sent:", {
      from,
      ...message,
      attachments: attachments?.map((attachment) => attachment.filename),
    });
    return false;
  }

  try {
    await transport.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html ?? message.text.replace(/\n/g, "<br>"),
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });
    return true;
  } catch (error) {
    console.error("[mail] SMTP send failed:", error);
    throw error;
  }
}
