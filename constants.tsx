
import { Category, EventType } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: EventType.DINING_SERVICE, label: 'SERVICIO DE COMEDOR', color: 'bg-emerald-500', icon: '🍽️', hasAutoManagement: true },
  { id: EventType.PRE_ELABORATION, label: 'PREELABORACIÓN', color: 'bg-slate-500', icon: '🔪', hasAutoManagement: false },
  { id: EventType.EXAM, label: 'EXAMEN', color: 'bg-rose-500', icon: '📝', hasAutoManagement: false },
  { id: EventType.THEORY, label: 'TEORÍA', color: 'bg-sky-500', icon: '📘', hasAutoManagement: false },
  { id: EventType.LOGISTICS, label: 'ACCIÓN LOGÍSTICA', color: 'bg-amber-400', icon: '🟡', hasAutoManagement: false },
  { id: EventType.AUTO_PREP, label: 'Preparación de Pedido', color: 'bg-indigo-400', icon: '📦', hasAutoManagement: false, isSystem: true },
  { id: EventType.AUTO_ALARM, label: 'Elaborar Pedido', color: 'bg-orange-500', icon: '⚠️', hasAutoManagement: false, isSystem: true },
  { id: EventType.AUTO_CRITICAL, label: 'HACER PEDIDO', color: 'bg-red-600', icon: '🚨', hasAutoManagement: false, isSystem: true },
  { id: EventType.AUTO_MENU_PREP, label: 'Preparación Recetario', color: 'bg-purple-400', icon: '📖', hasAutoManagement: false, isSystem: true },
];

export const AVAILABLE_COLORS = [
  'bg-emerald-500', 'bg-sky-500', 'bg-rose-500', 'bg-amber-400', 
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500',
  'bg-teal-500', 'bg-lime-500', 'bg-slate-500', 'bg-cyan-500'
];

export const MURCIA_HOLIDAYS = [
  '2025-09-16', '2025-10-12', '2025-11-01', '2025-12-06', '2025-12-08', '2025-12-25',
  '2026-01-01', '2026-01-06', '2026-03-19', '2026-04-02', '2026-04-03', '2026-04-07',
  '2026-05-01', '2026-06-09', '2026-08-15',
];

export const ACADEMIC_YEAR = {
  start: new Date(2025, 8, 1),
  end: new Date(2026, 7, 31),
};
