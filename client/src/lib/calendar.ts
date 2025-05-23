/**
 * Generates an ICS file and triggers a download
 */
interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  duration: number; // in hours
}

export function AddToCalendar(event: CalendarEvent): void {
  const icsContent = generateICS(event);
  
  // Create a blob and trigger download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'lisboa-tour.ics');
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateICS(event: CalendarEvent): string {
  // Generate a unique ID for the event
  const uid = `event-${Date.now()}@lisboatours.com`;
  
  // Format start date and time
  const startDate = new Date(`${event.startDate}T${event.startTime}`);
  const formattedStart = formatDateForICS(startDate);
  
  // Calculate end time based on duration
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + event.duration);
  const formattedEnd = formatDateForICS(endDate);
  
  // Create timestamp for the file creation
  const now = formatDateForICS(new Date());
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lisboa Tours//Tour Booking//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
SUMMARY:${escapeiCalText(event.title)}
DTSTAMP:${now}
DTSTART:${formattedStart}
DTEND:${formattedEnd}
DESCRIPTION:${escapeiCalText(event.description)}
LOCATION:${escapeiCalText(event.location)}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

// Helper function to format date to ICS format
function formatDateForICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Helper function to escape special characters in iCalendar text fields
function escapeiCalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Functions for Google Calendar, Outlook, etc. integration
 * These would be implemented in a full production app
 */
export function addToGoogleCalendar(event: CalendarEvent): void {
  const startDateTime = new Date(`${event.startDate}T${event.startTime}`);
  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(endDateTime.getHours() + event.duration);
  
  const formattedStart = startDateTime.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
  const formattedEnd = endDateTime.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
  
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formattedStart}/${formattedEnd}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
  
  window.open(url, '_blank');
}

export function addToOutlookCalendar(event: CalendarEvent): void {
  // Implementation would be similar to Google Calendar, but using Outlook's URL schema
  // This is a placeholder for actual implementation
  console.log("Add to Outlook Calendar", event);
}
