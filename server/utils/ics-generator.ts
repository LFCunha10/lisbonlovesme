// ICS generator for calendar attachments

interface ICSEvent {
  summary: string;
  description: string;
  location: string;
  start: string; // ISO string format YYYY-MM-DDThh:mm:ss
  duration: string; 
  url?: string;
  tzid?: string; // e.g., 'Europe/Lisbon' to pin local time
}

export function generateICSFile(event: ICSEvent): string {
  // Build a robust ICS payload with proper CRLF line endings
  // Generate a unique ID for the event
  const uid = `event-${Date.now()}@lisbonlovesme.com`;
  
  // Validate and format the start date
  if (!event.start || isNaN(new Date(event.start).getTime())) {
    throw new Error(`Invalid start date: ${event.start}`);
  }
  const startDate = new Date(event.start);
  const formattedStartUTC = formatDateUTC(startDate);

  const preDuration = event.duration?.split(' ')[0] || '3';
  const duration = parseInt(preDuration);
  if (isNaN(duration)) {
    throw new Error(`Invalid duration format: ${event.duration}`);
  }

  // Calculate end time based on duration
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + duration);
  const formattedEndUTC = formatDateUTC(endDate);
  
  // Create timestamp for the file creation
  const now = formatDateUTC(new Date());
  
  // Escape values per RFC5545
  const esc = (value: string) =>
    String(value)
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  // Compose lines and ensure CRLF line endings
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lisbonlovesme//Tour Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SUMMARY:${esc(event.summary)}`,
    `DTSTAMP:${now}`,
    ...(event.tzid
      ? [
          `DTSTART;TZID=${event.tzid}:${formatDateInZone(startDate, event.tzid)}`,
          `DTEND;TZID=${event.tzid}:${formatDateInZone(endDate, event.tzid)}`
        ]
      : [
          `DTSTART:${formattedStartUTC}`,
          `DTEND:${formattedEndUTC}`
        ]),
    `DESCRIPTION:${esc(event.description)}`,
    `LOCATION:${esc(event.location)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    ...(event.url ? [`URL:${esc(event.url)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return lines.map(foldLine).join('\r\n');
}

// Helper function to format date to ICS UTC format
function formatDateUTC(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error(`Invalid Date passed to formatDate: ${date}`);
  }

  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Helper to format a date in a specific IANA timezone without Z-suffix
function formatDateInZone(date: Date, tzid: string): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error(`Invalid Date passed to formatDateInZone: ${date}`);
  }
  // Use Intl to compute local wall time in the given zone
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: tzid,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  const y = parts.year;
  const m = parts.month;
  const d = parts.day;
  const hh = parts.hour;
  const mm = parts.minute;
  const ss = parts.second;
  return `${y}${m}${d}T${hh}${mm}${ss}`;
}

// Fold lines to 75 octets as recommended by RFC 5545
function foldLine(line: string): string {
  const maxLen = 75;
  if (line.length <= maxLen) return line;
  const parts: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i + maxLen);
    parts.push(i === 0 ? chunk : ' ' + chunk);
    i += maxLen;
  }
  return parts.join('\r\n');
}
