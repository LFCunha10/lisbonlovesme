import { apiRequest } from "./queryClient";

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

/**
 * Sends an email using the server API
 * This is a client-side wrapper for sending emails through the server
 */
export async function SendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // In a real implementation, this would call a server endpoint to send emails
    // For this MVP, this is simulated, but would be implemented in a production app
    console.log("Sending email:", emailData);
    
    // Simulate a server call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Creates a booking confirmation email
 */
export function createBookingConfirmationEmail(
  name: string,
  tourName: string,
  date: string,
  time: string,
  participants: number,
  totalAmount: string,
  meetingPoint: string,
  bookingReference: string
): string {
  // Format the date
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0073CF;">Booking Confirmation</h2>
      <p>Hello ${name},</p>
      <p>Thank you for booking with Lisboa Tours!</p>
      <p>Your booking has been confirmed:</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Booking Reference:</strong> ${bookingReference}</p>
        <p><strong>Tour:</strong> ${tourName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Number of Participants:</strong> ${participants}</p>
        <p><strong>Total Amount:</strong> ${totalAmount}</p>
      </div>
      
      <h3 style="color: #0073CF;">Meeting Point</h3>
      <p>${meetingPoint}</p>
      
      <h3 style="color: #0073CF;">Important Information</h3>
      <ul>
        <li>Please arrive 15 minutes before the tour starts</li>
        <li>Bring comfortable walking shoes, water, and sun protection</li>
        <li>Your tour guide will be holding a "Lisboa Tours" sign</li>
      </ul>
      
      <p>If you have any questions, please contact us at info@lisboatours.com or +351 21 123 4567.</p>
      
      <p>We look forward to showing you the best of Lisbon!</p>
      
      <p>Best regards,<br>Lisboa Tours Team</p>
    </div>
  `;
}
