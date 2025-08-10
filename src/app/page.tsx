'use client';

import { useEffect, useMemo, useState } from 'react';

type TicketEvent = {
  id: string;
  date: string;
  title: string;
  createdAt: string;
};

type CalendarDay = {
  date: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  hasEvent: boolean;
  title?: string;
};

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function getDaysMatrix(
  year: number,
  month: number,
  eventsByDate: Record<string, TicketEvent | undefined>
): CalendarDay[] {
  const first = new Date(year, month, 1);
  const firstWeekdayMon0 = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const todayStr = formatDate(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );
  const cells: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const cellIndex = i - firstWeekdayMon0 + 1;
    let day: number;
    let inCurrentMonth: boolean;
    let cellDate: string;
    if (cellIndex <= 0) {
      day = prevMonthDays + cellIndex;
      const dt = new Date(year, month - 1, day);
      cellDate = formatDate(dt.getFullYear(), dt.getMonth(), dt.getDate());
      inCurrentMonth = false;
    } else if (cellIndex > daysInMonth) {
      day = cellIndex - daysInMonth;
      const dt = new Date(year, month + 1, day);
      cellDate = formatDate(dt.getFullYear(), dt.getMonth(), dt.getDate());
      inCurrentMonth = false;
    } else {
      day = cellIndex;
      cellDate = formatDate(year, month, day);
      inCurrentMonth = true;
    }
    const ev = eventsByDate[cellDate];
    cells.push({
      date: cellDate,
      day,
      inCurrentMonth,
      isToday: cellDate === todayStr,
      hasEvent: !!ev,
      title: ev?.title,
    });
  }
  return cells;
}

export default function Home() {
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');

  const eventsByDate = useMemo(() => {
    const map: Record<string, TicketEvent> = {};
    for (const e of events) map[e.date] = e;
    return map;
  }, [events]);

  const days = useMemo(
    () => getDaysMatrix(year, month, eventsByDate),
    [year, month, eventsByDate]
  );

  async function refresh() {
    const res = await fetch('/api/events', { cache: 'no-store' });
    const data = await res.json();
    setEvents(Array.isArray(data?.events) ? data.events : []);
  }

  useEffect(() => {
    refresh();
  }, []);

  function changeMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, title }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data?.error === 'string' ? data.error : 'Fehler'
        );
      }
      const data = await res.json();
      setEvents(Array.isArray(data?.events) ? data.events : []);
      setTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler');
    } finally {
      setPending(false);
    }
  }

  async function onDelete(d: string) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: d }),
      });
      const data = await res.json();
      setEvents(Array.isArray(data?.events) ? data.events : []);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className='min-h-screen p-6 sm:p-10 mx-auto max-w-6xl'>
      <h1 className='text-2xl sm:text-3xl font-semibold mb-6'>
        VfL Bockum Tickets
      </h1>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
        <div className='lg:col-span-2 border rounded-xl p-4'>
          <div className='flex items-center justify-between mb-4'>
            <button
              onClick={() => changeMonth(-1)}
              className='px-3 py-1 rounded border'
            >
              «
            </button>
            <div className='font-medium'>
              {new Date(year, month).toLocaleDateString('de-DE', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <button
              onClick={() => changeMonth(1)}
              className='px-3 py-1 rounded border'
            >
              »
            </button>
          </div>
          <div className='grid grid-cols-7 text-center text-sm font-medium mb-1 opacity-80'>
            <div>Mo</div>
            <div>Di</div>
            <div>Mi</div>
            <div>Do</div>
            <div>Fr</div>
            <div>Sa</div>
            <div>So</div>
          </div>
          <div className='grid grid-cols-7 gap-[6px]'>
            {days.map((d, idx) => (
              <button
                key={`${d.date}-${idx}`}
                onClick={() => setDate(d.date)}
                className={`aspect-square rounded-lg border flex flex-col items-start p-2 text-left transition ${
                  d.inCurrentMonth ? '' : 'opacity-50'
                } ${d.isToday ? 'ring-2 ring-blue-500' : ''} ${
                  d.hasEvent
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300'
                    : ''
                }`}
              >
                <div className='text-sm'>{d.day}</div>
                {d.hasEvent ? (
                  <div className='mt-auto w-full text-xs truncate'>
                    {d.title}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </div>
        <div className='border rounded-xl p-4 space-y-4'>
          <form onSubmit={onSubmit} className='space-y-3'>
            <div className='space-y-2'>
              <label className='block text-sm'>Datum</label>
              <input
                type='date'
                value={date}
                onChange={e => setDate(e.target.value)}
                className='w-full border rounded px-3 py-2 bg-transparent'
                required
              />
            </div>
            <div className='space-y-2'>
              <label className='block text-sm'>Titel</label>
              <input
                type='text'
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder='Ticketverkauf'
                className='w-full border rounded px-3 py-2 bg-transparent'
              />
            </div>
            <button
              type='submit'
              disabled={pending}
              className='w-full rounded bg-black text-white dark:bg-white dark:text-black px-4 py-2 disabled:opacity-50'
            >
              Speichern
            </button>
            {error ? <p className='text-red-600 text-sm'>{error}</p> : null}
          </form>
          <div className='text-sm'>
            <div className='font-medium mb-1'>Kalenderfeed</div>
            <div className='space-y-1'>
              <a className='underline break-all' href='/calendar'>
                /calendar
              </a>
              <div className='opacity-80'>
                webcal://
                {typeof window !== 'undefined' ? window.location.host : ''}
                /calendar
              </div>
            </div>
          </div>
          <div>
            <div className='font-medium mb-2'>Einträge</div>
            <ul className='divide-y'>
              {events.length === 0 ? (
                <li className='py-2 text-sm opacity-80'>Keine Einträge</li>
              ) : (
                events.map(e => (
                  <li
                    key={e.id}
                    className='py-2 flex items-center justify-between gap-3'
                  >
                    <div className='min-w-0'>
                      <div className='font-medium truncate'>{e.title}</div>
                      <div className='text-sm opacity-80'>{e.date}</div>
                    </div>
                    <button
                      onClick={() => onDelete(e.date)}
                      className='text-red-600 text-sm border border-red-600 rounded px-3 py-1 hover:bg-red-50 dark:hover:bg-red-900/20'
                      disabled={pending}
                    >
                      Löschen
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
