// Test script to send a review email
const { sendReviewRequestEmail } = require('./server/email.js');

async function sendTestReviewEmail() {
  try {
    await sendReviewRequestEmail({
      to: 'cluizfilipe@gmail.com',
      customerName: 'Carlos',
      bookingReference: 'TEST-REF-001',
      tourName: 'Alfama Historical Walking Tour',
      baseUrl: 'https://your-domain.replit.app'
    });
    console.log('Test review email sent successfully!');
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

sendTestReviewEmail();