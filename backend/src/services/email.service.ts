import nodemailer from 'nodemailer';
import { TransactionalEmailsApi, SendSmtpEmail } from 'sib-api-v3-typescript';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

/**
 * Email service interface
 */
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: Record<string, any>;
}

/**
 * Email service for sending emails using Brevo as primary provider
 * and Resend as fallback
 */
class EmailService {
  private brevoClient: TransactionalEmailsApi;
  private resendClient: Resend;
  private sender: { name: string; email: string };
  private templatesDir: string;

  constructor() {
    // Initialize Brevo client
    this.brevoClient = new TransactionalEmailsApi();
    this.brevoClient.setApiKey(
      process.env.BREVO_API_KEY || 'default-api-key'
    );

    // Initialize Resend client (fallback)
    this.resendClient = new Resend(process.env.RESEND_API_KEY);

    // Set default sender
    this.sender = {
      name: process.env.EMAIL_FROM_NAME || 'ACPN Ota Zone',
      email: process.env.EMAIL_FROM || 'no-reply@acpnotazone.org',
    };

    // Set templates directory
    this.templatesDir = path.resolve(__dirname, '../templates');
  }

  /**
   * Send email using Brevo with fallback to Resend
   * @param options Email options
   * @returns Promise<boolean>
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // If template is provided, compile it
      let html = options.html;
      if (options.template && options.context) {
        html = await this.compileTemplate(options.template, options.context);
      }

      // Try to send with Brevo first
      return await this.sendWithBrevo({
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: html || '',
      });
    } catch (error) {
      console.error('Brevo email sending failed, trying Resend:', error);
      try {
        // Fallback to Resend
        return await this.sendWithResend({
          to: options.to,
          subject: options.subject,
          text: options.text || '',
          html: options.html || '',
        });
      } catch (fallbackError) {
        console.error('Both email providers failed:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Send email using Brevo
   * @param options Email options
   * @returns Promise<boolean>
   * @private
   */
  private async sendWithBrevo(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<boolean> {
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.sender = this.sender;
    sendSmtpEmail.to = [{ email: options.to }];
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.textContent = options.text;
    sendSmtpEmail.htmlContent = options.html;

    await this.brevoClient.sendTransacEmail(sendSmtpEmail);
    return true;
  }

  /**
   * Send email using Resend (fallback)
   * @param options Email options
   * @returns Promise<boolean>
   * @private
   */
  private async sendWithResend(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<boolean> {
    await this.resendClient.emails.send({
      from: `${this.sender.name} <${this.sender.email}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return true;
  }

  /**
   * Compile a handlebars template
   * @param templateName Template name (without extension)
   * @param context Template context data
   * @returns Promise<string> Compiled HTML
   * @private
   */
  private async compileTemplate(
    templateName: string,
    context: Record<string, any>
  ): Promise<string> {
    const filePath = path.join(this.templatesDir, `${templateName}.hbs`);
    
    try {
      const template = fs.readFileSync(filePath, 'utf8');
      const compiledTemplate = handlebars.compile(template);
      return compiledTemplate(context);
    } catch (error) {
      console.error(`Error compiling template ${templateName}:`, error);
      throw new Error(`Error compiling template ${templateName}`);
    }
  }

  /**
   * Send verification email with both link and 6-digit code
   * @param email User's email
   * @param name User's name
   * @param verificationToken Verification token
   * @param verificationCode 6-digit verification code
   * @returns Promise<boolean>
   */
  async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
    verificationCode: string
  ): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Verify Your ACPN Ota Zone Account',
      template: 'email-verification',
      context: {
        name,
        verificationUrl,
        verificationCode,
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send password reset email
   * @param email User's email
   * @param name User's name
   * @param resetToken Reset token
   * @returns Promise<boolean>
   */
  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Reset Your ACPN Ota Zone Password',
      template: 'password-reset',
      context: {
        name,
        resetUrl,
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send account approval notification
   * @param email User's email
   * @param name User's name
   * @returns Promise<boolean>
   */
  async sendAccountApprovalEmail(
    email: string,
    name: string
  ): Promise<boolean> {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    
    return this.sendEmail({
      to: email,
      subject: 'Your ACPN Ota Zone Account Has Been Approved',
      template: 'account-approval',
      context: {
        name,
        loginUrl,
        year: new Date().getFullYear(),
      },
    });
  }
}

// Create and export singleton instance
const emailService = new EmailService();
export default emailService;
