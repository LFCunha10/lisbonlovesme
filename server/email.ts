import sgMail from '@sendgrid/mail';
import { generateICSFile } from './utils/ics-generator';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not found. Email functionality will be limited to console logs.');
}

interface ConfirmationEmailOptions {
  to: string;
  name: string;
  bookingReference: string;
  tourName: string;
  date: string;
  time: string;
  participants: number;
  totalAmount: string;
  meetingPoint: string;
  duration?: number; // Duration in hours
}

/**
 * Sends a review request email after tour completion
 */
export async function sendReviewRequestEmail(options: {
  to: string;
  customerName: string;
  bookingReference: string;
  tourName: string;
  baseUrl: string;
}): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not configured, review email not sent');
    return;
  }

  const reviewUrl = `${options.baseUrl}/review/${options.bookingReference}`;

  const msg = {
    to: options.to,
    from: 'noreply@lisbonlovesme.com',
    subject: `How was your ${options.tourName} experience?`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Lisbonlovesme</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Share Your Experience</p>
        </div>
        
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #333; margin: 0 0 20px 0;">Hello ${options.customerName}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for joining us on the <strong>${options.tourName}</strong>! We hope you had an amazing time exploring Lisbon with us.
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
            Booking Reference: <strong>${options.bookingReference}</strong>
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
    console.log(`Review request email sent to ${options.to} for booking ${options.bookingReference}`);
  } catch (error) {
    console.error('Error sending review request email:', error);
    throw error;
  }
}

/**
 * Sends a booking confirmation email with calendar invite attachment
 */
export async function sendBookingConfirmationEmail(options: ConfirmationEmailOptions): Promise<void> {
  const {
    to,
    name,
    bookingReference,
    tourName,
    date,
    time,
    participants,
    totalAmount,
    meetingPoint,
    duration = 2 // Default tour duration is 2 hours if not specified
  } = options;
  
  // Format the date
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create the event datetime for the ICS file
  const [hours, minutes] = time.split(':').map(Number);
  const eventDate = new Date(date);
  eventDate.setHours(hours, minutes, 0, 0);
  
  // Generate ICS file content
  const icsContent = generateICSFile({
    summary: `Lisbonlovesme Tour: ${tourName}`,
    description: `Your booking with Lisbonlovesme has been confirmed.\n\nBooking Reference: ${bookingReference}\nNumber of Participants: ${participants}\nTotal Amount: €${totalAmount}\n\nPlease arrive 15 minutes before the tour starts.`,
    location: meetingPoint,
    start: eventDate.toISOString(),
    duration,
    url: 'https://lisbonlovesme.com'
  });

  // Create HTML email content
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
      .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
      .booking-details { background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #3b82f6; }
      .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
      .detail-label { font-weight: bold; color: #555; }
      .detail-value { text-align: right; }
      .note-box { background-color: #fffbeb; border-left: 4px solid #fbbf24; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
      .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
      .btn { display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 style="margin: 0;">Booking Confirmation</h1>
      <p style="margin: 5px 0 0 0;">Thank you for choosing Lisbonlovesme!</p>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>Your booking has been confirmed and we're excited to show you the best of Lisbon!</p>
      
      <div class="booking-details">
        <h2 style="margin-top: 0; color: #3b82f6;">Tour Details</h2>
        <div class="detail-row">
          <span class="detail-label">Booking Reference:</span>
          <span class="detail-value">${bookingReference}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tour:</span>
          <span class="detail-value">${tourName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${time}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Participants:</span>
          <span class="detail-value">${participants}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Amount:</span>
          <span class="detail-value">€${totalAmount}</span>
        </div>
      </div>
      
      <h3>Meeting Point</h3>
      <p>${meetingPoint}</p>
      
      <div class="note-box">
        <h3 style="margin-top: 0; color: #92400e;">Important Information</h3>
        <ul>
          <li>Please arrive <strong>15 minutes</strong> before the tour starts</li>
          <li>Bring comfortable walking shoes, water, and sun protection</li>
          <li>Your tour guide will be holding a "Lisbonlovesme" sign</li>
        </ul>
      </div>
      
      <p>We've attached a calendar invitation to help you remember your booking.</p>
      <p>If you have any questions, please contact us at <a href="mailto:info@lisbonlovesme.com">info@lisbonlovesme.com</a> or +351 21 123 4567.</p>
      
      <p>We look forward to showing you the best of Lisbon!</p>
      <p>Best regards,<br>Lisbonlovesme Team</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Lisbonlovesme. All rights reserved.</p>
    </div>
  </body>
  </html>
  `;

  // Create plain text version as fallback
  const textContent = `
Hello ${name},

Thank you for booking with Lisbonlovesme!

YOUR BOOKING HAS BEEN CONFIRMED:

Booking Reference: ${bookingReference}
Tour: ${tourName}
Date: ${formattedDate}
Time: ${time}
Number of Participants: ${participants}
Total Amount: €${totalAmount}

MEETING POINT:
${meetingPoint}

IMPORTANT INFORMATION:
- Please arrive 15 minutes before the tour starts
- Bring comfortable walking shoes, water, and sun protection
- Your tour guide will be holding a "Lisbonlovesme" sign

We've attached a calendar invitation to help you remember your booking.

If you have any questions, please contact us at info@lisbonlovesme.com or +351 21 123 4567.

We look forward to showing you the best of Lisbon!

Best regards,
Lisbonlovesme Team
  `;

  // Log the email for development purposes
  console.log('=== BOOKING CONFIRMATION EMAIL ===');
  console.log(`To: ${to}`);
  console.log(`Subject: Lisbonlovesme - Booking Confirmation #${bookingReference}`);
  console.log(textContent);
  console.log('=== END OF EMAIL ===');

  // Send the email if SendGrid API key is available
  if (process.env.SENDGRID_API_KEY) {
    try {
      const msg = {
        to,
        from: 'noreply@replit.com', // Use the Replit verified sender email
        subject: `Lisbonlovesme - Booking Confirmation #${bookingReference}`,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            content: Buffer.from(icsContent).toString('base64'),
            filename: 'tour-booking.ics',
            type: 'text/calendar',
            disposition: 'attachment'
          }
        ]
      };

      await sgMail.send(msg);
      console.log(`Confirmation email sent to ${to}`);
    } catch (error: any) {
      console.error('Error sending email:', error);
      if (error.response) {
        console.error(error.response.body);
      }
      throw new Error('Failed to send confirmation email');
    }
  }
  
  // For development without SendGrid API key, just log to console
  return Promise.resolve();
}
