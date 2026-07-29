import type { EmailMessage, EmailProvider } from "../emailService";

export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage) {
    console.info("[email:console]", {
      to: message.to,
      subject: message.subject,
      template: message.template,
      preview: message.text,
    });
    return { ok: true, provider: "console", skipped: true };
  }
}
