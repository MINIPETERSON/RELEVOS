import React, { useState, useEffect } from 'react';
import { Archive, LayoutDashboard, History, AlertCircle, Search, CheckCircle2, Clock, AlertTriangle, ArrowUpDown, Calendar, Filter } from 'lucide-react';
import { Incident, Status, IncidentType, Responsible, Priority, RESPONSIBLES } from './types';
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Responsible Filter State
  const [responsibleFilter, setResponsibleFilter] = useState<Responsible | 'Todos'>('Todos');

  // Sort state for history
  const [sortHistoryByDate, setSortHistoryByDate] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const storedActive = localStorage.getItem('activeIncidents');
      const storedHistory = localStorage.getItem('historyIncidents');

      if (storedActive) {
        setActiveIncidents(JSON.parse(storedActive));
      } else {
        setActiveIncidents(INITIAL_INCIDENTS);
      }

      if (storedHistory) {
        setHistoryIncidents(JSON.parse(storedHistory));
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
    }
  }, [activeIncidents, historyIncidents, isLoaded]);

  const handleAddIncident = (newIncident: Omit<Incident, 'id'>) => {
    const incident: Incident = {
      ...newIncident,
      id: generateId(),
      comments: '', // Initialize with empty comments
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
    // Direct delete, confirmation is handled in the UI component (IncidentTable)
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

  const completedCount = activeIncidents.filter(i => i.status === 'Completado').length;

  // Search Logic
  const filteredIncidents = searchTerm.trim() 
    ? [...activeIncidents, ...historyIncidents].filter(i => 
        (i.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Filter Logic for Active Table
  const getFilteredActiveIncidents = () => {
    if (responsibleFilter === 'Todos') {
      return activeIncidents;
    }
    return activeIncidents.filter(inc => inc.responsible === responsibleFilter);
  };

  const displayedActiveIncidents = getFilteredActiveIncidents();

  // Sorting logic for history
  const getDisplayedHistory = () => {
    if (!sortHistoryByDate) return historyIncidents;
    // Sort by date descending (newest first)
    return [...historyIncidents].sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      return 0;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200">
              <LayoutDashboard className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Gestor de Incidentes <span className="text-blue-600">Pro</span></h1>
          </div>
          <div className="text-sm text-gray-500 font-medium">
             Operativa Diaria
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
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

          {/* Search Results Notification */}
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
    </div>
  );
};

export default App;