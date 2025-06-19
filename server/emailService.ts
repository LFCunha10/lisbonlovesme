import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { generateICSFile } from './utils/ics-generator';
dotenv.config();

// Email translations
interface EmailTranslations {
  [key: string]: {
    bookingConfirmation: {
      subject: string;
      header: string;
      greeting: string;
      confirmationMessage: string;
      tourDetails: string;
      bookingReference: string;
      tour: string;
      date: string;
      time: string;
      participants: string;
      totalAmount: string;
      meetingPoint: string;
      importantInfo: string;
      arriveEarly: string;
      bringItems: string;
      guideSign: string;
      questions: string;
      lookingForward: string;
      bestRegards: string;
      teamName: string;
    };
    reviewRequest: {
      subject: string;
      header: string;
      greeting: string;
      thankYou: string;
      experienceMatters: string;
      shareThoughts: string;
      writeReview: string;
      orVisit: string;
      appreciateTime: string;
      bestRegards: string;
      teamName: string;
    };
    requestConfirmation: {
      subject: string;
      header: string;
      greeting: string;
      thankYou: string;
      requestReceived: string;
      reviewSoon: string;
      contactYou: string;
      questions: string;
      bestRegards: string;
      teamName: string;
      tourDetails: string;
      bookingReference: string;
      tour: string;
      date: string;
      time: string;
      participants: string;
      totalAmount: string;
      meetingPoint: string;
    };
  };
}

// Cache for loaded translations
let translationCache: { [key: string]: any } = {};

// Function to load translations from i18n locale files
function loadTranslations(language: string) {
  const lang = language?.split('-')[0] || 'en';
  
  if (translationCache[lang]) {
    return translationCache[lang];
  }

  try {
    const localeFilePath = path.join(process.cwd(), 'client', 'src', 'i18n', 'locales', `${lang}.json`);
    const localeData = JSON.parse(fs.readFileSync(localeFilePath, 'utf8'));
    translationCache[lang] = localeData.translation.email;
    return translationCache[lang];
  } catch (error) {
    console.warn(`Failed to load translations for language: ${lang}, falling back to English`);
    // Fallback to English
    if (lang !== 'en') {
      return loadTranslations('en');
    }
    // If even English fails, return empty object
    return {};
  }
}

// Helper function to get translations
function getEmailTranslations(language?: string) {
  const lang = language?.split('-')[0] || 'en';
  console.log(`Getting email translations for language: ${language} -> ${lang}`);
  return loadTranslations(lang) || loadTranslations('en');
}

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
  adminNotes?: string;
  language?: string; // Add language support
}

