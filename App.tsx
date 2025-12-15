import React, { useState, useEffect, useRef } from 'react';
import { Archive, LayoutDashboard, History, AlertCircle, Search, CheckCircle2, Clock, AlertTriangle, ArrowUpDown, Calendar, Filter, Bell, Plus, X, Trash2, BellRing, Timer } from 'lucide-react';
import { Incident, Status, IncidentType, Responsible, Priority, RESPONSIBLES, Reminder } from './types';
import IncidentForm from './components/IncidentForm';
import IncidentTable from './components/IncidentTable';

// Mock initial data if storage is empty
const INITIAL_INCIDENTS: Incident[] = [
  {
    id: '1',
    name: 'Mantenimiento 01',
    date: '2023-10-24',
    type: 'PRL',
    subject: 'Revisión de extintores planta baja',
    actions: ['5.3', 'OD'],
    responsible: 'PEDRO',
    priority: 'Alta',
    status: 'Pendiente',
    comments: 'Pendiente confirmar fecha exacta con proveedor.'
  }
];

const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {
    console.warn("crypto.randomUUID not available, falling back to basic ID generation");
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const App: React.FC = () => {
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [historyIncidents, setHistoryIncidents] = useState<Incident[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Responsible Filter State
  const [responsibleFilter, setResponsibleFilter] = useState<Responsible | 'Todos'>('Todos');

  // Sort state for history
  const [sortHistoryByDate, setSortHistoryByDate] = useState(false);

  // Reminder UI State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [newReminderMsg, setNewReminderMsg] = useState('');
  // Split date and time for better UI control
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderStartTime, setNewReminderStartTime] = useState('');
  const [newReminderEndTime, setNewReminderEndTime] = useState('');
  
  // Refs for Date/Time inputs to trigger picker programmatically
  const dateInputRef = useRef<HTMLInputElement>(null);
  const startTimeInputRef = useRef<HTMLInputElement>(null);
  const endTimeInputRef = useRef<HTMLInputElement>(null);
  
  // Active (Triggered) Alerts
  const [triggeredReminders, setTriggeredReminders] = useState<Reminder[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const storedActive = localStorage.getItem('activeIncidents');
      const storedHistory = localStorage.getItem('historyIncidents');
      const storedReminders = localStorage.getItem('reminders');

      if (storedActive) {
        setActiveIncidents(JSON.parse(storedActive));
      } else {
        setActiveIncidents(INITIAL_INCIDENTS);
      }

      if (storedHistory) {
        setHistoryIncidents(JSON.parse(storedHistory));
      }

      if (storedReminders) {
        setReminders(JSON.parse(storedReminders));
      }
    } catch (e) {
      console.error("Error loading from local storage", e);
      setActiveIncidents(INITIAL_INCIDENTS);
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('activeIncidents', JSON.stringify(activeIncidents));
      localStorage.setItem('historyIncidents', JSON.stringify(historyIncidents));
      localStorage.setItem('reminders', JSON.stringify(reminders));
    }
  }, [activeIncidents, historyIncidents, reminders, isLoaded]);

  // CLOCK LOGIC: Check for triggered reminders every 10 seconds
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      // Filter reminders where start time is passed
      const triggered = reminders.filter(r => new Date(r.datetime) <= now);
      
      if (triggered.length > 0) {
        setTriggeredReminders(triggered);
      } else {
        setTriggeredReminders([]);
      }
    };

    // Check immediately on load
    if (isLoaded) checkReminders();

    const interval = setInterval(checkReminders, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [reminders, isLoaded]);


  // --- Incident Handlers ---

  const handleAddIncident = (newIncident: Omit<Incident, 'id'>) => {
    const incident: Incident = {
      ...newIncident,
      id: generateId(),
      comments: '', 
    };
    setActiveIncidents(prev => [incident, ...prev]);
  };

  const handleUpdateIncident = (id: string, field: keyof Incident, value: any) => {
    setActiveIncidents(prev => prev.map(inc => 
      inc.id === id ? { ...inc, [field]: value } : inc
    ));
  };

  const handleUpdateHistoryIncident = (id: string, field: keyof Incident, value: any) => {
     setHistoryIncidents(prev => prev.map(inc => 
       inc.id === id ? { ...inc, [field]: value } : inc
     ));
  };

  const handleDelete = (id: string) => {
    setActiveIncidents(prev => prev.filter(inc => inc.id !== id));
  };

  const handleMoveCompleted = () => {
    const completed = activeIncidents.filter(inc => inc.status === 'Completado');
    if (completed.length === 0) {
      alert("No hay incidentes completados para mover.");
      return;
    }
    const remaining = activeIncidents.filter(inc => inc.status !== 'Completado');
    setHistoryIncidents(prev => [...completed, ...prev]);
    setActiveIncidents(remaining);
  };

  // --- Reminder Handlers ---

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderMsg || !newReminderDate || !newReminderStartTime) return;

    const startDateTimeStr = `${newReminderDate}T${newReminderStartTime}`;
    let endDateTimeStr: string | undefined = undefined;
    
    if (newReminderEndTime) {
      endDateTimeStr = `${newReminderDate}T${newReminderEndTime}`;
    }

    const newReminder: Reminder = {
      id: generateId(),
      message: newReminderMsg,
      datetime: startDateTimeStr,
      endDatetime: endDateTimeStr
    };

    setReminders(prev => [...prev, newReminder]);
    // Clear inputs
    setNewReminderMsg('');
    setNewReminderDate('');
    setNewReminderStartTime('');
    setNewReminderEndTime('');
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleDismissAlert = (id: string) => {
    handleDeleteReminder(id);
  };

  const handleSnoozeAlert = (id: string) => {
    setReminders(prev => prev.map(r => {
      if (r.id === id) {
        const now = new Date();
        // Add 30 minutes to current time
        const futureTime = new Date(now.getTime() + 30 * 60000); 
        return { ...r, datetime: futureTime.toISOString() };
      }
      return r;
    }));
  };

  // --- UI Helpers ---

  const completedCount = activeIncidents.filter(i => i.status === 'Completado').length;
  
  const filteredIncidents = searchTerm.trim() 
    ? [...activeIncidents, ...historyIncidents].filter(i => 
        (i.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const getFilteredActiveIncidents = () => {
    if (responsibleFilter === 'Todos') {
      return activeIncidents;
    }
    return activeIncidents.filter(inc => inc.responsible === responsibleFilter);
  };

  const displayedActiveIncidents = getFilteredActiveIncidents();

  const getDisplayedHistory = () => {
    if (!sortHistoryByDate) return historyIncidents;
    return [...historyIncidents].sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      return 0;
    });
  };

  // Helper to format time display on the banner
  const formatTimeRange = (startIso: string, endIso?: string) => {
    const startDate = new Date(startIso);
    const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (endIso) {
      const endDate = new Date(endIso);
      const endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${timeStr} - ${endTimeStr}`;
    }
    return timeStr;
  };

  // Robust showPicker function
  const showPicker = (ref: React.RefObject<HTMLInputElement>) => {
    try {
      if (ref.current) {
         if (typeof ref.current.showPicker === 'function') {
           ref.current.showPicker();
         } else {
           ref.current.focus();
           ref.current.click(); // Some browsers need click fallback
         }
      }
    } catch (error) {
      console.warn("Could not open picker:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans relative">
      
      {/* --- TRIGGERED ALERTS BANNER --- */}
      {triggeredReminders.length > 0 && (
        <div className="fixed top-0 left-0 w-full z-50 flex flex-col items-center gap-2 pointer-events-none p-4">
          {triggeredReminders.map(reminder => (
            <div key={reminder.id} className="pointer-events-auto bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between gap-6 max-w-4xl w-full animate-bounce-short border border-red-500">
               <div className="flex items-center gap-4">
                 <div className="bg-white/20 p-2 rounded-full animate-pulse">
                   <BellRing size={24} />
                 </div>
                 <div>
                   <h4 className="font-bold text-lg uppercase tracking-wider">¡Alerta Programada!</h4>
                   <p className="text-white/90 text-lg font-medium">{reminder.message}</p>
                   <p className="text-xs text-red-200 mt-1">
                     Hora: {formatTimeRange(reminder.datetime, reminder.endDatetime)}
                   </p>
                 </div>
               </div>
               
               <div className="flex items-center gap-3">
                 <button 
                   onClick={() => handleSnoozeAlert(reminder.id)}
                   className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md font-bold text-sm transition-colors whitespace-nowrap shadow-sm flex items-center gap-2"
                 >
                   <Timer size={18} />
                   Posponer (+30m)
                 </button>
                 <button 
                   onClick={() => handleDismissAlert(reminder.id)}
                   className="bg-white text-red-700 hover:bg-red-50 px-4 py-2 rounded-md font-bold text-sm transition-colors whitespace-nowrap shadow-sm"
                 >
                   OK / Completado
                 </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200">
              <LayoutDashboard className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Gestor de Incidentes <span className="text-blue-600">Pro</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Reminder Button */}
            <button 
              onClick={() => setIsReminderModalOpen(true)}
              className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Gestionar Alertas"
            >
              <Bell size={20} />
              {reminders.length > 0 && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>
            
            <div className="text-sm text-gray-500 font-medium hidden sm:block">
               Operativa Diaria
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-12">
        
        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-shadow hover:shadow-md"
              placeholder="Buscar por Nombre del Incidente para ver estado..."
            />
          </div>

          {/* Search Results */}
          {searchTerm && (
            <div className="mt-4 bg-white rounded-lg shadow-lg border border-blue-100 overflow-hidden animate-fade-in">
               <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                 <h3 className="text-sm font-bold text-blue-800">Resultados de búsqueda</h3>
                 <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">{filteredIncidents.length} encontrados</span>
               </div>
               
               {filteredIncidents.length === 0 ? (
                 <div className="p-4 text-center text-gray-500 text-sm">
                   No se encontró ningún incidente con ese nombre.
                 </div>
               ) : (
                 <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                   {filteredIncidents.map(inc => {
                     const isHistory = historyIncidents.some(h => h.id === inc.id);
                     return (
                       <div key={inc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                          <div>
                            <p className="font-bold text-gray-900">{inc.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{inc.subject}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              inc.status === 'Completado' ? 'bg-green-100 text-green-700 border-green-200' :
                              inc.status === 'En curso' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                              {inc.status === 'Completado' ? <CheckCircle2 size={12} /> : 
                               inc.status === 'En curso' ? <Clock size={12} /> : 
                               <AlertTriangle size={12} />}
                              {inc.status.toUpperCase()}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {isHistory ? 'EN HISTORIAL (Archivado)' : 'EN TABLA ACTIVA'}
                            </span>
                          </div>
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>
          )}
        </div>

        <IncidentForm onAddIncident={handleAddIncident} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
           <div className="p-6 border-b border-gray-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="text-blue-600" />
                  Tabla de Incidentes Activos
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {activeIncidents.length}
                  </span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">Gestiona, edita y completa los incidentes del día.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Responsible Filter Dropdown */}
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm w-full sm:w-auto">
                  <Filter size={16} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 whitespace-nowrap hidden sm:inline">Responsable:</span>
                  <select
                    value={responsibleFilter}
                    onChange={(e) => setResponsibleFilter(e.target.value as Responsible | 'Todos')}
                    className="text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer w-full sm:w-auto focus:outline-none"
                  >
                    <option value="Todos">Todos</option>
                    {RESPONSIBLES.filter(r => r !== 'Sin Asignar').map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleMoveCompleted}
                  disabled={completedCount === 0}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-sm w-full sm:w-auto justify-center ${
                    completedCount > 0 
                      ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md transform hover:-translate-y-0.5' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title={completedCount === 0 ? "Marca incidentes como 'Completado' para moverlos" : "Mover incidentes completados al historial"}
                >
                  <Archive size={18} />
                  MOVER COMPLETADOS ({completedCount})
                </button>
              </div>
           </div>

           <div className="p-0">
              <IncidentTable 
                incidents={displayedActiveIncidents}
                onUpdateIncident={handleUpdateIncident}
                onDelete={handleDelete}
              />
           </div>
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="text-gray-500" />
                Historial de Completados
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {historyIncidents.length}
                </span>
              </h2>

              {/* Sorting Toggle Switch */}
              <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                <span className={`text-xs font-semibold px-2 transition-colors ${!sortHistoryByDate ? 'text-gray-900' : 'text-gray-400'}`}>
                  Orden de llegada
                </span>
                
                <button
                  onClick={() => setSortHistoryByDate(!sortHistoryByDate)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    sortHistoryByDate ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      sortHistoryByDate ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>

                <span className={`text-xs font-semibold px-2 transition-colors flex items-center gap-1 ${sortHistoryByDate ? 'text-blue-700' : 'text-gray-400'}`}>
                  <Calendar size={12} />
                  Por Fecha
                </span>
              </div>
           </div>
           <div className="p-0">
              <IncidentTable 
                incidents={getDisplayedHistory()}
                isHistory={true}
                onUpdateIncident={handleUpdateHistoryIncident}
              />
           </div>
        </div>
      </main>

      {/* --- REMINDERS MODAL --- */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                 <Bell size={20} className="text-blue-600" />
                 Gestor de Alertas
               </h3>
               <button 
                 onClick={() => setIsReminderModalOpen(false)}
                 className="text-gray-400 hover:text-gray-600 transition-colors"
               >
                 <X size={20} />
               </button>
             </div>
             
             {/* Create Reminder */}
             <div className="p-6 border-b border-gray-100 bg-blue-50/50">
               <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Nueva Alerta</h4>
               <form onSubmit={handleAddReminder} className="space-y-3">
                 <div>
                   <input 
                     type="text" 
                     placeholder="Ej: Briefing al TL, Revisar correo..." 
                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-none"
                     value={newReminderMsg}
                     onChange={(e) => setNewReminderMsg(e.target.value)}
                     required
                   />
                 </div>
                 
                 {/* Date and Time Inputs separated for cleaner look */}
                 <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 font-semibold mb-1 block">Fecha</label>
                      <div className="relative group">
                        <input 
                          ref={dateInputRef}
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-none pr-10 cursor-pointer"
                          value={newReminderDate}
                          onChange={(e) => setNewReminderDate(e.target.value)}
                          onClick={(e) => {
                             try { e.currentTarget.showPicker(); } catch (err) {}
                          }}
                          required
                        />
                        <div 
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-500 hover:text-blue-600 z-10"
                          onClick={(e) => {
                             e.preventDefault(); // Prevent double triggering issues
                             showPicker(dateInputRef);
                          }}
                        >
                          <Calendar size={16} />
                        </div>
                      </div>
                    </div>
                    <div>
                       <label className="text-xs text-gray-500 font-semibold mb-1 block">Desde (Hora inicio)</label>
                       <div className="relative group">
                         <input 
                          ref={startTimeInputRef}
                          type="time" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-none pr-10 cursor-pointer"
                          value={newReminderStartTime}
                          onChange={(e) => setNewReminderStartTime(e.target.value)}
                          onClick={(e) => {
                             try { e.currentTarget.showPicker(); } catch (err) {}
                          }}
                          required
                        />
                        <div 
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-500 hover:text-blue-600 z-10"
                          onClick={(e) => {
                             e.preventDefault();
                             showPicker(startTimeInputRef);
                          }}
                        >
                          <Clock size={16} />
                        </div>
                       </div>
                    </div>
                    <div>
                       <label className="text-xs text-gray-500 font-semibold mb-1 block">Hasta (Opcional)</label>
                       <div className="relative group">
                         <input 
                          ref={endTimeInputRef}
                          type="time" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-none pr-10 cursor-pointer"
                          value={newReminderEndTime}
                          onChange={(e) => setNewReminderEndTime(e.target.value)}
                          onClick={(e) => {
                             try { e.currentTarget.showPicker(); } catch (err) {}
                          }}
                        />
                        <div 
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-500 hover:text-blue-600 z-10"
                          onClick={(e) => {
                             e.preventDefault();
                             showPicker(endTimeInputRef);
                          }}
                        >
                          <Clock size={16} />
                        </div>
                       </div>
                    </div>
                 </div>

                 <button 
                   type="submit"
                   className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-2"
                 >
                   <Plus size={18} />
                   Añadir Alerta
                 </button>
               </form>
             </div>

             {/* List of Reminders */}
             <div className="flex-1 overflow-y-auto p-4">
               <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 px-2">Alertas Programadas ({reminders.length})</h4>
               {reminders.length === 0 ? (
                 <p className="text-center text-gray-400 text-sm italic py-4">No hay alertas pendientes.</p>
               ) : (
                 <div className="space-y-2">
                   {reminders.sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()).map(rem => {
                     const isPast = new Date(rem.datetime) < new Date();
                     return (
                       <div key={rem.id} className={`flex items-center justify-between p-3 rounded-lg border ${isPast ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                         <div>
                           <p className={`font-medium text-sm ${isPast ? 'text-red-800' : 'text-gray-800'}`}>{rem.message}</p>
                           <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                             <Clock size={10} />
                             {new Date(rem.datetime).toLocaleDateString()} | {formatTimeRange(rem.datetime, rem.endDatetime)}
                             {isPast && <span className="text-red-600 font-bold ml-1">(ACTIVA)</span>}
                           </div>
                         </div>
                         <button 
                           onClick={() => handleDeleteReminder(rem.id)}
                           className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors"
                           title="Eliminar alerta"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                     );
                   })}
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;