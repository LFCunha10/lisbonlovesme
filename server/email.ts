import nodemailer from 'nodemailer';

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
  icsContent: string;
}

// For a real implementation, you would configure nodemailer with SMTP settings
// Here we're simulating email sending with console logs
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
    icsContent
  } = options;
  
  // Format the date
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create email content
  const emailContent = `
    Hello ${name},

    Thank you for booking with Lisbonlovesme!

    Your booking has been confirmed:

    Booking Reference: ${bookingReference}
    Tour: ${tourName}
    Date: ${formattedDate}
    Time: ${time}
    Number of Participants: ${participants}
    Total Amount: €${totalAmount}

    Meeting Point:
    ${meetingPoint}

    Important Information:
    - Please arrive 15 minutes before the tour starts
    - Bring comfortable walking shoes, water, and sun protection
    - Your tour guide will be holding a "Lisbonlovesme" sign

    If you have any questions, please contact us at info@lisbonlovesme.com or +351 21 123 4567.

    We look forward to showing you the best of Lisbon!

    Best regards,
    Lisbonlovesme Team
  `;

  // Log the email for development purposes
  console.log('=== BOOKING CONFIRMATION EMAIL ===');
  console.log(`To: ${to}`);
  console.log(`Subject: Lisbonlovesme - Booking Confirmation #${bookingReference}`);
  console.log(emailContent);
  console.log('=== END OF EMAIL ===');

  // In a production environment, you would use nodemailer to send the actual email
  // with the ICS file attached
  
  if (process.env.NODE_ENV === 'production' && process.env.EMAIL_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"Lisbonlovesme" <${process.env.EMAIL_FROM || 'info@lisbonlovesme.com'}>`,
        to,
        subject: `Lisbonlovesme - Booking Confirmation #${bookingReference}`,
        text: emailContent,
        html: emailContent.replace(/\n/g, '<br>'),
        attachments: [
          {
            filename: 'tour-booking.ics',
            content: icsContent,
            contentType: 'text/calendar'
          }
        ]
      });
      
      console.log(`Confirmation email sent to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send confirmation email');
    }
  }
  
  // For development, just pretend we sent it
  return Promise.resolve();
}
