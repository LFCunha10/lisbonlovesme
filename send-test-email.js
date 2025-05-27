import sgMail from '@sendgrid/mail';

// Set your SendGrid API key
sgMail.setApiKey('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');

async function sendTestReviewEmail() {
  const reviewUrl = `https://your-replit-domain.replit.app/review/TEST-${Date.now()}`;
  
  const msg = {
    to: 'cluizfilipe@gmail.com',
    from: 'noreply@lisbonlovesme.com',
    subject: 'How was your Alfama Historical Walking Tour experience?',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Lisbonlovesme</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Share Your Experience</p>
        </div>
        
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #333; margin: 0 0 20px 0;">Hello Carlos!</h2>
          
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for joining us on the <strong>Alfama Historical Walking Tour</strong>! We hope you had an amazing time exploring Lisbon with us.
          </p>
          
          <p style="color: #666; line-height: 1.6; margin: 0 0 25px 0;">
            Your experience matters to us and helps other travelers discover the magic of Lisbon. Would you mind taking a few minutes to share your thoughts?
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Leave Your Review
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; margin: 25px 0 0 0;">
            Booking Reference: <strong>TEST-${Date.now()}</strong>
          </p>
          
          <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
            Thank you for choosing Lisbonlovesme. We look forward to welcoming you back for another adventure!
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; color: #888; font-size: 12px;">
          <p style="margin: 0;">© 2024 Lisbonlovesme Tours. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Test review email sent successfully to cluizfilipe@gmail.com!');
    console.log('📧 Email includes:');
    console.log('   - Personalized greeting for Carlos');
    console.log('   - Beautiful Lisbonlovesme branding');
    console.log('   - Review link for Alfama Historical Walking Tour');
    console.log('   - Professional email design');
    console.log('📱 Carlos can now click the link to leave his review!');
  } catch (error) {
    console.error('❌ Error sending email:', error.response?.body || error.message);
  }
}

sendTestReviewEmail();