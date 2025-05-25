const { Resend } = require('resend');

async function testResend() {
  const resend = new Resend('re_WN19982L_6PFyguCQEG76fxMk8Av31Hzq');

  try {
    console.log('Testing Resend with verified domain...');

    const response = await resend.emails.send({
      from: 'ACPN Ota Zone <admin@megagigsolution.com>',
      to: 'megagigsolution@gmail.com',
      subject: 'Test Email from ACPN Ota Zone',
      html: '<h1>Test Email</h1><p>This is a test email to verify email sending works.</p>',
      text: 'Test Email - This is a test email to verify email sending works.',
    });

    console.log('Resend Response:', response);

    if (response.error) {
      console.error('Resend Error:', response.error);
    } else {
      console.log('✅ Email sent successfully with Resend!');
      console.log('Message ID:', response.data?.id);
    }
  } catch (error) {
    console.error('❌ Error testing Resend:', error);
  }
}

testResend();
