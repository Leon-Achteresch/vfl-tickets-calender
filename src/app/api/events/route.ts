import { readEvents, removeEvent, upsertEvent } from '@/lib/storage';
import { NextResponse } from 'next/server';

export async function GET() {
  const events = await readEvents();
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const date = typeof body?.date === 'string' ? body.date : undefined;
  const title = typeof body?.title === 'string' ? body.title : undefined;
  if (!date)
    return NextResponse.json({ error: 'date required' }, { status: 400 });
  try {
    const events = await upsertEvent(date, title);
    return NextResponse.json({ events });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const date = typeof body?.date === 'string' ? body.date : undefined;
  if (!date)
    return NextResponse.json({ error: 'date required' }, { status: 400 });
  const events = await removeEvent(date);
  return NextResponse.json({ events });
}
