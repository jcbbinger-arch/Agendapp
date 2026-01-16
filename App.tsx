
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, LayoutDashboard, Settings, Bell, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle, Clock, Briefcase, Zap, Cpu, Copy, Import, ArrowLeft, Sparkles, Grid, Download, Upload, User, School, Camera } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, subDays, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { EventType, CalendarEvent, Category, AppSettings } from './types';
import { DEFAULT_CATEGORIES, AVAILABLE_COLORS, ACADEMIC_YEAR } from './constants';
import { formatDate, isHoliday, generateId, getMondayBefore, getFridayBefore, checkUrgency } from './utils';

// --- Componentes Compartidos ---

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

// --- Vista: Puente IA ---

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
        alert(`Importados ${parsed.length} eventos.`);
        navigate('/calendar');
      }
    } catch (e) { alert("Error en el formato JSON."); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Puente Digital IA</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-2xl min-h-[450px]">
          <div>
            <h3 className="text-3xl font-black mb-6">1. COPIA EL <span className="text-emerald-400">PROMPT</span></h3>
            <p className="text-slate-400 font-medium">Usa este comando en Gemini con tu PDF del calendario para obtener los datos estructurados.</p>
          </div>
          <button onClick={copyPrompt} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all"><Copy size={18} /> {copyStatus}</button>
        </div>
        <div className="bg-white rounded-[2.5rem] p-10 flex flex-col justify-between shadow-xl border border-slate-100 min-h-[450px]">
          <div>
            <h3 className="text-3xl font-black text-slate-800 mb-6">2. PEGA EL <span className="text-emerald-600">RESULTADO</span></h3>
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder="Pega el código JSON de la IA aquí..." className="w-full h-40 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-[11px] font-mono outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none shadow-inner" />
          </div>
          <button disabled={!jsonInput.trim()} onClick={handleImport} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:bg-emerald-700 transition-all">IMPORTAR AGENDA</button>
        </div>
      </div>
    </div>
  );
};

// --- App Principal ---

