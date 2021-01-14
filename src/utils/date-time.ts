import { zonedTimeToUtc } from 'date-fns-tz';

const dateTimeOptions = Intl.DateTimeFormat().resolvedOptions();

export function utc(local?: Date): Date {
  return zonedTimeToUtc(local || new Date(), dateTimeOptions.timeZone);
}
