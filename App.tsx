
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, LayoutDashboard, Settings, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle, Clock, Zap, Cpu, Copy, ArrowLeft, Download, Upload, User, School, Camera, Bell, BellRing, ExternalLink, ListChecks, Info, Sparkles, Edit3, Palette, CalendarDays, ArrowRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, eachMonthOfInterval, addDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { EventType, CalendarEvent, Category, AppSettings } from './types';
import { DEFAULT_CATEGORIES, ACADEMIC_YEAR, AVAILABLE_COLORS } from './constants';
import { formatDate, isHoliday, generateId, getMondayPreviousWeek, getFridayTwoWeeksBefore, getMenuCreationDate, getGoogleCalendarUrl } from './utils';

// --- CLAVES DE ALMACENAMIENTO ESTABLES ---
const STORAGE_KEYS = {
  EVENTS: 'ies_murcia_prod_events',
  SETTINGS: 'ies_murcia_prod_settings',
  CATEGORIES: 'ies_murcia_prod_categories',
  NOTIFIED: 'ies_murcia_prod_notified'
};

// --- COMPONENTE: PUENTE IA (DIGITAL BRIDGE) ---

const AIBridge: React.FC<{ onImport: (events: any[]) => void }> = ({ onImport }) => {
  const navigate = useNavigate();
  const [jsonInput, setJsonInput] = useState('');
  const [copyStatus, setCopyStatus] = useState('COPIAR PROMPT MAESTRO');

  const MASTER_PROMPT = `Actúa como un experto en extracción de datos. Analiza las imágenes/PDF del calendario escolar 2025-26 del IES (Murcia). 
Tu tarea es identificar cada evento marcado con colores o texto (Evaluaciones, Exámenes, Festivos, Inicio/Fin de curso, etc.).
Genera un array JSON con esta estructura exacta para cada evento:
{
  "title": "Nombre del evento",
  "date": "YYYY-MM-DD",
  "notes": "Detalles adicionales si los hay",
  "type": "DINING_SERVICE" | "EXAM" | "THEORY" | "LOGISTICS" | "PRE_ELABORATION"
}
Usa estos mapeos:
- Si es evaluación/examen: "EXAM"
- Si es servicio de comedor: "DINING_SERVICE"
- Si es teoría o inicio de curso: "THEORY"
- Otros eventos de gestión: "LOGISTICS"
IMPORTANTE: Devuelve SOLO el bloque de código JSON, sin texto explicativo. Limpia cualquier ruido del OCR.`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(MASTER_PROMPT);
    setCopyStatus('¡COPIADO!');
    setTimeout(() => setCopyStatus('COPIAR PROMPT MAESTRO'), 2000);
  };

  const handleImport = () => {
    try {
      let cleanJson = jsonInput.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        onImport(parsed);
        alert(`¡Éxito! Se han procesado ${parsed.length} eventos oficiales.`);
        navigate('/calendar');
      } else {
        alert("El formato debe ser un Array de objetos JSON.");
      }
    } catch (e) {
      alert("Error en el formato JSON. Asegúrate de que la IA te haya devuelto un código válido.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate(-1)} className="p-3 hover:bg-white rounded-full transition-colors shadow-sm"><ArrowLeft size={24} /></button>
        <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Puente Digital IA</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Importación Masiva de Calendario</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-2xl min-h-[500px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20">
                <Sparkles size={28} className="text-white" />
            </div>
            <h3 className="text-4xl font-black mb-6 leading-tight">1. COPIA EL <span className="text-emerald-400">PROMPT</span></h3>
            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
                Copia este comando y envíaselo a Gemini, ChatGPT o Claude junto con la foto o PDF de tu calendario escolar. La IA extraerá los datos por ti.
            </p>
          </div>
          <button onClick={copyPrompt} className="relative z-10 w-full py-6 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all active:scale-95 shadow-xl">
            <Copy size={20} /> {copyStatus}
          </button>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="bg-white rounded-[3rem] p-10 flex flex-col justify-between shadow-xl border border-slate-100 min-h-[500px]">
          <div>
            <h3 className="text-3xl font-black text-slate-800 mb-6 leading-tight">2. PEGA EL <span className="text-emerald-600">JSON</span></h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Resultado de la IA</p>
            <textarea 
                value={jsonInput} 
                onChange={(e) => setJsonInput(e.target.value)} 
                placeholder='[ { "title": "...", "date": "...", ... } ]'
                className="w-full h-48 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-[10px] font-mono outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none shadow-inner" 
            />
          </div>
          <button 
            disabled={!jsonInput.trim()} 
            onClick={handleImport} 
            className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
          >
            <Cpu size={20} /> INICIAR IMPORTACIÓN
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const MiniMonth: React.FC<{ date: Date, events?: CalendarEvent[], categories: Category[], onDayClick?: (d: Date) => void }> = ({ date, events = [], categories, onDayClick }) => {
  const start = startOfMonth(date);
  const days = eachDayOfInterval({ start, end: endOfMonth(date) });
  const startDay = (start.getDay() + 6) % 7;
  return (
    <div className="text-[9px] w-full bg-white p-3 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
      <div className="font-black text-slate-800 text-center border-b pb-1.5 mb-2 uppercase tracking-widest text-[10px]">{format(date, 'MMMM', { locale: es })}</div>
      <div className="grid grid-cols-7 gap-0.5">
        {['L','M','X','J','V','S','D'].map(d => <div key={d} className="text-center font-black text-slate-300 mb-1">{d}</div>)}
        {Array.from({ length: startDay }).map((_, i) => <div key={i} />)}
        {days.map(d => {
          const dStr = formatDate(d);
          const dayEvents = events.filter(e => e.date === dStr);
          const iesEvent = dayEvents.find(e => e.isIES);
          const isSelected = isToday(d);
          const holiday = isHoliday(dStr);
          
          const iesColor = iesEvent ? categories.find(c => c.id === iesEvent.type)?.color.replace('bg-', 'bg-') + '/20' : '';

          return (
            <div 
              key={dStr} 
              onClick={() => onDayClick?.(d)} 
              className={`h-6 flex items-center justify-center cursor-pointer rounded-md transition-all relative 
                ${holiday ? 'text-red-500 font-bold bg-red-50/50' : ''} 
                ${iesColor ? iesColor + ' ring-1 ring-inset ring-black/5' : ''}
                ${isSelected ? 'bg-emerald-600 text-white font-black z-10 shadow-md scale-110' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              {format(d, 'd')}
              {dayEvents.some(e => !e.isIES && !e.isAutoGenerated) && !isSelected && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-slate-900 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Header: React.FC<{ settings: AppSettings }> = ({ settings }) => (
  <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm">
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-12 h-12 overflow-hidden rounded-xl bg-emerald-600 shadow-sm border border-slate-100">
        {settings.iesLogo ? <img src={settings.iesLogo} className="w-full h-full object-cover" /> : <School size={24} className="text-white" />}
      </div>
      <div>
        <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase leading-none mb-1">{settings.iesName || 'IES MURCIA'}</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Gestión Docente y Logística</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <Link to="/ai-bridge" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95">
        <Sparkles size={14} className="text-emerald-400" /> IA BRIDGE
      </Link>
      <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
        <div className="text-right hidden md:block">
            <p className="text-[11px] font-black text-slate-800 uppercase">{settings.profName || 'PROFESOR'}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">FP Hostelería</p>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-200">
          <img src={settings.profPhoto || "https://picsum.photos/seed/chef/40/40"} alt="Avatar" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  </header>
);

const Sidebar: React.FC = () => {
  const location = useLocation();
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Inicio', path: '/' },
    { icon: <Calendar size={20} />, label: 'Agenda', path: '/calendar' },
    { icon: <Settings size={20} />, label: 'Ajustes', path: '/settings' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t md:relative md:w-64 md:h-screen md:border-t-0 md:border-r shadow-2xl md:shadow-none">
      <div className="flex md:flex-col justify-around md:justify-start p-3 md:p-6 gap-2">
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm ring-1 ring-emerald-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
            {item.icon} <span className="hidden md:block text-sm">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

// --- APP PRINCIPAL ---

const App: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch { return DEFAULT_CATEGORIES; }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : { iesName: 'IES MURCIA', iesLogo: '', profName: 'PROFESOR FP', profPhoto: '' };
    } catch { return { iesName: 'IES MURCIA', iesLogo: '', profName: 'PROFESOR FP', profPhoto: '' }; }
  });

  const [notified, setNotified] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFIED);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.NOTIFIED, JSON.stringify(notified)); }, [notified]);

  const addEvent = (eventData: any) => {
    const mainId = generateId();
    const newEvent: CalendarEvent = { ...eventData, id: mainId, isDone: false };
    let additional: CalendarEvent[] = [];

    if (eventData.type === EventType.DINING_SERVICE) {
      const serviceDate = parseISO(eventData.date);
      additional.push({ id: generateId(), parentId: mainId, title: `📖 CREAR MENÚ: ${eventData.title}`, type: EventType.AUTO_MENU_PREP, date: formatDate(getMenuCreationDate(serviceDate)), notes: 'Fase de diseño.', isDone: false, isAutoGenerated: true });
      additional.push({ id: generateId(), parentId: mainId, title: `⚠️ TERMINAR PEDIDO: ${eventData.title}`, type: EventType.AUTO_ALARM, date: formatDate(getFridayTwoWeeksBefore(serviceDate)), notes: 'Cierre de stock.', isDone: false, isAutoGenerated: true });
      additional.push({ id: generateId(), parentId: mainId, title: `🚨 HACER PEDIDO: ${eventData.title}`, type: EventType.AUTO_CRITICAL, date: formatDate(getMondayPreviousWeek(serviceDate)), notes: 'Enviar a proveedores.', isDone: false, isAutoGenerated: true });
    }

    if (eventData.customReminders && Array.isArray(eventData.customReminders)) {
        eventData.customReminders.forEach((rDate: string) => {
            additional.push({ id: generateId(), parentId: mainId, title: `🔔 Recordatorio: ${eventData.title}`, type: EventType.LOGISTICS, date: rDate, notes: 'Aviso manual.', isDone: false, isAutoGenerated: true });
        });
    }

    setEvents(prev => [...prev, newEvent, ...additional]);
  };

  const importFromAI = (importedEvents: any[]) => {
    importedEvents.forEach(ev => {
        addEvent({
            title: ev.title,
            type: ev.type,
            date: ev.date,
            notes: ev.notes || '',
            isIES: true
        });
    });
  };

  return (
    <Router>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header settings={settings} />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard events={events} categories={categories} onToggle={(id) => setEvents(evs => evs.map(e => e.id === id ? {...e, isDone: !e.isDone} : e))} onDelete={(id) => setEvents(evs => evs.filter(e => e.id !== id && e.parentId !== id))} />} />
              <Route path="/calendar" element={<CalendarView events={events} categories={categories} onAdd={addEvent} onDelete={(id) => setEvents(evs => evs.filter(e => e.id !== id && e.parentId !== id))} onToggle={(id) => setEvents(evs => evs.map(e => e.id === id ? {...e, isDone: !e.isDone} : e))} />} />
              <Route path="/settings" element={<SettingsView settings={settings} setSettings={setSettings} categories={categories} setCategories={setCategories} onExport={() => {
                const data = { events, settings, categories };
                const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'backup.json'; link.click();
              }} onImport={(data) => { 
                if (data.events) setEvents(data.events); 
                if (data.settings) setSettings(data.settings); 
                if (data.categories) setCategories(data.categories);
              }} />} />
              <Route path="/ai-bridge" element={<AIBridge onImport={importFromAI} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

// --- VISTA: DASHBOARD REDISEÑADO ---

const Dashboard: React.FC<{ events: CalendarEvent[], categories: Category[], onToggle: (id: string) => void, onDelete: (id: string) => void }> = ({ events, categories, onToggle, onDelete }) => {
  const navigate = useNavigate();
  const todayStr = formatDate(new Date());
  
  const upcoming = useMemo(() => events
    .filter(e => !e.isDone && e.date >= todayStr)
    .sort((a,b) => a.date.localeCompare(b.date))
    .slice(0, 15), [events, todayStr]);

  const academicMonths = useMemo(() => eachMonthOfInterval({ start: ACADEMIC_YEAR.start, end: ACADEMIC_YEAR.end }), []);

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      
      {/* HEADER DINÁMICO */}
      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter">Panel de Control</h2>
            <p className="text-emerald-400 font-bold uppercase tracking-[0.3em] text-[11px] flex items-center gap-2">
                <Sparkles size={16}/> Sincronización académica 2025/2026 activa
            </p>
          </div>
          <div className="flex gap-6">
            <div className="bg-white/5 border border-white/10 px-8 py-5 rounded-3xl backdrop-blur-xl hover:bg-white/10 transition-all flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Docentes</span>
                <span className="text-3xl font-black">{events.filter(e => !e.isIES && !e.isAutoGenerated).length}</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-8 py-5 rounded-3xl backdrop-blur-xl hover:bg-emerald-500/20 transition-all flex flex-col gap-1">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Oficiales IES</span>
                <span className="text-3xl font-black text-emerald-400">{events.filter(e => e.isIES).length}</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        
        {/* LADO IZQUIERDO: CALENDARIO ANUAL COMPLETO */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CalendarDays size={16} className="text-slate-900"/> Curso Académico Completo
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Septiembre 2025 - Agosto 2026</span>
          </div>
          
          <div className="bg-white/60 border border-slate-200 rounded-[3rem] p-6 md:p-8 shadow-sm backdrop-blur-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {academicMonths.map(m => (
                <MiniMonth 
                    key={m.toString()} 
                    date={m} 
                    events={events} 
                    categories={categories} 
                    onDayClick={(d) => navigate('/calendar')}
                />
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-wrap gap-8 items-center justify-center shadow-sm">
             <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-emerald-100 ring-1 ring-emerald-200"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Eventos IES (Oficial)</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-red-50 ring-1 ring-red-100"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Festivos Murcia</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tareas Docente</span>
             </div>
          </div>
        </div>

        {/* LADO DERECHO: AGENDA DINÁMICA CON "CALLOUTS" */}
        <div className="xl:col-span-4 space-y-8">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} className="text-slate-900"/> Agenda Próxima
            </h3>
            <button onClick={() => navigate('/calendar')} className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Ver todo</button>
          </div>

          <div className="relative space-y-4">
            {/* Próximo evento destacado (Callout Bubble) */}
            {upcoming.length > 0 && (
                <div className="relative z-10 bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-200 group overflow-hidden animate-in slide-in-from-right duration-500">
                    <div className="absolute top-0 right-0 p-8 text-white/10 group-hover:scale-125 transition-transform duration-700">
                        {categories.find(c => c.id === upcoming[0].type)?.icon || <Sparkles size={100}/>}
                    </div>
                    <div className="relative z-10 space-y-4">
                        <span className="bg-white/20 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Siguiente Prioridad</span>
                        <h4 className="text-2xl font-black leading-tight uppercase tracking-tight">{upcoming[0].title}</h4>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-white/60 uppercase">Fecha</span>
                                <span className="text-sm font-black">{format(parseISO(upcoming[0].date), "d MMM", { locale: es })}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-white/60 uppercase">Estado</span>
                                <span className="text-sm font-black">Pendiente</span>
                            </div>
                        </div>
                        <button onClick={() => onToggle(upcoming[0].id)} className="w-full bg-white text-emerald-700 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all">
                            <CheckCircle size={16}/> Marcar como Completado
                        </button>
                    </div>
                </div>
            )}

            {/* Timeline Vertical */}
            <div className="space-y-4 relative pl-8">
              {/* Línea de conexión estética */}
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200/50 rounded-full"></div>
              
              {upcoming.slice(1).map((ev, idx) => (
                <div key={ev.id} className="group relative flex items-center gap-6 bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    {/* Indicador de conexión timeline */}
                    <div className={`absolute -left-[2.35rem] w-5 h-5 rounded-full border-4 border-slate-50 ${ev.isIES ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-300'} z-20`}></div>
                    
                    <div className="shrink-0 flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-800 uppercase">{format(parseISO(ev.date), "MMM", {locale: es})}</span>
                        <span className="text-lg font-black text-slate-900 leading-none">{format(parseISO(ev.date), "d")}</span>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            {ev.isIES && <span className="text-[7px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded uppercase">IES</span>}
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{categories.find(c => c.id === ev.type)?.label}</span>
                        </div>
                        <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate leading-tight">{ev.title}</h5>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                        <button onClick={() => onToggle(ev.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                            <CheckCircle size={14}/>
                        </button>
                    </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- VISTA: CALENDARIO ---

const CalendarView: React.FC<{ events: CalendarEvent[], categories: Category[], onAdd: (e: any) => void, onDelete: (id: string) => void, onToggle: (id: string) => void }> = ({ events, categories, onAdd, onDelete, onToggle }) => {
  const [viewMode, setViewMode] = useState<'month'|'year'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customAvisos, setCustomAvisos] = useState<string[]>([]);
  
  const dayEvents = useMemo(() => events.filter(e => e.date === formatDate(selectedDay)), [events, selectedDay]);
  const academicMonths = useMemo(() => eachMonthOfInterval({ start: ACADEMIC_YEAR.start, end: ACADEMIC_YEAR.end }), []);

  return (
    <div className="h-full flex flex-col p-6 md:p-10">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4 shrink-0">
          <div className="flex bg-white border border-slate-200 rounded-[1.5rem] p-1 shadow-sm overflow-hidden shrink-0">
            <button onClick={() => setViewMode('month')} className={`px-8 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Mes Detalle</button>
            <button onClick={() => setViewMode('year')} className={`px-8 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'year' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Vista Anual</button>
          </div>

          {viewMode === 'month' && (
            <div className="flex items-center gap-6 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-50 text-slate-400"><ChevronLeft /></button>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest min-w-[160px] text-center">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-50 text-slate-400"><ChevronRight /></button>
            </div>
          )}

          <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 hover:scale-105 transition-all"><Plus size={18}/> NUEVO EVENTO</button>
      </div>

      {viewMode === 'year' ? (
        <div className="flex-1 bg-white/30 rounded-[3rem] p-4 md:p-8 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {academicMonths.map(m => (
            <MiniMonth key={m.toString()} date={m} events={events} categories={categories} onDayClick={(d) => { setSelectedDay(d); setCurrentMonth(d); setViewMode('month'); }} />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <div className="grid grid-cols-7 gap-1">
                  {['L','M','X','J','V','S','D'].map(d => <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase py-3 tracking-widest">{d}</div>)}
                  {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => <div key={i} />)}
                  {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(day => {
                    const dStr = formatDate(day);
                    const isSelected = isSameDay(day, selectedDay);
                    const dayEvents = events.filter(e => e.date === dStr);
                    const holiday = isHoliday(dStr);
                    const iesEvent = dayEvents.find(e => e.isIES);
                    
                    const iesShading = iesEvent ? categories.find(c => c.id === iesEvent.type)?.color.replace('bg-', 'bg-') + '/10' : '';

                    return (
                      <div key={dStr} onClick={() => setSelectedDay(day)} className={`h-14 flex flex-col items-center justify-center cursor-pointer rounded-2xl transition-all relative 
                        ${iesShading ? iesShading : ''}
                        ${isSelected ? 'bg-slate-900 text-white shadow-xl scale-110 z-10' : holiday ? 'bg-red-50 text-red-500 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}>
                        <span className="text-xs font-black">{format(day, 'd')}</span>
                        {dayEvents.some(e => !e.isIES && !e.isAutoGenerated) && !isSelected && (
                            <div className="w-1.5 h-1.5 bg-slate-900 rounded-full mt-1 border border-white" />
                        )}
                        {iesEvent && !isSelected && (
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
            
            <div className="mt-6 p-6 bg-white border border-slate-100 rounded-[2rem] space-y-3">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Leyenda</h4>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-emerald-100"></div> Sombreado: Oficial IES
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-red-50"></div> Rojo: Festivo Murcia
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-slate-900"></div> Punto: Evento Profesor
                </div>
            </div>
          </div>
          
          <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden">
              <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{format(selectedDay, "EEEE, d MMMM", { locale: es })}</h3>
                <div className="flex gap-2">
                    {isHoliday(formatDate(selectedDay)) && <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Festivo</span>}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dayEvents.length} Entradas</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {dayEvents.map(ev => (
                  <div key={ev.id} className={`flex items-center justify-between p-5 hover:bg-slate-50 rounded-3xl transition-all group border ${ev.isIES ? 'bg-emerald-50/20 border-emerald-50' : 'border-transparent hover:border-slate-100'}`}>
                    <div className="flex items-center gap-5">
                      <div className={`w-1.5 h-12 rounded-full ${categories.find(c => c.id === ev.type)?.color || 'bg-slate-200'}`} />
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase leading-none tracking-tight">
                            {ev.isIES && <span className="text-[8px] text-emerald-600 mr-2">● IES</span>}
                            {ev.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{categories.find(c => c.id === ev.type)?.label || 'Evento'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => window.open(getGoogleCalendarUrl(ev), '_blank')} className="p-3 text-slate-300 hover:text-emerald-600 bg-white border rounded-xl"><ExternalLink size={16}/></button>
                      <button onClick={() => onToggle(ev.id)} className={`p-3 rounded-xl border ${ev.isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'text-slate-300 hover:text-emerald-500 bg-white'}`}><CheckCircle size={16}/></button>
                      <button onClick={() => onDelete(ev.id)} className="p-3 text-slate-200 hover:text-red-500 bg-white border rounded-xl"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
                {dayEvents.length === 0 && <div className="p-20 text-center text-slate-300 italic text-sm">No hay eventos para este día.</div>}
              </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-8">Registrar Nuevo</h3>
            <form onSubmit={(e) => { 
                e.preventDefault(); 
                const fd = new FormData(e.currentTarget); 
                onAdd({ 
                    title: (fd.get('title') as string).toUpperCase(), 
                    type: fd.get('type') as string, 
                    date: formatDate(selectedDay), 
                    notes: fd.get('notes') as string,
                    customReminders: customAvisos,
                    isIES: false 
                }); 
                setCustomAvisos([]);
                setIsModalOpen(false); 
            }} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Título del Evento</label>
                <input required name="title" placeholder="EJ: SERVICIO CARTA" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                   <select name="type" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-black text-[10px] uppercase outline-none">
                      {categories.filter(c => !c.isSystem).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                   <input type="date" value={formatDate(selectedDay)} onChange={(e) => setSelectedDay(parseISO(e.target.value))} className="w-full p-5 bg-slate-50 border-none rounded-2xl text-xs font-black outline-none" />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BellRing size={14} className="text-emerald-500"/> Avisos Manuales</h4>
                 <div className="flex gap-2">
                    <input type="date" id="newAvisoManual" className="flex-1 p-3 bg-white border-none rounded-xl text-[10px] font-black outline-none" />
                    <button type="button" onClick={() => {
                        const val = (document.getElementById('newAvisoManual') as HTMLInputElement).value;
                        if(val) setCustomAvisos([...customAvisos, val]);
                    }} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-emerald-600 transition-all"><Plus size={16}/></button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {customAvisos.map(a => <div key={a} className="bg-white border px-3 py-1 rounded-lg text-[9px] font-black text-slate-500 flex items-center gap-2">{format(parseISO(a), "d MMM", {locale: es})} <button onClick={() => setCustomAvisos(customAvisos.filter(x => x !== a))}><Trash2 size={12} className="text-red-400"/></button></div>)}
                 </div>
              </div>

              <textarea name="notes" placeholder="NOTAS ADICIONALES..." className="w-full h-24 p-5 bg-slate-50 border-none rounded-2xl text-[11px] font-medium outline-none resize-none shadow-inner" />
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl hover:bg-emerald-700 transition-all active:scale-95">Guardar en Agenda</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- VISTA: AJUSTES ---

const SettingsView: React.FC<{ 
    settings: AppSettings, 
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>, 
    categories: Category[], 
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>,
    onExport: () => void, 
    onImport: (data: any) => void 
}> = ({ settings, setSettings, categories, setCategories, onExport, onImport }) => {
  const backupRef = useRef<HTMLInputElement>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatColor, setNewCatColor] = useState(AVAILABLE_COLORS[0]);
  const [newCatIcon, setNewCatIcon] = useState('🔖');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>, field: 'iesLogo'|'profPhoto') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSettings(prev => ({ ...prev, [field]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCategory = () => {
    if (!newCatLabel.trim()) return;
    if (editingCategory) {
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, label: newCatLabel.toUpperCase(), color: newCatColor, icon: newCatIcon } : c));
    } else {
        const newId = generateId().toUpperCase();
        setCategories(prev => [...prev, { id: newId, label: newCatLabel.toUpperCase(), color: newCatColor, icon: newCatIcon, hasAutoManagement: false }]);
    }
    setEditingCategory(null);
    setNewCatLabel('');
    setIsFormOpen(false);
  };

  const deleteCategory = (id: string) => {
    if (confirm("¿Eliminar esta categoría? Los eventos asociados no se borrarán pero perderán el color.")) {
        setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10 pb-32">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Ajustes</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Configuración del Sistema</p>
        </div>
        <button onClick={() => Notification.requestPermission()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-600 transition-all">
            <Bell size={16}/> Permisos de Notificación
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><School size={16} className="text-emerald-500"/> Branding IES</h3>
          <div className="flex items-center gap-6">
            <div className="relative group w-24 h-24 rounded-3xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
              {settings.iesLogo ? <img src={settings.iesLogo} className="w-full h-full object-cover" /> : <Camera className="text-slate-300" />}
              <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer text-white shadow-inner"><Upload size={20} /><input type="file" className="hidden" onChange={e => handleImage(e, 'iesLogo')} /></label>
            </div>
            <div className="flex-1 space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre del Centro</label>
                <input value={settings.iesName} onChange={e => setSettings(s => ({...s, iesName: e.target.value}))} className="w-full p-4 bg-slate-50 border-none rounded-xl text-xs font-black uppercase outline-none focus:ring-2 ring-emerald-500/10" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><User size={16} className="text-indigo-500"/> Perfil Docente</h3>
          <div className="flex items-center gap-6">
            <div className="relative group w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
              {settings.profPhoto ? <img src={settings.profPhoto} className="w-full h-full object-cover" /> : <Camera className="text-slate-300" />}
              <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer text-white shadow-inner"><Upload size={20} /><input type="file" className="hidden" onChange={e => handleImage(e, 'profPhoto')} /></label>
            </div>
            <div className="flex-1 space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre del Profesor</label>
                <input value={settings.profName} onChange={e => setSettings(s => ({...s, profName: e.target.value}))} className="w-full p-4 bg-slate-50 border-none rounded-xl text-xs font-black uppercase outline-none focus:ring-2 ring-indigo-500/10" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
        <div className="flex justify-between items-center border-b pb-6">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
            <Palette size={20} className="text-emerald-500" /> Gestión de Categorías
          </h3>
          <button 
            onClick={() => { setEditingCategory(null); setNewCatLabel(''); setIsFormOpen(true); }} 
            className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-all"
          >
            <Plus size={16} /> Nueva Categoría
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.filter(c => !c.isSystem).map(cat => (
            <div key={cat.id} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:border-emerald-200 transition-all group relative">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center text-xl shadow-lg shadow-black/5`}>
                  {cat.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{cat.label}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {cat.id}</p>
                </div>
              </div>
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => {
                  setEditingCategory(cat);
                  setNewCatLabel(cat.label);
                  setNewCatColor(cat.color);
                  setNewCatIcon(cat.icon);
                }} className="p-2 bg-white text-slate-400 hover:text-emerald-600 rounded-lg shadow-sm"><Edit3 size={14}/></button>
                <button onClick={() => deleteCategory(cat.id)} className="p-2 bg-white text-slate-400 hover:text-red-500 rounded-lg shadow-sm"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>

        {(editingCategory || isFormOpen) && (
          <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-[0.2em]">{editingCategory ? 'Editando Categoría' : 'Nueva Categoría'}</h4>
                <button onClick={() => { setEditingCategory(null); setIsFormOpen(false); }} className="text-emerald-400 hover:text-emerald-800"><Plus size={20} className="rotate-45"/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Icono</label>
                    <input value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} className="w-full p-4 bg-white border-none rounded-xl text-center text-xl shadow-inner outline-none" placeholder="🍽️" />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Etiqueta</label>
                    <input value={newCatLabel} onChange={e => setNewCatLabel(e.target.value.toUpperCase())} className="w-full p-4 bg-white border-none rounded-xl font-black text-xs uppercase shadow-inner outline-none focus:ring-2 ring-emerald-500/20" placeholder="NOMBRE CATEGORÍA" />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Color</label>
                    <div className="flex flex-wrap gap-2 p-2 bg-white rounded-xl">
                        {AVAILABLE_COLORS.slice(0, 8).map(col => (
                            <button key={col} onClick={() => setNewCatColor(col)} className={`w-6 h-6 rounded-full ${col} ${newCatColor === col ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`} />
                        ))}
                    </div>
                </div>
            </div>
            <button onClick={handleSaveCategory} className="w-full mt-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-200 hover:scale-105 transition-all">
                {editingCategory ? 'Actualizar Categoría' : 'Añadir Categoría'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Respaldo de Datos</h3>
          <p className="text-slate-400 text-sm max-w-sm">Descarga una copia de seguridad para restaurar tus datos en otro navegador o dispositivo.</p>
        </div>
        <div className="relative z-10 flex gap-4 w-full md:w-auto">
          <button onClick={onExport} className="flex-1 md:flex-none px-10 py-5 bg-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"><Download size={20}/> Exportar</button>
          <button onClick={() => backupRef.current?.click()} className="flex-1 md:flex-none px-10 py-5 bg-white/10 border border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-3"><Upload size={20}/> Importar</button>
          <input ref={backupRef} type="file" accept=".json" className="hidden" onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = ev => onImport(JSON.parse(ev.target?.result as string));
              reader.readAsText(file);
            }
          }} />
        </div>
      </div>
    </div>
  );
};

export default App;
