const datesFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const datesMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const datesWeekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function datesFormatTime(time: number) {
  return datesFormat.format(new Date(time));
}

export function datesMonthShort(date: Date) {
  return (datesMonths[date.getUTCMonth()] ?? '').slice(0, 3);
}

export function datesWeekdayShort(date: Date) {
  return (datesWeekdays[date.getUTCDay()] ?? '').slice(0, 3);
}

export function datesDayShort(date: Date) {
  return `${datesWeekdayShort(date)} ${date.getUTCDate()} ${datesMonthShort(date)}`;
}

export function datesDayLong(date: Date) {
  return `${datesWeekdays[date.getUTCDay()] ?? ''} ${date.getUTCDate()} ${datesMonths[date.getUTCMonth()] ?? ''} ${date.getUTCFullYear()}`;
}

export function datesRange(first: Date, last: Date) {
  const start = `${first.getUTCDate()} ${datesMonthShort(first)}`;
  const end = `${last.getUTCDate()} ${datesMonthShort(last)} ${last.getUTCFullYear()}`;

  return first.getUTCFullYear() === last.getUTCFullYear() ? `${start} – ${end}` : `${start} ${first.getUTCFullYear()} – ${end}`;
}

export function datesDayMedium(date: Date) {
  return `${date.getUTCDate()} ${datesMonthShort(date)} ${date.getUTCFullYear()}`;
}

export function datesParseDay(text: string) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}:\d{2}))?/.exec(text);

  return parts ? { date: new Date(Date.UTC(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))), time: parts.at(4) ?? null } : null;
}
