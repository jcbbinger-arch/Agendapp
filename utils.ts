
import { format, addDays, subDays, startOfWeek, nextDay, Day, parseISO, isBefore, differenceInDays } from 'date-fns';
import { MURCIA_HOLIDAYS } from './constants';

export const formatDate = (date: Date): string => format(date, 'yyyy-MM-dd');

export const isHoliday = (dateStr: string): boolean => {
  return MURCIA_HOLIDAYS.includes(dateStr);
};

export const getMondayBefore = (date: Date): Date => {
  const result = startOfWeek(date, { weekStartsOn: 1 });
  return result;
};

export const getFridayBefore = (date: Date): Date => {
  // If date is Friday, get the same Friday or previous? 
  // Standard logic: the closest Friday occurring before the date.
  let current = subDays(date, 1);
  while (current.getDay() !== 5) { // 5 = Friday
    current = subDays(current, 1);
  }
  return current;
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const checkUrgency = (eventDate: Date, creationDate: Date = new Date()): boolean => {
  return differenceInDays(eventDate, creationDate) < 20;
};
