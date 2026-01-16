
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, LayoutDashboard, Settings, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle, Clock, Zap, Cpu, Copy, ArrowLeft, Download, Upload, User, School, Camera, Bell, BellRing, ExternalLink, ListChecks } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, eachMonthOfInterval, addDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { EventType, CalendarEvent, Category, AppSettings } from './types';
import { DEFAULT_CATEGORIES, ACADEMIC_YEAR } from './constants';
import { formatDate, isHoliday, generateId, getMondayPreviousWeek, getFridayTwoWeeksBefore, getMenuCreationDate, getGoogleCalendarUrl } from './utils';

// --- COMPONENTES ---

const Header: React.FC<{ settings: AppSettings }> = ({ settings }) => (
  <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm">
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-12 h-12 overflow-hidden rounded-xl bg-emerald-600 shadow-sm border border-slate-100">
        {settings.iesLogo ? <img src={settings.iesLogo} className="w-full h-full object-cover" /> : <School size={24} className="text-white" />}
      </div>
      <div>
        <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase leading-none mb-1">{settings.iesName || 'IES MURCIA'}</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Gestión Logística 25/26</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <Link to="/ai-bridge" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
        <Cpu size={14} /> IA BRIDGE
      </Link>
      <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
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
    const saved = localStorage.getItem('ies_murcia_v7_events');
    return saved ? JSON.parse(saved) : [];
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ies_murcia_v7_settings');
    return saved ? JSON.parse(saved) : { iesName: 'IES MURCIA', iesLogo: '', profName: 'PROFESOR FP', profPhoto: '' };
  });
  const [notified, setNotified] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('ies_murcia_notified_v7');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => { localStorage.setItem('ies_murcia_v7_events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('ies_murcia_v7_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('ies_murcia_notified_v7', JSON.stringify(notified)); }, [notified]);

  // Motor de notificaciones inteligente
  useEffect(() => {
    if (Notification.permission === 'granted') {
      const todayStr = formatDate(new Date());
      events.forEach(event => {
        if (!event.isDone && event.date === todayStr && !notified[event.id]) {
          new Notification('IES MURCIA: Tarea para Hoy', { body: event.title });
          setNotified(prev => ({ ...prev, [event.id]: true }));
        }
      });
    }
  }, [events]);

  const addEvent = (eventData: any) => {
    const mainId = generateId();
    const newEvent: CalendarEvent = { ...eventData, id: mainId, isDone: false };
    let additional: CalendarEvent[] = [];

    // Lógica logistica automática si es SERVICIO DE COMEDOR
    if (eventData.type === EventType.DINING_SERVICE) {
      const serviceDate = parseISO(eventData.date);
      // 1. Crear Menú (24 días antes)
      additional.push({ id: generateId(), parentId: mainId, title: `📖 CREAR MENÚ: ${eventData.title}`, type: EventType.AUTO_MENU_PREP, date: formatDate(getMenuCreationDate(serviceDate)), notes: 'Fase de diseño y recetario.', isDone: false, isAutoGenerated: true });
      // 2. Terminar Pedido (Viernes 2 semanas antes)
      additional.push({ id: generateId(), parentId: mainId, title: `⚠️ TERMINAR PEDIDO: ${eventData.title}`, type: EventType.AUTO_ALARM, date: formatDate(getFridayTwoWeeksBefore(serviceDate)), notes: 'Cierre de revisión de stock.', isDone: false, isAutoGenerated: true });
      // 3. Hacer Pedido (Lunes semana anterior)
      additional.push({ id: generateId(), parentId: mainId, title: `🚨 HACER PEDIDO: ${eventData.title}`, type: EventType.AUTO_CRITICAL, date: formatDate(getMondayPreviousWeek(serviceDate)), notes: 'Enviar pedido a proveedores.', isDone: false, isAutoGenerated: true });
    }

    // Avisos manuales (si el usuario añadió avisos específicos)
    if (eventData.customReminders) {
        eventData.customReminders.forEach((rDate: string) => {
            additional.push({ id: generateId(), parentId: mainId, title: `🔔 Recordatorio: ${eventData.title}`, type: EventType.LOGISTICS, date: rDate, notes: 'Aviso manual configurado.', isDone: false, isAutoGenerated: true });
        });
    }

    setEvents(prev => [...prev, newEvent, ...additional]);
  };

  return (
    <Router>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header settings={settings} />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard events={events} onToggle={(id) => setEvents(evs => evs.map(e => e.id === id ? {...e, isDone: !e.isDone} : e))} onDelete={(id) => setEvents(evs => evs.filter(e => e.id !== id && e.parentId !== id))} />} />
              <Route path="/calendar" element={<CalendarView events={events} onAdd={addEvent} onDelete={(id) => setEvents(evs => evs.filter(e => e.id !== id && e.parentId !== id))} onToggle={(id) => setEvents(evs => evs.map(e => e.id === id ? {...e, isDone: !e.isDone} : e))} />} />
              <Route path="/settings" element={<SettingsView settings={settings} setSettings={setSettings} onExport={() => {
                const blob = new Blob([JSON.stringify({events, settings})], {type: 'application/json'});
                const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'backup_cocina.json'; link.click();
              }} onImport={(data) => { setEvents(data.events); setSettings(data.settings); }} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

// --- VISTA: DASHBOARD ---

const Dashboard: React.FC<{ events: CalendarEvent[], onToggle: (id: string) => void, onDelete: (id: string) => void }> = ({ events, onToggle, onDelete }) => {
  const today = formatDate(new Date());
  const upcomingTasks = useMemo(() => events.filter(e => !e.isDone && e.date >= today).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 12), [events, today]);
  
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 tracking-tight">Planificación Logística</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">Hitos de cocina y servicios próximos</p>
          <div className="flex gap-4">
            <div className="bg-emerald-500/20 border border-emerald-500/30 px-6 py-4 rounded-2xl backdrop-blur-md flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg"><Zap size={18}/></div>
                <span className="text-xs font-black uppercase tracking-widest">{events.filter(e => !e.isDone).length} Pendientes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Próximos Pasos</h3>
          <div className="grid grid-cols-1 gap-4">
            {upcomingTasks.map(task => (
              <div key={task.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  <div className={`w-2 h-10 rounded-full ${task.isAutoGenerated ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                  <div>
                    <h4 className="font-black text-slate-800 uppercase text-xs">{task.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{format(parseISO(task.date), "EEEE, d MMMM", { locale: es })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => window.open(getGoogleCalendarUrl(task), '_blank')} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm"><ExternalLink size={16}/></button>
                    <button onClick={() => onToggle(task.id)} className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg hover:scale-105 transition-all"><CheckCircle size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Leyenda</h3>
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-3"><div className="w-3 h-3 bg-red-600 rounded-full"/> <span className="text-[10px] font-black text-slate-500 uppercase">Hacer Pedido (Lunes)</span></div>
            <div className="flex items-center gap-3"><div className="w-3 h-3 bg-orange-500 rounded-full"/> <span className="text-[10px] font-black text-slate-500 uppercase">Cerrar Pedido (Viernes)</span></div>
            <div className="flex items-center gap-3"><div className="w-3 h-3 bg-purple-400 rounded-full"/> <span className="text-[10px] font-black text-slate-500 uppercase">Crear Menú (D-24)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- VISTA: CALENDARIO Y MODAL AVANZADO ---

const CalendarView: React.FC<{ events: CalendarEvent[], onAdd: (e: any) => void, onDelete: (id: string) => void, onToggle: (id: string) => void }> = ({ events, onAdd, onDelete, onToggle }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customAvisos, setCustomAvisos] = useState<string[]>([]);
  const dayEvents = events.filter(e => e.date === formatDate(selectedDay));

  return (
    <div className="h-full flex flex-col p-6 md:p-10">
      <div className="flex justify-between items-center mb-10 shrink-0">
          <div className="flex items-center gap-6 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-50 text-slate-400"><ChevronLeft /></button>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest min-w-[150px] text-center">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-50 text-slate-400"><ChevronRight /></button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 transition-all"><Plus size={18}/> NUEVO REGISTRO</button>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden">
        <div className="w-[420px] shrink-0">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="grid grid-cols-7 gap-2">
                {['L','M','X','J','V','S','D'].map(d => <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase py-2 tracking-widest">{d}</div>)}
                {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => <div key={i} />)}
                {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(day => {
                  const dStr = formatDate(day);
                  const isSelected = isSameDay(day, selectedDay);
                  const hasEv = events.some(e => e.date === dStr);
                  return (
                    <div key={dStr} onClick={() => setSelectedDay(day)} className={`h-12 flex flex-col items-center justify-center cursor-pointer rounded-2xl transition-all relative ${isSelected ? 'bg-emerald-600 text-white shadow-lg scale-105' : isHoliday(dStr) ? 'bg-red-50 text-red-500' : 'hover:bg-slate-50 text-slate-700'}`}>
                      <span className="text-xs font-black">{format(day, 'd')}</span>
                      {hasEv && !isSelected && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1 shadow-sm" />}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
        <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden">
            <div className="p-8 border-b bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{format(selectedDay, "EEEE, d MMMM", { locale: es })}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {dayEvents.map(ev => (
                <div key={ev.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-10 rounded-full ${ev.isAutoGenerated ? 'bg-amber-400' : 'bg-slate-900'}`} />
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase leading-none">{ev.title}</h4>
                      {ev.notes && <p className="text-[10px] text-slate-400 font-medium mt-1">{ev.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => window.open(getGoogleCalendarUrl(ev), '_blank')} className="p-2 text-slate-300 hover:text-emerald-600"><ExternalLink size={16}/></button>
                    <button onClick={() => onDelete(ev.id)} className="p-2 text-slate-200 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {dayEvents.length === 0 && <div className="p-10 text-center text-slate-300 italic text-sm">Sin eventos en este día.</div>}
            </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-8">Nuevo Registro</h3>
            <form onSubmit={(e) => { 
                e.preventDefault(); 
                const fd = new FormData(e.currentTarget); 
                onAdd({ 
                    title: fd.get('title') as string, 
                    type: fd.get('type') as string, 
                    date: formatDate(selectedDay), 
                    notes: fd.get('notes') as string,
                    customReminders: customAvisos
                }); 
                setCustomAvisos([]);
                setIsModalOpen(false); 
            }} className="space-y-6">
              <input required name="title" placeholder="TÍTULO" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              <div className="grid grid-cols-2 gap-4">
                <select name="type" className="p-5 bg-slate-50 border-none rounded-2xl font-black text-[10px] uppercase outline-none">
                    <option value={EventType.DINING_SERVICE}>🍽️ SERVICIO COMEDOR</option>
                    <option value={EventType.EXAM}>📝 EXAMEN</option>
                    <option value={EventType.THEORY}>📘 TEORÍA</option>
                    <option value={EventType.LOGISTICS}>📦 OTROS</option>
                </select>
                <input type="date" value={formatDate(selectedDay)} onChange={(e) => setSelectedDay(parseISO(e.target.value))} className="p-5 bg-slate-50 border-none rounded-2xl text-xs font-black outline-none" />
              </div>
              
              <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Bell size={14}/> Avisos Adicionales</h4>
                 <div className="flex gap-2">
                    <input type="date" id="newAviso" className="flex-1 p-3 bg-white border-none rounded-xl text-[10px] font-black outline-none" />
                    <button type="button" onClick={() => {
                        const val = (document.getElementById('newAviso') as HTMLInputElement).value;
                        if(val) setCustomAvisos([...customAvisos, val]);
                    }} className="bg-slate-900 text-white p-3 rounded-xl"><Plus size={16}/></button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {customAvisos.map(a => <div key={a} className="bg-white border px-3 py-1 rounded-lg text-[9px] font-black text-slate-500 flex items-center gap-2">{a} <button onClick={() => setCustomAvisos(customAvisos.filter(x => x !== a))}><Trash2 size={12}/></button></div>)}
                 </div>
              </div>

              <textarea name="notes" placeholder="NOTAS / MENÚ..." className="w-full h-24 p-5 bg-slate-50 border-none rounded-2xl text-[11px] font-medium outline-none resize-none" />
              
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl hover:bg-emerald-700 transition-all active:scale-95">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- VISTA: AJUSTES ---

const SettingsView: React.FC<{ settings: AppSettings, setSettings: React.Dispatch<React.SetStateAction<AppSettings>>, onExport: () => void, onImport: (data: any) => void }> = ({ settings, setSettings, onExport, onImport }) => {
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
    <div className="max-w-4xl mx-auto p-10 space-y-12">
      <div className="flex justify-between items-start">
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Ajustes</h2>
        <button onClick={() => Notification.requestPermission()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
            <Bell size={16}/> ACTIVAR NOTIFICACIONES
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">Branding IES</h3>
          <div className="flex items-center gap-4">
            <div className="relative group w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
              {settings.iesLogo ? <img src={settings.iesLogo} className="w-full h-full object-cover" /> : <Camera className="text-slate-300" />}
              <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer text-white shadow-inner"><Upload size={20} /><input type="file" className="hidden" onChange={e => handleImage(e, 'iesLogo')} /></label>
            </div>
            <input value={settings.iesName} onChange={e => setSettings(s => ({...s, iesName: e.target.value}))} className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-xs font-black uppercase outline-none focus:ring-2 ring-emerald-500/10" placeholder="NOMBRE CENTRO" />
          </div>
        </div>
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-2xl">
          <h3 className="text-lg font-black uppercase tracking-widest mb-4">Sincronización</h3>
          <div className="flex gap-4">
            <button onClick={onExport} className="flex-1 py-4 bg-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"><Download size={18} className="mx-auto mb-2"/> Exportar</button>
            <button onClick={() => backupRef.current?.click()} className="flex-1 py-4 bg-white/10 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"><Upload size={18} className="mx-auto mb-2"/> Importar</button>
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
    </div>
  );
};

export default App;
