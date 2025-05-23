interface ICSEvent {
  summary: string;
  description: string;
  location: string;
  start: string; // ISO string format YYYY-MM-DDThh:mm:ss
  duration: number; // In hours
  url?: string;
}

export function generateICSFile(event: ICSEvent): string {
  // Generate a unique ID for the event
  const uid = `event-${Date.now()}@lisbonlovesme.com`;
  
  // Format the start date
  const startDate = new Date(event.start);
  const formattedStart = formatDate(startDate);
  
  // Calculate end time based on duration
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + event.duration);
  const formattedEnd = formatDate(endDate);
  
  // Create timestamp for the file creation
  const now = formatDate(new Date());
  
  // Generate the ICS content
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lisboa Tours//Tour Booking//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
SUMMARY:${event.summary}
DTSTAMP:${now}
DTSTART:${formattedStart}
DTEND:${formattedEnd}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
STATUS:CONFIRMED
SEQUENCE:0
${event.url ? `URL:${event.url}` : ''}
END:VEVENT
END:VCALENDAR`;
}

// Helper function to format date to ICS format
function formatDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
