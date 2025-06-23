import { start } from "repl";

interface ICSEvent {
  summary: string;
  description: string;
  location: string;
  start: string; // ISO string format YYYY-MM-DDThh:mm:ss
  duration: string; 
  url?: string;
}

export function generateICSFile(event: ICSEvent): string {
  console.log('start sent: ', event.start)
  // Generate a unique ID for the event
  const uid = `event-${Date.now()}@lisbonlovesme.com`;
  
  // Validate and format the start date
  if (!event.start || isNaN(new Date(event.start).getTime())) {
    throw new Error(`Invalid start date: ${event.start}`);
  }
  const startDate = new Date(event.start);
  const formattedStart = formatDate(startDate);
  
  const preDuration = event.duration?.split(' ')[0] || '3';
  const duration = parseInt(preDuration);
  if (isNaN(duration)) {
    throw new Error(`Invalid duration format: ${event.duration}`);
  }

  // Calculate end time based on duration
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + duration);
  const formattedEnd = formatDate(endDate);
  
  // Create timestamp for the file creation
  const now = formatDate(new Date());
  
  // Generate the ICS content
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lisbonlovesme//Tour Booking//EN
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
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error(`Invalid Date passed to formatDate: ${date}`);
  }

  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
