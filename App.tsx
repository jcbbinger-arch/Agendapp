
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, LayoutDashboard, Settings, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle, Clock, Briefcase, Zap, Cpu, Copy, Import, ArrowLeft, Sparkles, Grid, Download, Upload, User, School, Camera } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, subDays, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { EventType, CalendarEvent, Category, AppSettings } from './types';
import { DEFAULT_CATEGORIES, AVAILABLE_COLORS, ACADEMIC_YEAR } from './constants';
import { formatDate, isHoliday, generateId, getMondayBefore, getFridayBefore, checkUrgency } from './utils';

// --- COMPONENTES COMPARTIDOS ---

const Header: React.FC<{ settings: AppSettings }> = ({ settings }) => (
  <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm">
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-12 h-12 overflow-hidden rounded-xl bg-emerald-600 shadow-sm border border-slate-100">
        {settings.iesLogo ? (
          <img src={settings.iesLogo} alt="IES Logo" className="w-full h-full object-cover" />
        ) : (
          <School size={24} className="text-white" />
        )}
      </div>
      <div>
        <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase leading-none mb-1">{settings.iesName || 'IES MURCIA'}</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Gestión de Hostelería 25/26</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <Link to="/ai-bridge" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
        <Cpu size={14} /> IA BRIDGE
      </Link>
      <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
        <div className="text-right hidden md:block">
          <p className="text-[11px] font-black text-slate-800 uppercase">{settings.profName || 'PROFESOR'}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Agenda Docente</p>
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
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Calendar size={20} />, label: 'Calendario', path: '/calendar' },
    { icon: <Settings size={20} />, label: 'Ajustes', path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t md:relative md:w-64 md:h-screen md:border-t-0 md:border-r">
      <div className="flex md:flex-col justify-around md:justify-start p-3 md:p-6 gap-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm ring-1 ring-emerald-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'}`}>
              {item.icon}
              <span className="hidden md:block text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

// --- VISTA: PUENTE DIGITAL IA ---

const AIBridge: React.FC<{ onImport: (events: any[]) => void }> = ({ onImport }) => {
  const navigate = useNavigate();
  const [jsonInput, setJsonInput] = useState('');
  const [copyStatus, setCopyStatus] = useState('COPIAR PROMPT MAESTRO');

  const MASTER_PROMPT = `Actúa como un experto en extracción de datos. Analiza el calendario escolar 2025-26 del IES. Identifica eventos (Evaluaciones, Exámenes, Festivos, Servicios de Comedor). Devuelve un array JSON: { "title": string, "date": "YYYY-MM-DD", "type": "DINING_SERVICE"|"EXAM"|"THEORY"|"LOGISTICS" }. IMPORTANTE: Solo JSON, sin texto extra.`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(MASTER_PROMPT);
    setCopyStatus('¡COPIADO!');
    setTimeout(() => setCopyStatus('COPIAR PROMPT MAESTRO'), 2000);
  };

  const handleImport = () => {
    try {
      let cleanJson = jsonInput.replace(/```json|```/g, '').trim();
      cleanJson = cleanJson.replace(/\[cite.*?\]/g, ''); 
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        onImport(parsed);
        alert(`Importados ${parsed.length} eventos correctamente.`);
        navigate('/calendar');
      }
    } catch (e) { alert("Error en el formato JSON. Asegúrate de pegar solo el array de la IA."); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Digitalización con IA</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-2xl min-h-[450px]">
          <div>
            <h3 className="text-3xl font-black mb-6">1. COPIA EL <span className="text-emerald-400">PROMPT</span></h3>
            <p className="text-slate-400 font-medium">Copia este comando y envíaselo a Gemini o GPT junto con la foto de tu calendario escolar PDF o papel.</p>
          </div>
          <button onClick={copyPrompt} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all"><Copy size={18} /> {copyStatus}</button>
        </div>
        <div className="bg-white rounded-[2.5rem] p-10 flex flex-col justify-between shadow-xl border border-slate-100 min-h-[450px]">
          <div>
            <h3 className="text-3xl font-black text-slate-800 mb-6">2. PEGA EL <span className="text-emerald-600">JSON</span></h3>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder="Pega el código JSON aquí..." className="w-full h-40 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-[11px] font-mono outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none shadow-inner" />
          </div>
          <button disabled={!jsonInput.trim()} onClick={handleImport} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:bg-emerald-700 transition-all">IMPORTAR TODO</button>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

const App: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('ies_murcia_v5_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('ies_murcia_v5_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ies_murcia_v5_settings');
    return saved ? JSON.parse(saved) : { iesName: 'IES MURCIA', iesLogo: '', profName: 'PROFESOR FP', profPhoto: '' };
  });

  useEffect(() => { localStorage.setItem('ies_murcia_v5_events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('ies_murcia_v5_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('ies_murcia_v5_settings', JSON.stringify(settings)); }, [settings]);

  const addEvent = (eventData: Omit<CalendarEvent, 'id' | 'isDone'>) => {
    const mainId = generateId();
    const category = categories.find(c => c.id === eventData.type);
    const newEvent: CalendarEvent = { ...eventData, id: mainId, isDone: false };
    
    let additional: CalendarEvent[] = [];
    if (category?.hasAutoManagement) {
      const date = parseISO(eventData.date);
      // Lógica de gestión logística automática
      additional.push({ id: generateId(), parentId: mainId, title: '🚨 HACER PEDIDO', type: EventType.AUTO_CRITICAL, date: formatDate(getMondayBefore(date)), notes: `Crítico para: ${eventData.title}`, isDone: false, isAutoGenerated: true });
      additional.push({ id: generateId(), parentId: mainId, title: '⚠️ Elaborar Pedido', type: EventType.AUTO_ALARM, date: formatDate(getFridayBefore(date)), notes: `Revisión stock`, isDone: false, isAutoGenerated: true });
    }
    setEvents(prev => [...prev, newEvent, ...additional]);
  };

  const importFromAI = (imported: any[]) => {
    const newEvs = imported.map(item => ({ ...item, id: generateId(), isDone: false }));
    setEvents(prev => [...prev, ...newEvs]);
  };

  return (
    <Router>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header settings={settings} />
          <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
            <Routes>
              <Route path="/" element={<Dashboard events={events} onToggle={(id) => setEvents(evs => evs.map(e => e.id === id ? {...e, isDone: !e.isDone} : e))} onDelete={(id) => setEvents(evs => evs.filter(e => e.id !== id && e.parentId !== id))} categories={categories} />} />
              <Route path="/calendar" element={<CalendarView events={events} categories={categories} onAdd={addEvent} onDelete={(id) => setEvents(evs => evs.filter(e => e.id !== id && e.parentId !== id))} onToggle={(id) => setEvents(evs => evs.map(e => e.id === id ? {...e, isDone: !e.isDone} : e))} />} />
              <Route path="/settings" element={<SettingsView categories={categories} setCategories={setCategories} settings={settings} setSettings={setSettings} onExport={() => {
                const data = { events, categories, settings, version: '5.0' };
                const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                const link = document.createElement('a'); 
                link.href = URL.createObjectURL(blob); 
                link.download = `backup_ies_murcia_${format(new Date(), 'yyyyMMdd')}.json`; 
                link.click();
              }} onImport={(data) => { 
                if(data.events) setEvents(data.events); 
                if(data.categories) setCategories(data.categories); 
                if(data.settings) setSettings(data.settings); 
              }} />} />
              <Route path="/ai-bridge" element={<AIBridge onImport={importFromAI} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

// --- VISTA: DASHBOARD ---

const Dashboard: React.FC<{ events: CalendarEvent[], categories: Category[], onToggle: (id: string) => void, onDelete: (id: string) => void }> = ({ events, categories, onToggle, onDelete }) => {
  const today = formatDate(new Date());
  const sorted = useMemo(() => events.filter(e => !e.isDone && e.date >= today).sort((a,b) => a.date.localeCompare(b.date)), [events, today]);
  const upcoming = sorted.slice(0, 10);
  const alertCount = events.filter(e => e.isAutoGenerated && !e.isDone).length;

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black mb-2 tracking-tight">Hola, Chef 👋</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">Estado de la gestión de cocina</p>
          <div className="flex gap-4">
            <div className={`flex items-center gap-4 px-8 py-5 rounded-3xl backdrop-blur-md border ${alertCount > 0 ? 'bg-red-500/20 border-red-500/30' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
              <div className={`p-3 rounded-xl ${alertCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}><Zap size={22} /></div>
              <div>
                <span className="text-lg font-black block leading-none">{alertCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Tareas logísticas</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><Clock size={14} /> PRÓXIMOS EVENTOS</h3>
            <span className="text-[10px] font-bold text-slate-300 uppercase">Hoy: {format(new Date(), 'dd/MM/yyyy')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcoming.length > 0 ? upcoming.map(event => (
              <div key={event.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group border-b-4" style={{borderBottomColor: categories.find(c => c.id === event.type)?.color.replace('bg-', '') === 'emerald-500' ? '#10b981' : '#cbd5e1'}}>
                <div className="flex justify-between mb-4">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black text-white uppercase ${categories.find(c => c.id === event.type)?.color || 'bg-slate-400'}`}>
                    {categories.find(c => c.id === event.type)?.label.split(' ')[0]}
                  </span>
                  <button onClick={() => onDelete(event.id)} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
                <h4 className="font-black text-slate-800 line-clamp-2 mb-2 uppercase text-xs leading-tight">{event.title}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{format(parseISO(event.date), "d 'de' MMMM", { locale: es })}</p>
                <button onClick={() => onToggle(event.id)} className="w-full py-3 bg-slate-50 group-hover:bg-slate-900 group-hover:text-white rounded-2xl text-[10px] font-black uppercase transition-all border border-slate-100 tracking-widest">Hecho</button>
              </div>
            )) : <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-slate-300 italic">No hay eventos próximos en la agenda.</div>}
          </div>
        </div>
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] px-2">Resumen Semanal</h3>
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="space-y-6">
              {categories.filter(c => !c.isSystem).map(c => (
                <div key={c.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${c.color} shadow-sm group-hover:scale-125 transition-all`}></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{c.label}</span>
                  </div>
                  <span className="text-xs font-black text-slate-800 bg-slate-50 px-2 py-1 rounded-lg">{events.filter(e => e.type === c.id).length}</span>
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

const MiniMonth: React.FC<{ date: Date, events?: CalendarEvent[], onDayClick?: (d: Date) => void }> = ({ date, events = [], onDayClick }) => {
  const start = startOfMonth(date);
  const days = eachDayOfInterval({ start, end: endOfMonth(date) });
  const startDay = (start.getDay() + 6) % 7;
  return (
    <div className="text-[10px] w-full">
      <div className="font-black text-slate-800 text-center border-b pb-2 mb-3 uppercase tracking-widest text-[11px]">{format(date, 'MMMM', { locale: es })}</div>
      <div className="grid grid-cols-7 gap-1">
        {['L','M','X','J','V','S','D'].map(d => <div key={d} className="text-center font-black text-slate-300 mb-2">{d}</div>)}
        {Array.from({ length: startDay }).map((_, i) => <div key={i} />)}
        {days.map(d => {
          const dStr = formatDate(d);
          const hasEv = events.some(e => e.date === dStr);
          const isToday = isSameDay(d, new Date());
          return (
            <div key={dStr} onClick={() => onDayClick?.(d)} className={`h-8 flex items-center justify-center cursor-pointer rounded-xl transition-all relative ${isToday ? 'bg-emerald-500 text-white font-black shadow-lg shadow-emerald-200' : 'hover:bg-slate-100 text-slate-600'}`}>
              {format(d, 'd')}
              {hasEv && !isToday && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CalendarView: React.FC<{ events: CalendarEvent[], categories: Category[], onAdd: (e: any) => void, onDelete: (id: string) => void, onToggle: (id: string) => void }> = ({ events, categories, onAdd, onDelete, onToggle }) => {
  const [viewMode, setViewMode] = useState<'month'|'year'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const academicMonths = eachMonthOfInterval({ start: ACADEMIC_YEAR.start, end: ACADEMIC_YEAR.end });
  const dayEvents = useMemo(() => events.filter(e => e.date === formatDate(selectedDay)).sort((a,b) => (a.time||'00:00').localeCompare(b.time||'00:00')), [events, selectedDay]);

  return (
    <div className="h-full flex flex-col p-6 md:p-10 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 shrink-0">
        <div className="flex bg-white border border-slate-200 rounded-[1.5rem] p-1 shadow-sm">
          <button onClick={() => setViewMode('month')} className={`px-8 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Mes Detalle</button>
          <button onClick={() => setViewMode('year')} className={`px-8 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'year' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Vista Anual</button>
        </div>
        {viewMode === 'month' && (
          <div className="flex items-center gap-6 bg-white px-6 py-3 rounded-[1.5rem] border border-slate-200 shadow-sm">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-50 text-slate-400"><ChevronLeft /></button>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] min-w-[140px] text-center">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-50 text-slate-400"><ChevronRight /></button>
          </div>
        )}
      </div>

      {viewMode === 'year' ? (
        <div className="flex-1 bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-16">
          {academicMonths.map(m => <MiniMonth key={m.toString()} date={m} events={events} onDayClick={(d) => { setSelectedDay(d); setCurrentMonth(d); setViewMode('month'); }} />)}
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
          <div className="w-full lg:w-[420px] shrink-0 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <div className="grid grid-cols-7 gap-2">
                {['L','M','X','J','V','S','D'].map(d => <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase py-2 tracking-widest">{d}</div>)}
                {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => <div key={i} />)}
                {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(day => {
                  const dStr = formatDate(day);
                  const isSelected = isSameDay(day, selectedDay);
                  const hasEv = events.some(e => e.date === dStr);
                  const holiday = isHoliday(dStr);
                  return (
                    <div key={dStr} onClick={() => setSelectedDay(day)} className={`h-14 flex flex-col items-center justify-center cursor-pointer rounded-2xl transition-all relative ${isSelected ? 'bg-emerald-600 text-white shadow-2xl scale-110 z-10' : holiday ? 'bg-red-50 text-red-500' : 'hover:bg-slate-50 text-slate-700'}`}>
                      <span className="text-xs font-black">{format(day, 'd')}</span>
                      {hasEv && !isSelected && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1 shadow-sm" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{format(selectedDay, "EEEE, d MMMM", { locale: es })}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{dayEvents.length} Eventos</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white p-5 rounded-[1.5rem] shadow-2xl shadow-emerald-200 hover:scale-105 transition-all active:scale-95"><Plus size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-50">
                  {dayEvents.map(ev => (
                    <tr key={ev.id} className="group hover:bg-slate-50 transition-all">
                      <td className="px-8 py-6 text-xs font-black text-slate-800 w-28 tracking-tighter">{ev.time || '--:--'}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className={`w-1.5 h-12 rounded-full ${categories.find(c => c.id === ev.type)?.color || 'bg-slate-300 shadow-sm'}`} />
                          <div>
                            <h4 className="text-sm font-black uppercase text-slate-800 tracking-tight leading-tight">{ev.title}</h4>
                            {ev.notes && <p className="text-[10px] text-slate-400 font-medium italic mt-1 line-clamp-1">{ev.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => onToggle(ev.id)} className={`p-2 rounded-xl border ${ev.isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100 text-slate-300 hover:text-emerald-500'}`}><CheckCircle size={18} /></button>
                          <button onClick={() => onDelete(ev.id)} className="p-2 text-slate-200 hover:text-red-500"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {dayEvents.length === 0 && Array.from({length: 4}).map((_,i) => <tr key={i} className="h-24 border-b border-slate-50/30"><td></td><td></td><td></td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Registrar Evento</h3>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); onAdd({ title: fd.get('title') as string, type: fd.get('type') as string, time: fd.get('time') as string, date: formatDate(selectedDay), notes: fd.get('notes') as string }); setIsModalOpen(false); }} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Título</label>
                <input required name="title" placeholder="EJ: SERVICIO CARTA" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                   <select name="type" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-[10px] outline-none uppercase">{categories.filter(c => !c.isSystem).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora</label>
                   <input type="time" name="time" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas</label>
                <textarea name="notes" placeholder="..." className="w-full h-24 p-4 bg-slate-50 border-none rounded-2xl text-[11px] font-medium outline-none resize-none" />
              </div>
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

// --- VISTA: AJUSTES (MARCA Y BACKUP) ---

const SettingsView: React.FC<{ categories: Category[], setCategories: React.Dispatch<React.SetStateAction<Category[]>>, settings: AppSettings, setSettings: React.Dispatch<React.SetStateAction<AppSettings>>, onExport: () => void, onImport: (data: any) => void }> = ({ categories, setCategories, settings, setSettings, onExport, onImport }) => {
  const backupRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>, field: 'iesLogo'|'profPhoto') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSettings(prev => ({ ...prev, [field]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-12 pb-32 overflow-y-auto">
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Ajustes</h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-2">Personalización y Sincronización</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2 mb-6"><School className="text-emerald-500" size={16} /> Centro Educativo</h3>
          <div className="flex items-center gap-6">
            <div className="relative group w-24 h-24 rounded-3xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
              {settings.iesLogo ? <img src={settings.iesLogo} className="w-full h-full object-cover" /> : <Camera className="text-slate-300" />}
              <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer text-white shadow-inner">
                <Upload size={24} />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImage(e, 'iesLogo')} />
              </label>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre del IES</label>
              <input value={settings.iesName} onChange={e => setSettings(s => ({...s, iesName: e.target.value}))} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase outline-none focus:ring-4 ring-emerald-500/10" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm space-y-8">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2 mb-6"><User className="text-indigo-500" size={16} /> Perfil del Profesor</h3>
          <div className="flex items-center gap-6">
            <div className="relative group w-24 h-24 rounded-full overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
              {settings.profPhoto ? <img src={settings.profPhoto} className="w-full h-full object-cover" /> : <Camera className="text-slate-300" />}
              <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer text-white">
                <Upload size={24} />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImage(e, 'profPhoto')} />
              </label>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre Docente</label>
              <input value={settings.profName} onChange={e => setSettings(s => ({...s, profName: e.target.value}))} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase outline-none focus:ring-4 ring-indigo-500/10" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-black uppercase tracking-widest mb-4 flex items-center gap-4 text-emerald-400"><Download size={28} /> Copias de Seguridad</h3>
          <p className="text-slate-400 font-medium max-w-lg mb-10 text-sm leading-relaxed">
            Lleva tu calendario a cualquier dispositivo. Exporta tus datos actuales en un archivo seguro e impórtalos en tu tablet, móvil u ordenador.
          </p>
          <div className="flex flex-wrap gap-6">
            <button onClick={onExport} className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 transition-all flex items-center gap-3 active:scale-95"><Download size={20} /> Exportar Backup</button>
            <button onClick={() => backupRef.current?.click()} className="px-10 py-5 bg-white/10 hover:bg-white/20 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] border border-white/10 transition-all flex items-center gap-3 active:scale-95"><Upload size={20} /> Importar Datos</button>
            <input ref={backupRef} type="file" accept=".json" className="hidden" onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = ev => { 
                   try {
                     const data = JSON.parse(ev.target?.result as string);
                     if(confirm('¿Restaurar copia de seguridad? Esto borrará los datos actuales.')) {
                       onImport(data); 
                       alert('Datos restaurados correctamente.');
                     }
                   } catch(e) { alert('Error al leer el archivo.'); }
                };
                reader.readAsText(file);
              }
            }} />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      </div>
    </div>
  );
};

export default App;
