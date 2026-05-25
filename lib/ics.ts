// Lightweight ICS parser. Returns normalized events.
// Avoids ical.js dependency to keep cold starts small. Handles VEVENT only.

export type IcsEvent = {
  uid: string;
  summary: string;
  description?: string;
  start?: Date;
  end?: Date;
  isAllDay: boolean;
};

function unfold(text: string): string {
  // RFC5545: lines beginning with space/tab are continuations
  return text.replace(/\r?\n[ \t]/g, "");
}

function parseDate(value: string, isDate: boolean): Date | undefined {
  // Forms: 20260406T130000Z, 20260406T130000, 20260406
  if (!value) return undefined;
  if (isDate || /^\d{8}$/.test(value)) {
    const y = +value.slice(0, 4), m = +value.slice(4, 6) - 1, d = +value.slice(6, 8);
    return new Date(Date.UTC(y, m, d));
  }
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return undefined;
  const [, Y, Mo, D, H, Mi, S, Z] = m;
  if (Z === "Z") return new Date(Date.UTC(+Y, +Mo - 1, +D, +H, +Mi, +S));
  return new Date(+Y, +Mo - 1, +D, +H, +Mi, +S);
}

export function parseIcs(raw: string): IcsEvent[] {
  const text = unfold(raw);
  const lines = text.split(/\r?\n/);
  const events: IcsEvent[] = [];
  let cur: Partial<IcsEvent> & { _allDay?: boolean } | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = { isAllDay: false };
    else if (line === "END:VEVENT") {
      if (cur && cur.uid && cur.summary) events.push(cur as IcsEvent);
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const left = line.slice(0, idx);
      const value = line.slice(idx + 1);
      const [name, ...params] = left.split(";");
      const isDateOnly = params.some((p) => p.toUpperCase() === "VALUE=DATE");
      switch (name) {
        case "UID": cur.uid = value; break;
        case "SUMMARY": cur.summary = unescapeIcs(value); break;
        case "DESCRIPTION": cur.description = unescapeIcs(value); break;
        case "DTSTART":
          cur.start = parseDate(value, isDateOnly);
          if (isDateOnly) cur.isAllDay = true;
          break;
        case "DTEND":
          cur.end = parseDate(value, isDateOnly);
          break;
      }
    }
  }
  return events;
}

function unescapeIcs(s: string): string {
  return s.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}
