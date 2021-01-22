import { format } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

const dateTimeOptions = Intl.DateTimeFormat().resolvedOptions();

export function utc(local?: Date): Date {
  return zonedTimeToUtc(local || new Date(), dateTimeOptions.timeZone);
}

export function formatTz(date: Date, fmt: string, tz: string): string {
  return format(utcToZonedTime(date, tz), fmt);
}

export function formatUtc(date: Date): string {
  return formatTz(date, 'dd/MM/yyyy HH:mm', 'UTC');
}
