import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';
import { env } from '#config';
import { logger } from '#utils';
import { EMAIL_SUBJECTS } from './email.constants.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, 'templates');

class EmailService {
  private resend: Resend;
  private templateCache = new Map<string, string>();

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  /**
   * Reads an HTML template with in-memory caching to avoid repeated disk I/O
   */
  private async loadTemplate(templateName: string): Promise<string> {
    const cached = this.templateCache.get(templateName);
    if (cached) return cached;

    const filePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
    const content = await fs.readFile(filePath, 'utf-8');
    this.templateCache.set(templateName, content);
    return content;
  }

  /**
   * Replaces dynamic template placeholders: {{name}}, {{actionUrl}}, {{year}}
   */
  private compileTemplate(
    templateHtml: string,
    variables: { name: string; actionUrl: string },
  ): string {
    const currentYear = new Date().getFullYear().toString();
    return templateHtml
      .replaceAll('{{name}}', variables.name)
      .replaceAll('{{actionUrl}}', variables.actionUrl)
      .replaceAll('{{year}}', currentYear);
  }

  /**
   * Sends an email via Resend or logs it locally in development mode
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    actionUrl: string;
  }): Promise<void> {
    const isMockKey = env.RESEND_API_KEY.startsWith('test_');

    // Local Development Fallback: Log email details and clickable URL to console
    if (isMockKey) {
      logger.info(
        `📧 [DEV EMAIL SENT] To: ${options.to} | Subject: "${options.subject}" | Link: ${options.actionUrl}`,
      );
      return;
    }

    // Production: Deliver via Resend API
    const response = await this.resend.emails.send({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (response.error) {
      logger.error('Failed to send email via Resend:', response.error);
      throw new Error(`Email delivery failed: ${response.error.message}`);
    }
  }

  /**
   * Sends verification email with a 24-hour verification link
   */
  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const actionUrl = `${env.AUTH_OIDC_ISSUER}/auth/verify-email/${token}`;
    const rawTemplate = await this.loadTemplate('verify-email');
    const html = this.compileTemplate(rawTemplate, { name, actionUrl });

    await this.sendEmail({
      to,
      subject: EMAIL_SUBJECTS.VERIFY_EMAIL,
      html,
      actionUrl,
    });
  }

  /**
   * Sends password reset email with a 15-minute reset link
   */
  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const actionUrl = `${env.AUTH_OIDC_ISSUER}/auth/reset-password/${token}`;
    const rawTemplate = await this.loadTemplate('password-reset');
    const html = this.compileTemplate(rawTemplate, { name, actionUrl });

    await this.sendEmail({
      to,
      subject: EMAIL_SUBJECTS.PASSWORD_RESET,
      html,
      actionUrl,
    });
  }
}

export const emailService = new EmailService();
