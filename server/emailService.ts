import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { generateICSFile } from './utils/ics-generator';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT ?? '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
  duration?: string; // Duration in hours
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
  
  const reviewUrl = `${options.baseUrl}/review/${options.bookingReference}`;
  const textHtml = `
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
`;
  const mailOptions = await transporter.sendMail({
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: `How was your ${options.tourName} experience?`,
    html: textHtml,
    
  });
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent:', info.messageId);
  } catch (err) {
    console.error('Error occurred:', err);
  }
  return Promise.resolve();
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
    duration = '3 hours' // Default tour duration is 2 hours if not specified
  } = options;
  
  // Format the date
  const formattedDate = new Date(date).toLocaleDateString('pt-PT', {
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

  const mailOptions = await transporter.sendMail({
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Lisbonlovesme - Booking Confirmation #${bookingReference}`,
    text: textContent,
    html: htmlContent,
    attachments: [
      {
        content: Buffer.from(icsContent).toString('base64'),
        filename: 'tour-booking.ics',
      }
    ]
  });
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent:', info.messageId);
  } catch (err) {
    console.error('Error occurred:', err);
  }
  
  // For development without SendGrid API key, just log to console
  return Promise.resolve();
}

export async function sendRequestConfirmationEmail(options: ConfirmationEmailOptions): Promise<void> {
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
    duration = '3 hours' // Default tour duration is 2 hours if not specified
  } = options;
  
  // Format the date
  const formattedDate = new Date(date).toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  // Create the event datetime for the ICS file
  const [hours, minutes] = time.split(':').map(Number);
  const eventDate = new Date(date);
  eventDate.setHours(hours, minutes, 0, 0);
  
  // Create HTML email content
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We received your request!</title>
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
      <h1 style="margin: 0;">We received your request!</h1>
      <p style="margin: 5px 0 0 0;">Thank you for choosing Lisbonlovesme!</p>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>We received your request! Soon we will get in touch and finish the details for your tour!</p>
      
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
       
      <div class="note-box">
        <h3 style="margin-top: 0; color: #92400e;">Important Information</h3>
        <ul>
          <li>This is not a confirmation of your tour. Our team will contact you shortly.</li>
        </ul>
      </div>
      
      <p>If you have any questions, please contact us at <a href="mailto:lisbonlovesme@gmail.com">lisbonlovesme@gmail.com</a> or +351 938 607 585.</p>
      
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

Thank you for choosing Lisbonlovesme!

WE RECEIVED YOUR REQUEST. OUR TEAM WILL CONTACT YOU SHORTLY:

Booking Reference: ${bookingReference}
Tour: ${tourName}
Date: ${formattedDate}
Time: ${time}
Number of Participants: ${participants}
Total Amount: €${totalAmount}

If you have any questions, please contact us at lisbonlovesme@gmail.com or +351 938 607 585.

We look forward to showing you the best of Lisbon!

Best regards,
Lisbonlovesme Team
  `;

  const mailOptions = await transporter.sendMail({
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Lisbonlovesme - We received your request!`,
    text: textContent,
    html: htmlContent,
  });
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent:', info.messageId);
  } catch (err) {
    console.error('Error occurred:', err);
  }
  
  // For development without SendGrid API key, just log to console
  return Promise.resolve();
}