interface BookingRequestNotificationOptions {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tourName: string;
  date: string;
  time: string;
  participants: number;
  specialRequests?: string;
  bookingReference: string;
  language?: string; // Add language support
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
  language?: string; // Add language support
}): Promise<void> {
  
  const t = getEmailTranslations(options.language);
  const reviewUrl = `${options.baseUrl}/review/${options.bookingReference}`;
  
  const textHtml = `
  <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Lisbonlovesme</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${t.reviewRequest.header}</p>
    </div>
    
    <div style="padding: 40px 30px; background: white;">
      <h2 style="color: #333; margin: 0 0 20px 0;">${t.reviewRequest.greeting} ${options.customerName}!</h2>
      
      <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
        ${t.reviewRequest.thankYou.replace('tour', `<strong>${options.tourName}</strong>`)}
      </p>
      
      <p style="color: #666; line-height: 1.6; margin: 0 0 25px 0;">
        ${t.reviewRequest.experienceMatters} ${t.reviewRequest.shareThoughts}
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${reviewUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
          ${t.reviewRequest.writeReview}
        </a>
      </div>
      
      <p style="color: #888; font-size: 14px; margin: 25px 0 0 0;">
        Booking Reference: <strong>${options.bookingReference}</strong>
      </p>
      
      <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
        ${t.reviewRequest.appreciateTime}
      </p>
      
      <p style="color: #666; line-height: 1.6; margin: 15px 0 0 0;">
        ${t.reviewRequest.bestRegards},<br>${t.reviewRequest.teamName}
      </p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; color: #888; font-size: 12px;">
      <p style="margin: 0;">© ${new Date().getFullYear()} Lisbonlovesme Tours. All rights reserved.</p>
    </div>
  </div>
`;
  const mailOptions = {
    from: `"Lisbonlovesme" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: t.reviewRequest.subject,
    html: textHtml,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Review request email sent: ${info.messageId}`);
  } catch (err) {
    console.error('Error sending review request email:', err);
    throw err;
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
    duration = '3 hours', // Default tour duration is 3 hours if not specified
    adminNotes,
    language
  } = options;
  
  // Get translations for the specified language
  const t = getEmailTranslations(language);
  
  // Format the date based on language
  const locale = language?.startsWith('pt') ? 'pt-PT' : 'en-US';
  const formattedDate = new Date(date).toLocaleDateString(locale, {
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
    description: `${t.bookingConfirmation.confirmationMessage}\n\n${t.bookingConfirmation.bookingReference}: ${bookingReference}\n${t.bookingConfirmation.participants}: ${participants}\n${t.bookingConfirmation.totalAmount}: €${totalAmount}\n\n${t.bookingConfirmation.arriveEarly}`,
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
    <title>${t.bookingConfirmation.header}</title>
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
      <h1 style="margin: 0;">${t.bookingConfirmation.header}</h1>
      <p style="margin: 5px 0 0 0;">Thank you for choosing Lisbonlovesme!</p>
    </div>
    <div class="content">
      <p>${t.bookingConfirmation.greeting} ${name},</p>
      <p>${t.bookingConfirmation.confirmationMessage}</p>
      
      <div class="booking-details">
        <h2 style="margin-top: 0; color: #3b82f6;">${t.bookingConfirmation.tourDetails}</h2>
        <div class="detail-row">
          <span class="detail-label">${t.bookingConfirmation.bookingReference}:</span>
          <span class="detail-value">${bookingReference}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.bookingConfirmation.tour}:</span>
          <span class="detail-value">${tourName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.bookingConfirmation.date}:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.bookingConfirmation.time}:</span>
          <span class="detail-value">${time}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.bookingConfirmation.participants}:</span>
          <span class="detail-value">${participants}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.bookingConfirmation.totalAmount}:</span>
          <span class="detail-value">€${totalAmount}</span>
        </div>
      </div>
      
      <h3>${t.bookingConfirmation.meetingPoint}</h3>
      <p>${meetingPoint}</p>

      ${adminNotes ? `<h3>Additional Info</h3><p>${adminNotes}</p>` : ''}
      
      <div class="note-box">
        <h3 style="margin-top: 0; color: #92400e;">${t.bookingConfirmation.importantInfo}</h3>
        <ul>
          <li>${t.bookingConfirmation.arriveEarly}</li>
          <li>${t.bookingConfirmation.bringItems}</li>
          <li>${t.bookingConfirmation.guideSign}</li>
        </ul>
      </div>
      
      <p>${t.bookingConfirmation.questions}</p>
      
      <p>${t.bookingConfirmation.lookingForward}</p>
      <p>${t.bookingConfirmation.bestRegards},<br>${t.bookingConfirmation.teamName}</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Lisbonlovesme. All rights reserved.</p>
    </div>
  </body>
  </html>
  `;

  // Create plain text version as fallback
  const textContent = `
${t.bookingConfirmation.greeting} ${name},

${t.bookingConfirmation.confirmationMessage}

${t.bookingConfirmation.tourDetails.toUpperCase()}:

${t.bookingConfirmation.bookingReference}: ${bookingReference}
${t.bookingConfirmation.tour}: ${tourName}
${t.bookingConfirmation.date}: ${formattedDate}
${t.bookingConfirmation.time}: ${time}
${t.bookingConfirmation.participants}: ${participants}
${t.bookingConfirmation.totalAmount}: €${totalAmount}

${t.bookingConfirmation.meetingPoint.toUpperCase()}:
${meetingPoint}

${t.bookingConfirmation.importantInfo.toUpperCase()}:
- ${t.bookingConfirmation.arriveEarly}
- ${t.bookingConfirmation.bringItems}
- ${t.bookingConfirmation.guideSign}

${t.bookingConfirmation.questions}

${t.bookingConfirmation.lookingForward}

