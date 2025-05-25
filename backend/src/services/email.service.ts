import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import axios from 'axios';

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
  private brevoApiKey: string;
  private resendClient: Resend;
  private gmailTransporter: nodemailer.Transporter | null = null;
  private sender: { name: string; email: string };
  private templatesDir: string;

  constructor() {
    // Initialize Brevo API key
    this.brevoApiKey = process.env.BREVO_API_KEY || 'default-api-key';

    // Initialize Resend client (fallback)
    this.resendClient = new Resend(process.env.RESEND_API_KEY);

    // Set default sender - use verified email for Resend
    this.sender = {
      name: process.env.BREVO_FROM_NAME || 'ACPN Ota Zone',
      email: 'admin@megagigsolution.com', // Verified email for Resend
    };

    // Initialize Gmail SMTP transporter (third fallback)
    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      this.gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS, // Use App Password for Gmail
        },
      });
    }

    // Set templates directory
    this.templatesDir = path.resolve(__dirname, '../templates');

    // Log email configuration for debugging
    console.log('Email Service Configuration:', {
      brevoApiKey: this.brevoApiKey ? 'Set (hidden for security)' : 'Not set',
      resendApiKey: process.env.RESEND_API_KEY
        ? 'Set (hidden for security)'
        : 'Not set',
      gmailConfigured: !!this.gmailTransporter,
      sender: this.sender,
      templatesDir: this.templatesDir,
    });
  }

  /**
   * Send email using Brevo with fallback to Resend
   * @param options Email options
   * @returns Promise<boolean>
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // If template is provided, compile it
      let html = options.html || '';
      let text = options.text || '';

      if (options.template && options.context) {
        try {
          html = await this.compileTemplate(options.template, options.context);
          // Generate text from HTML if no text provided
          if (!text) {
            text = html
              .replace(/<[^>]*>/g, '')
              .replace(/\s+/g, ' ')
              .trim();
          }
        } catch (templateError) {
          console.error('Template compilation failed:', templateError);
          throw new Error(
            `Failed to compile email template: ${options.template}`
          );
        }
      }

      console.log('Attempting to send email:', {
        to: options.to,
        subject: options.subject,
        hasHtml: !!html,
        hasText: !!text,
        template: options.template,
      });

      // Try to send with Brevo first
      try {
        const brevoResult = await this.sendWithBrevo({
          to: options.to,
          subject: options.subject,
          text,
          html,
        });
        console.log('Email sent successfully with Brevo');
        return brevoResult;
      } catch (brevoError) {
        console.error('Brevo email sending failed, trying Resend:', brevoError);

        // Fallback to Resend
        try {
          const resendResult = await this.sendWithResend({
            to: options.to,
            subject: options.subject,
            text,
            html,
          });
          console.log('Email sent successfully with Resend fallback');
          return resendResult;
        } catch (resendError) {
          console.error(
            'Resend email sending failed, trying Gmail:',
            resendError
          );

          // Final fallback to Gmail SMTP
          const gmailResult = await this.sendWithGmail({
            to: options.to,
            subject: options.subject,
            text,
            html,
          });
          console.log('Email sent successfully with Gmail fallback');
          return gmailResult;
        }
      }
    } catch (error) {
      console.error('Email sending completely failed:', error);
      return false;
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
    if (!this.brevoApiKey || this.brevoApiKey === 'default-api-key') {
      throw new Error('Brevo API key not configured');
    }

    console.log('Sending email with Brevo:', {
      to: options.to,
      subject: options.subject,
      sender: this.sender,
    });

    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            name: this.sender.name,
            email: this.sender.email, // Using verified email
          },
          to: [{ email: options.to }],
          subject: options.subject,
          textContent: options.text,
          htmlContent: options.html,
        },
        {
          headers: {
            'api-key': this.brevoApiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log('Brevo API response:', {
        status: response.status,
        messageId: response.data?.messageId,
      });

      return response.status >= 200 && response.status < 300;
    } catch (error: any) {
      console.error('Error sending email with Brevo:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
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
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Resend API key not configured');
    }

    console.log('Sending email with Resend:', {
      to: options.to,
      subject: options.subject,
      from: `${this.sender.name} <${this.sender.email}>`,
    });

    try {
      const response = await this.resendClient.emails.send({
        from: `${this.sender.name} <${this.sender.email}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log('Resend email response:', {
        id: response.data?.id,
        error: response.error,
      });

      if (response.error) {
        throw new Error(`Resend API error: ${response.error.message}`);
      }

      return true;
    } catch (error: any) {
      console.error('Error sending email with Resend:', {
        message: error.message,
        name: error.name,
      });
      throw error;
    }
  }

  /**
   * Send email using Gmail SMTP (final fallback)
   * @param options Email options
   * @returns Promise<boolean>
   * @private
   */
  private async sendWithGmail(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<boolean> {
    if (!this.gmailTransporter) {
      throw new Error('Gmail SMTP not configured');
    }

    console.log('Sending email with Gmail SMTP:', {
      to: options.to,
      subject: options.subject,
      from: `${this.sender.name} <${this.sender.email}>`,
    });

    try {
      const result = await this.gmailTransporter.sendMail({
        from: `${this.sender.name} <${this.sender.email}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log('Gmail SMTP response:', {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
      });

      return result.accepted.length > 0;
    } catch (error: any) {
      console.error('Error sending email with Gmail SMTP:', {
        message: error.message,
        name: error.name,
      });
      throw error;
    }
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
