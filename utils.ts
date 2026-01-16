
import { format, addDays, subDays, startOfWeek, parseISO, differenceInDays } from 'date-fns';
import { MURCIA_HOLIDAYS } from './constants';

export const formatDate = (date: Date): string => format(date, 'yyyy-MM-dd');

export const isHoliday = (dateStr: string): boolean => {
  return MURCIA_HOLIDAYS.includes(dateStr);
};

// Lunes de la semana anterior a la fecha dada
export const getMondayPreviousWeek = (date: Date): Date => {
  const startOfThisWeek = startOfWeek(date, { weekStartsOn: 1 });
  return subDays(startOfThisWeek, 7);
};

// Viernes de la segunda semana anterior a la fecha dada
export const getFridayTwoWeeksBefore = (date: Date): Date => {
  const startOfThisWeek = startOfWeek(date, { weekStartsOn: 1 });
  return subDays(startOfThisWeek, 10); // Lunes actual - 10 días = Viernes de 2 semanas antes
};

// 24 días antes (Aviso crear menú)
export const getMenuCreationDate = (date: Date): Date => {
  return subDays(date, 24);
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const checkUrgency = (eventDate: Date, creationDate: Date = new Date()): boolean => {
  return differenceInDays(eventDate, creationDate) < 20;
};

// Función para generar enlace de Google Calendar
export const getGoogleCalendarUrl = (event: { title: string, date: string, notes?: string }) => {
  const base = "https://www.google.com/calendar/render?action=TEMPLATE";
  const start = event.date.replace(/-/g, "");
  return `${base}&text=${encodeURIComponent(event.title)}&dates=${start}/${start}&details=${encodeURIComponent(event.notes || '')}`;
};