const App: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('ies_murcia_v4_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('ies_murcia_v4_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ies_murcia_v4_settings');
    return saved ? JSON.parse(saved) : { iesName: 'IES MURCIA', iesLogo: '', profName: 'PROFESOR FP', profPhoto: '' };
  });

  useEffect(() => { localStorage.setItem('ies_murcia_v4_events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('ies_murcia_v4_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('ies_murcia_v4_settings', JSON.stringify(settings)); }, [settings]);

  const addEvent = (eventData: Omit<CalendarEvent, 'id' | 'isDone'>) => {
    const mainId = generateId();
    const category = categories.find(c => c.id === eventData.type);
    const newEvent: CalendarEvent = { ...eventData, id: mainId, isDone: false };
    
    let additional: CalendarEvent[] = [];
    if (category?.hasAutoManagement) {
      const date = parseISO(eventData.date);
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
                const blob = new Blob([JSON.stringify({events, categories, settings})], {type: 'application/json'});
                const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'backup_ies.json'; link.click();
              }} onImport={(data) => { setEvents(data.events); setCategories(data.categories); setSettings(data.settings); }} />} />
              <Route path="/ai-bridge" element={<AIBridge onImport={importFromAI} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

// --- Vista: Dashboard ---

const Dashboard: React.FC<{ events: CalendarEvent[], categories: Category[], onToggle: (id: string) => void, onDelete: (id: string) => void }> = ({ events, categories, onToggle, onDelete }) => {
  const today = formatDate(new Date());
  const upcoming = useMemo(() => events.filter(e => !e.isDone && e.date >= today).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 8), [events, today]);
  const pendingTasks = events.filter(e => e.isAutoGenerated && !e.isDone).length;

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black mb-2 tracking-tight">Hola, Chef 👋</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">Estado actual de tu cocina</p>
          <div className="flex gap-4">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-md border ${pendingTasks > 0 ? 'bg-red-500/20 border-red-500/30' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
              <div className={`p-2 rounded-lg ${pendingTasks > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}><Zap size={20} /></div>
              <span className="text-sm font-black uppercase tracking-widest">{pendingTasks} Tareas Pendientes</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 px-2"><Clock size={14} /> PRÓXIMOS EVENTOS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcoming.length > 0 ? upcoming.map(event => (
              <div key={event.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all group">
                <div className="flex justify-between mb-4">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black text-white uppercase ${categories.find(c => c.id === event.type)?.color || 'bg-slate-400'}`}>
                    {categories.find(c => c.id === event.type)?.label.split(' ')[0]}
                  </span>
                  <button onClick={() => onDelete(event.id)} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
                <h4 className="font-bold text-slate-800 line-clamp-2 mb-2">{event.title}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{format(parseISO(event.date), "d 'de' MMMM", { locale: es })}</p>
                <button onClick={() => onToggle(event.id)} className="w-full py-3 bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white rounded-xl text-[10px] font-black uppercase transition-all border border-slate-100">Listo</button>
              </div>
            )) : <p className="col-span-full py-10 text-center text-slate-400 italic font-medium bg-white rounded-[2rem] border-2 border-dashed">Todo al día por ahora.</p>}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-fit">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 text-center border-b pb-4">Actividad Mensual</h3>
          <div className="space-y-4">
            {categories.filter(c => !c.isSystem).map(c => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${c.color} shadow-sm`}></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase">{c.label}</span>
                </div>
                <span className="text-xs font-black text-slate-800">{events.filter(e => e.type === c.id).length}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Vista: Calendario Rediseñado ---

const MiniCalendar: React.FC<{ date: Date, events?: CalendarEvent[], onDayClick?: (d: Date) => void }> = ({ date, events = [], onDayClick }) => {
  const start = startOfMonth(date);
  const days = eachDayOfInterval({ start, end: endOfMonth(date) });
  const startDay = (start.getDay() + 6) % 7;
  return (
    <div className="text-[9px] w-full">
      <div className="font-black text-slate-800 text-center border-b pb-1 mb-2 uppercase text-[10px]">{format(date, 'MMMM', { locale: es })}</div>
      <div className="grid grid-cols-7 gap-1">
        {['L','M','X','J','V','S','D'].map(d => <div key={d} className="text-center font-black text-slate-300 mb-1">{d}</div>)}
        {Array.from({ length: startDay }).map((_, i) => <div key={i} />)}
        {days.map(d => {
          const hasEv = events.some(e => e.date === formatDate(d));
          return (
            <div key={d.toString()} onClick={() => onDayClick?.(d)} className={`py-1 text-center cursor-pointer rounded-md transition-all relative ${isSameDay(d, new Date()) ? 'bg-emerald-500 text-white font-black' : 'hover:bg-slate-100 text-slate-600'}`}>
              {format(d, 'd')}
              {hasEv && !isSameDay(d, new Date()) && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-emerald-500 rounded-full" />}
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
    <div className="h-full flex flex-col p-6 md:p-10">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
          <button onClick={() => setViewMode('month')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>MES</button>
          <button onClick={() => setViewMode('year')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'year' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>AÑO COMPLETO</button>
        </div>
        {viewMode === 'month' && (
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-50 text-slate-400"><ChevronLeft /></button>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest min-w-[120px] text-center">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-50 text-slate-400"><ChevronRight /></button>
          </div>
        )}
      </div>

      {viewMode === 'year' ? (
        <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-16">
          {academicMonths.map(m => <MiniCalendar key={m.toString()} date={m} events={events} onDayClick={(d) => { setSelectedDay(d); setCurrentMonth(d); setViewMode('month'); }} />)}
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
          <div className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0">
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
              <div className="grid grid-cols-7 gap-2">
                {['L','M','X','J','V','S','D'].map(d => <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase py-2">{d}</div>)}
                {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => <div key={i} />)}
                {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(day => {
                  const isSelected = isSameDay(day, selectedDay);
                  const hasEv = events.some(e => e.date === formatDate(day));
                  return (
                    <div key={day.toString()} onClick={() => setSelectedDay(day)} className={`h-12 flex flex-col items-center justify-center cursor-pointer rounded-2xl transition-all relative ${isSelected ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'hover:bg-emerald-50 text-slate-700'}`}>
                      <span className="text-xs font-black">{format(day, 'd')}</span>
                      {hasEv && !isSelected && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1 shadow-sm" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col overflow-hidden">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{format(selectedDay, "EEEE, d MMMM", { locale: es })}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{dayEvents.length} Eventos programados</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl shadow-emerald-100 hover:scale-105 transition-all"><Plus /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-50">
                  {dayEvents.map(ev => (
                    <tr key={ev.id} className="group hover:bg-slate-50 transition-all">
                      <td className="px-6 py-5 text-xs font-black text-slate-800 w-24 tracking-tighter">{ev.time || '--:--'}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-1.5 h-10 rounded-full ${categories.find(c => c.id === ev.type)?.color || 'bg-slate-300 shadow-sm'}`} />
                          <div>
                            <h4 className="text-sm font-black uppercase text-slate-800 tracking-tight">{ev.title}</h4>
                            {ev.notes && <p className="text-[10px] text-slate-400 font-medium italic mt-0.5 line-clamp-1">{ev.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => onDelete(ev.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {dayEvents.length === 0 && Array.from({length: 3}).map((_,i) => <tr key={i} className="h-20 border-b border-slate-50/50"><td></td><td></td><td></td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-6">Nuevo Evento</h3>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); onAdd({ title: fd.get('title') as string, type: fd.get('type') as string, time: fd.get('time') as string, date: formatDate(selectedDay), notes: fd.get('notes') as string }); setIsModalOpen(false); }} className="space-y-4">
              <input required name="title" placeholder="TÍTULO DEL EVENTO" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              <div className="grid grid-cols-2 gap-4">
                <select name="type" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-[10px] outline-none uppercase">{categories.filter(c => !c.isSystem).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
                <input type="time" name="time" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black outline-none" />
              </div>
              <textarea name="notes" placeholder="OBSERVACIONES" className="w-full h-24 p-4 bg-slate-50 border-none rounded-2xl text-[11px] font-medium outline-none resize-none" />
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-emerald-700 transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Vista: Ajustes (Branding & Backup) ---

const SettingsView: React.FC<{ categories: Category[], setCategories: React.Dispatch<React.SetStateAction<Category[]>>, settings: AppSettings, setSettings: React.Dispatch<React.SetStateAction<AppSettings>>, onExport: () => void, onImport: (data: any) => void }> = ({ categories, setCategories, settings, setSettings, onExport, onImport }) => {
  const fileRef = useRef<HTMLInputElement>(null);
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
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-10 pb-32">
      <div className="mb-6">
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Configuración</h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-1">Identidad y Sincronización</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4"><School size={16} /> Centro Educativo</h3>
          <div className="flex items-center gap-4">
            <div className="relative group w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
              {settings.iesLogo ? <img src={settings.iesLogo} className="w-full h-full object-cover" /> : <Camera className="text-slate-300" />}
              <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer text-white"><Upload size={20} /><input type="file" className="hidden" onChange={e => handleImage(e, 'iesLogo')} /></label>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase">Nombre del IES</label>
              <input value={settings.iesName} onChange={e => setSettings(s => ({...s, iesName: e.target.value}))} className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-black uppercase outline-none focus:ring-2 ring-emerald-500/10" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4"><User size={16} /> Perfil Docente</h3>
          <div className="flex items-center gap-4">
            <div className="relative group w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
              {settings.profPhoto ? <img src={settings.profPhoto} className="w-full h-full object-cover" /> : <Camera className="text-slate-300" />}
              <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer text-white"><Upload size={20} /><input type="file" className="hidden" onChange={e => handleImage(e, 'profPhoto')} /></label>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase">Nombre del Profesor</label>
              <input value={settings.profName} onChange={e => setSettings(s => ({...s, profName: e.target.value}))} className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-black uppercase outline-none focus:ring-2 ring-emerald-500/10" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <h3 className="text-xl font-black uppercase tracking-widest mb-4 flex items-center gap-3"><Download className="text-emerald-400" /> Sincronización de Datos</h3>
        <p className="text-slate-400 font-medium max-w-lg mb-8 text-sm">¿Cambiaste de ordenador o tablet? Exporta tus datos y súbelos en el nuevo dispositivo para mantener tu agenda al día.</p>
        <div className="flex flex-wrap gap-4 relative z-10">
          <button onClick={onExport} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-3"><Download size={18} /> Exportar Copia</button>
          <button onClick={() => backupRef.current?.click()} className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-white/10 transition-all flex items-center gap-3"><Upload size={18} /> Importar Datos</button>
          <input ref={backupRef} type="file" accept=".json" className="hidden" onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = ev => { onImport(JSON.parse(ev.target?.result as string)); alert('Copia restaurada.'); };
              reader.readAsText(file);
            }
          }} />
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      </div>
    </div>
  );
};

export default App;
