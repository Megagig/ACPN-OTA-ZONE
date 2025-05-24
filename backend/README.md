# ACPN Ota Zone Authentication System

## Overview

The ACPN Ota Zone authentication system provides a secure, production-grade user authentication experience with the following features:

- Email verification with both a verification link and a 6-digit code
- Multi-provider email sending with Brevo as primary and Resend as fallback
- Admin approval flow for new registrations
- Email notifications for account approvals
- Secure password reset functionality
- Rate limiting to prevent abuse
- Professional email templates

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values with your actual configuration

```bash
cp .env.example .env
```

3. Set up email service providers:
   - Create an account at [Brevo](https://www.brevo.com/) and get an API key
   - Create an account at [Resend](https://resend.com/) and get an API key
   - Add these API keys to your `.env` file

## Authentication Flow

### Registration Process

1. User registers with their details
2. System creates a pending account
3. Verification email is sent with both a link and a 6-digit code
4. User verifies their email using either method
5. Admin must approve the account before user can log in
6. User receives notification when account is approved

### Email Verification Options

- Click on the verification link in the email
- Use the 6-digit code on the verification page

### Password Reset

1. User requests a password reset
2. Email is sent with a password reset link
3. User sets a new password

## Rate Limiting

The system implements rate limiting to prevent abuse:

- Authentication routes: 10 requests per 15 minutes
- Password reset: 3 requests per hour
- Email verification: 5 attempts per hour

## CORS Configuration

The system is configured with the following CORS settings:

- Development: Allows localhost:3000 and localhost:5173
- Production: Allows only acpnotazone.org domains

## Email Templates

Professional email templates are used for:

- Email verification
- Password reset
- Account approval notifications

## Admin Approval

Administrators can approve new accounts through the admin dashboard.
When an account is approved, the user receives an email notification.

## Email Service Implementation

The system uses a dual-provider email delivery strategy:

1. **Primary Provider: Brevo API**

   - Direct API integration using axios for reliable delivery
   - Professional templating with dynamic content

2. **Fallback Provider: Resend**
   - Automatically used if Brevo delivery fails
   - Ensures high availability of email services

The email service handles:

- Email verification with secure tokens and codes
- Password reset communications
- Account approval notifications
