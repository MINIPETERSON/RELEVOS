import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { 
  Incident, 
  IncidentType, 
  Responsible, 
  Priority, 
  Status,
  INCIDENT_TYPES,
  PRIORITIES,
  getAvailableActions 
} from '../types';
import { parseIncidentFromText } from '../services/geminiService';

interface IncidentFormProps {
  onAddIncident: (incident: Omit<Incident, 'id'>) => void;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ onAddIncident }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<IncidentType>('GSR');
  const [subject, setSubject] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  // Default to 'Sin Asignar' as requested
  const [responsible, setResponsible] = useState<Responsible>('Sin Asignar');
  const [priority, setPriority] = useState<Priority>('Media');
  const [status, setStatus] = useState<Status>('Pendiente');
  
  // Smart Input State
  const [smartInput, setSmartInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSmartInput, setShowSmartInput] = useState(false);

  // Logic: Pre-fill actions when type changes
  useEffect(() => {
    const defaultActions = getAvailableActions(type);
    setActions(defaultActions);
  }, [type]);

  const availableActions = getAvailableActions(type);

  const handleActionChange = (action: string) => {
    setActions(prev => 
      prev.includes(action) 
        ? prev.filter(a => a !== action) 
        : [...prev, action]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Por favor introduce un nombre para el incidente");
      return;
    }
    if (!subject.trim()) {
      alert("Por favor introduce un tema/incidente");
      return;
    }
    
    onAddIncident({
      name,
      date,
      type,
      subject,
      actions,
      responsible, // Will be 'Sin Asignar'
      priority,
      status
    });

    // Reset fields
    setName('');
    setSubject('');
    setSmartInput('');
    setResponsible('Sin Asignar');
    setActions(getAvailableActions(type));
  };

  const handleSmartFill = async () => {
    if (!smartInput.trim()) return;
    setIsProcessing(true);
    try {
      const result = await parseIncidentFromText(smartInput);
      if (result) {
        if (result.name) setName(result.name);
        if (result.date) setDate(result.date);
        if (result.type) setType(result.type as IncidentType);
        if (result.subject) setSubject(result.subject);
        // Do not auto-set responsible, keep it as 'Sin Asignar' per user request
        if (result.priority) setPriority(result.priority as Priority);
        // Note: actions will update via useEffect when type changes
        setShowSmartInput(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Nuevo Incidente</h2>
        <button 
          type="button"
          onClick={() => setShowSmartInput(!showSmartInput)}
          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium transition-colors"
        >
          <Sparkles size={16} />
          {showSmartInput ? "Ocultar IA" : "Asistente IA"}
        </button>
      </div>

      {showSmartInput && (
        <div className="mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100 animate-fade-in">
          <label className="block text-sm font-medium text-indigo-900 mb-2">
            Describe el incidente (la IA rellenará el formulario):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              placeholder="Ej: Pedro tiene que revisar el GSR mañana, es urgente..."
              className="flex-1 px-3 py-2 border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <button
              onClick={handleSmartFill}
              disabled={isProcessing || !smartInput.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Autocompletar
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Name - New Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Incidente</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Incidente GSR-01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>

        {/* Date - Clean visual with Calendar Icon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <div className="relative">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white shadow-none cursor-pointer"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
              <CalendarIcon size={18} />
            </div>
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Incidente</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as IncidentType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Subject - Clean visual (removed shading/shadow) */}
        <div className="md:col-span-2 lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tema / Incidente</label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Descripción breve..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white shadow-none"
          />
        </div>

        {/* Dynamic Actions */}
        <div className="md:col-span-3 lg:col-span-3">
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Acciones Pendientes {availableActions.length === 0 && <span className="text-gray-400 font-normal">(No aplica para este tipo)</span>}
           </label>
           
           {availableActions.length > 0 ? (
             <div className="flex flex-wrap gap-2">
               {availableActions.map(action => (
                 <button
                   key={action}
                   type="button"
                   onClick={() => handleActionChange(action)}
                   className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                     actions.includes(action)
                       ? 'bg-blue-600 text-white border-blue-600'
                       : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                   }`}
                 >
                   {action}
                 </button>
               ))}
             </div>
           ) : (
             <div className="h-9 flex items-center text-gray-400 text-sm italic">
               Sin acciones requeridas
             </div>
           )}
           <p className="text-xs text-gray-500 mt-2">
             * Se añadirán todas las seleccionadas. Podrás eliminarlas en la tabla a medida que se completen.
           </p>
        </div>

        {/* Responsible REMOVED as per request */}
        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Status */}
        <div className="md:col-span-2 lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado Inicial</label>
          <div className="flex items-center h-10">
             <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
               Pendiente
             </span>
          </div>
        </div>
        
        <div className="md:col-span-3 flex justify-end mt-2">
          <button
            type="submit"
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 font-medium flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            Agregar Incidente
          </button>
        </div>
      </form>
    </div>
  );
};

export default IncidentForm;