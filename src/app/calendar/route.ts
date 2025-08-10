export const runtime = 'nodejs';
import { readEvents } from '@/lib/storage';
import { NextResponse } from 'next/server';

function escapeICS(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toICSDate(dateStr: string): string {
  return dateStr.replaceAll('-', '');
}

function toTimestamp(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z/, 'Z');
}

export async function GET() {
  const events = await readEvents();
  const now = new Date();
  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('PRODID:-//VfL Bockum Tickets//DE');
  lines.push('VERSION:2.0');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('NAME:VfL Bockum Tickets');
  lines.push('X-WR-CALNAME:VfL Bockum Tickets');
  lines.push('X-WR-TIMEZONE:Europe/Berlin');
  for (const e of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${e.id}@vfl-bockum-tickets`);
    lines.push(`DTSTAMP:${toTimestamp(now)}`);
    lines.push(`DTSTART;VALUE=DATE:${toICSDate(e.date)}`);
    lines.push(`SUMMARY:${escapeICS(e.title)}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const ics = lines.join('\n');
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="vfl-bockum-tickets.ics"',
      'Cache-Control': 'no-store',
    },
  });
}