${t.bookingConfirmation.bestRegards},
${t.bookingConfirmation.teamName}
  `;

  const mailOptions = {
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${t.bookingConfirmation.subject} #${bookingReference}`,
    text: textContent,
    html: htmlContent,
    attachments: [
      {
        content: Buffer.from(icsContent).toString('base64'),
        filename: 'tour-booking.ics',
      }
    ]
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent: ${info.messageId}`);
  } catch (err) {
    console.error('Error sending booking confirmation email:', err);
    throw err;
  }
}

/**
 * Sends a notification email to admin when a new booking request is made
 */
export async function sendBookingRequestNotification(options: BookingRequestNotificationOptions): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || 'lisbonlovesme@gmail.com';
  
  // Get translations for the specified language (default to English for admin)
  const t = getEmailTranslations(options.language);
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: `${t.adminNotification.subject} - ${options.tourName}`,
    html: `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Lisbonlovesme</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${t.adminNotification.subject}</p>
      </div>
      
      <div style="padding: 40px 30px; background: white;">
        <h2 style="color: #333; margin: 0 0 20px 0;">${t.adminNotification.header}</h2>
        <p>${t.adminNotification.newRequest}</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0;">${t.adminNotification.customerDetails}</h3>
          <p><strong>${t.adminNotification.customerName}:</strong> ${options.customerName}</p>
          <p><strong>${t.adminNotification.customerEmail}:</strong> ${options.customerEmail}</p>
          <p><strong>${t.adminNotification.customerPhone}:</strong> ${options.customerPhone}</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0;">${t.adminNotification.tourDetails}</h3>
          <p><strong>${t.adminNotification.tour}:</strong> ${options.tourName}</p>
          <p><strong>${t.adminNotification.requestedDate}:</strong> ${options.date}</p>
          <p><strong>${t.adminNotification.requestedTime}:</strong> ${options.time}</p>
          <p><strong>${t.adminNotification.participants}:</strong> ${options.participants}</p>
          <p><strong>${t.adminNotification.reference}:</strong> ${options.bookingReference}</p>
        </div>

        ${options.specialRequests ? `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0;">${t.adminNotification.specialRequests}</h3>
          <p>${options.specialRequests}</p>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666; margin: 0 0 20px 0;">${t.adminNotification.reviewRequest}</p>
          <a href="${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/admin/requests` : 'https://your-domain.com/admin/requests'}" 
             style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px;">
            ${t.adminNotification.reviewButton}
          </a>
        </div>
      </div>
    </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking request notification sent for reference: ${options.bookingReference}`);
  } catch (error) {
    console.error('Error sending booking request notification:', error);
    throw error;
  }
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
    duration = '3 hours',
    language
  } = options;
  
  const t = getEmailTranslations(language);
  
  // Format the date based on language
  const locale = language?.startsWith('pt') ? 'pt-PT' : 'en-US';
  const formattedDate = new Date(date).toLocaleDateString(locale, {
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
    <title>${t.requestConfirmation.header}</title>
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
      <h1 style="margin: 0;">${t.requestConfirmation.header}</h1>
      <p style="margin: 5px 0 0 0;">${t.requestConfirmation.thankYou}</p>
    </div>
    <div class="content">
      <p>${t.requestConfirmation.greeting} ${name},</p>
      <p>${t.requestConfirmation.requestReceived}</p>
      
      <div class="booking-details">
        <h2 style="margin-top: 0; color: #3b82f6;">${t.requestConfirmation.tourDetails}</h2>
        <div class="detail-row">
          <span class="detail-label">${t.requestConfirmation.bookingReference}:</span>
          <span class="detail-value">${bookingReference}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.requestConfirmation.tour}:</span>
          <span class="detail-value">${tourName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.requestConfirmation.date}:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.requestConfirmation.time}:</span>
          <span class="detail-value">${time}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.requestConfirmation.participants}:</span>
          <span class="detail-value">${participants}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t.requestConfirmation.totalAmount}:</span>
          <span class="detail-value">€${totalAmount}</span>
        </div>
      </div>
       
      <div class="note-box">
        <h3 style="margin-top: 0; color: #92400e;">${t.bookingConfirmation.importantInfo}</h3>
        <ul>
          <li>${t.requestConfirmation.reviewSoon}</li>
        </ul>
      </div>
      
      <p>${t.adminNotification.questionsContact}</p>
      
      <p>${t.adminNotification.lookingForward}</p>
      <p>${t.requestConfirmation.bestRegards},<br>${t.requestConfirmation.teamName}</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Lisbonlovesme. All rights reserved.</p>
    </div>
  </body>
  </html>
  `;

  // Create plain text version as fallback
  const textContent = `
${t.requestConfirmation.greeting} ${name},

${t.requestConfirmation.requestReceived}

${t.requestConfirmation.tourDetails.toUpperCase()}:

${t.requestConfirmation.bookingReference}: ${bookingReference}
${t.requestConfirmation.tour}: ${tourName}
${t.requestConfirmation.date}: ${formattedDate}
${t.requestConfirmation.time}: ${time}
${t.requestConfirmation.participants}: ${participants}
${t.requestConfirmation.totalAmount}: €${totalAmount}

${t.requestConfirmation.reviewSoon}

${t.requestConfirmation.contactYou}

${t.requestConfirmation.questions}

${t.requestConfirmation.bestRegards},
${t.requestConfirmation.teamName}
  `;

  const mailOptions = {
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${t.requestConfirmation.subject} #${bookingReference}`,
    text: textContent,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Request confirmation email sent: ${info.messageId}`);
  } catch (err) {
    console.error('Error sending request confirmation email:', err);
    throw err;
  }
}
