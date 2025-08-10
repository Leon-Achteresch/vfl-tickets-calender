import { getRedis } from '@/lib/redis';

export type TicketEvent = {
  id: string;
  date: string;
  title: string;
  createdAt: string;
};

export async function readEvents(): Promise<TicketEvent[]> {
  const redis = await getRedis();
  const raw = await redis.get('events');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as TicketEvent[];
    return [];
  } catch {
    return [];
  }
}

export async function writeEvents(events: TicketEvent[]): Promise<void> {
  const redis = await getRedis();
  await redis.set('events', JSON.stringify(events));
}

function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeTitle(title: unknown): string {
  if (typeof title === 'string' && title.trim().length > 0) return title.trim();
  return 'Ticketverkauf';
}

export async function upsertEvent(
  date: string,
  title?: string
): Promise<TicketEvent[]> {
  if (!isValidDateString(date))
    throw new Error('Invalid date format, expected YYYY-MM-DD');
  const events = await readEvents();
  const existingIndex = events.findIndex(e => e.id === date);
  const next: TicketEvent = {
    id: date,
    date,
    title: normalizeTitle(title),
    createdAt: new Date().toISOString(),
  };
  if (existingIndex >= 0) {
    events[existingIndex] = next;
  } else {
    events.push(next);
  }
  const sorted = events.sort((a, b) => a.date.localeCompare(b.date));
  await writeEvents(sorted);
  return sorted;
}

export async function removeEvent(date: string): Promise<TicketEvent[]> {
  const events = await readEvents();
  const filtered = events.filter(e => e.id !== date);
  await writeEvents(filtered);
  return filtered;
}
