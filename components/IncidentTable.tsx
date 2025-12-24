import React, { useState } from 'react';
import { Trash2, Plus, X, Calendar as CalendarIcon, Check, MessageSquare, Save, RotateCcw, Info } from 'lucide-react';
import { Incident, Priority, Responsible, Status, RESPONSIBLES, PRIORITIES, getAvailableActions, IncidentType } from '../types';

interface IncidentTableProps {
  incidents: Incident[];
  isHistory?: boolean;
  onUpdateIncident?: (id: string, field: keyof Incident, value: any) => void;
  onBatchUpdateIncident?: (id: string, updates: Partial<Incident>) => void;
  onDelete?: (id: string) => void;
}

const getResponsibleColor = (res: Responsible) => {
  switch (res) {
    case 'ALEX': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'PEDRO': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'OLEK': return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
    case 'LAURA': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Sin Asignar': return 'bg-gray-50 text-gray-500 border-dashed border-gray-300';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getPriorityColor = (prio: Priority) => {
  switch (prio) {
    case 'Alta': return 'bg-red-50 text-red-700 border-red-200';
    case 'Media': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Baja': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    default: return 'bg-gray-50';
  }
};

const getStatusColor = (status: Status) => {
  switch (status) {
    case 'Pendiente': return 'text-gray-600 bg-gray-100 border-gray-200';
    case 'En curso': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'Completado': return 'text-green-700 bg-green-50 border-green-200';
  }
};

const IncidentTable: React.FC<IncidentTableProps> = ({ 
  incidents, 
  isHistory = false, 
  onUpdateIncident,
  onBatchUpdateIncident,
  onDelete
}) => {
  // Local state for the dropdown of actions to add
  const [addingActionToId, setAddingActionToId] = useState<string | null>(null);
  
  // Local state for two-step confirmation
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Comments Modal State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [tempComment, setTempComment] = useState('');

  // Logs Modal State (for triple click)
  const [viewingLogsId, setViewingLogsId] = useState<string | null>(null);

  if (incidents.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 italic bg-white">
        {isHistory ? "Aún no hay incidentes completados." : "No hay incidentes activos. Utiliza el formulario para añadir uno."}
      </div>
    );
  }

  const canEditName = !!onUpdateIncident;
  const canEditFields = !!onUpdateIncident && !isHistory;

  const handleAddAction = (incident: Incident, action: string) => {
    if (!onUpdateIncident) return;
    const newActions = [...incident.actions, action];
    onUpdateIncident(incident.id, 'actions', newActions);
    setAddingActionToId(null);
  };

  const handleRemoveAction = (incident: Incident, actionToRemove: string) => {
    if (!onBatchUpdateIncident) return;
    
    const newActions = incident.actions.filter(a => a !== actionToRemove);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = new Date().toLocaleDateString();
    const newLogEntry = `• ${incident.responsible} completó ${actionToRemove} (${date} ${time})`;
    
    const currentLogs = incident.logs || [];
    
    onBatchUpdateIncident(incident.id, {
      actions: newActions,
      logs: [...currentLogs, newLogEntry]
    });
  };

  const handleOpenComments = (incident: Incident) => {
    setEditingCommentId(incident.id);
    setTempComment(incident.comments || '');
  };

  const handleSaveComment = () => {
    if (editingCommentId && onUpdateIncident) {
      onUpdateIncident(editingCommentId, 'comments', tempComment);
      setEditingCommentId(null);
      setTempComment('');
    }
  };

  return (
    <div className="overflow-x-auto min-h-[300px] relative">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
            <th className="px-6 py-4 min-w-[140px]">Nombre</th>
            <th className="px-6 py-4 w-40">Fecha</th>
            <th className="px-6 py-4 w-32">Tipo</th>
            <th className="px-6 py-4 min-w-[200px]">Tema / Incidente</th>
            {!isHistory && <th className="px-6 py-4 w-24 text-center">Comentarios</th>}
            <th className="px-6 py-4 min-w-[200px]">Acción Pendiente</th>
            <th className="px-6 py-4 w-32">Responsable</th>
            <th className="px-6 py-4 w-32">Prioridad</th>
            <th className="px-6 py-4 w-32">Estado</th>
            <th className="px-6 py-4 min-w-[120px] text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {incidents.map((incident) => {
             const availableActions = getAvailableActions(incident.type);
             const unselectedActions = availableActions.filter(a => !incident.actions.includes(a));
             
             return (
              <tr key={incident.id} className="hover:bg-gray-50 transition-colors group">
                
                <td className="px-6 py-4">
                   {canEditName ? (
                    <input
                      type="text"
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-sm text-gray-800 transition-colors py-1 font-semibold"
                      value={incident.name || ''}
                      onChange={(e) => onUpdateIncident(incident.id, 'name', e.target.value)}
                      placeholder="Nombre..."
                    />
                   ) : (
                     <span className="text-sm font-semibold text-gray-800">{incident.name || '-'}</span>
                   )}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap font-mono">
                  {canEditFields ? (
                     <div className="relative group/date">
                        <input
                          type="date"
                          className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5 cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
                          value={incident.date}
                          onChange={(e) => onUpdateIncident(incident.id, 'date', e.target.value)}
                        />
                     </div>
                  ) : (
                    incident.date
                  )}
                </td>

                <td className="px-6 py-4">
                  <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                    {incident.type}
                  </span>
                </td>

                <td className="px-6 py-4">
                  {canEditFields ? (
                    <input
                      type="text"
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-sm text-gray-800 transition-colors py-1"
                      value={incident.subject}
                      onChange={(e) => onUpdateIncident(incident.id, 'subject', e.target.value)}
                    />
                  ) : (
                    <span className="text-sm text-gray-700">{incident.subject}</span>
                  )}
                </td>

                {!isHistory && (
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleOpenComments(incident)}
                      className={`p-2 rounded-full transition-all relative ${
                        incident.comments && incident.comments.trim().length > 0 
                          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 hover:scale-110' 
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                      }`}
                      title={incident.comments ? "Ver/Editar comentarios" : "Añadir comentario"}
                    >
                      <MessageSquare size={18} fill={incident.comments && incident.comments.trim().length > 0 ? "currentColor" : "none"} />
                      {incident.comments && incident.comments.trim().length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                      )}
                    </button>
                  </td>
                )}

                <td className="px-6 py-4 relative">
                  <div className="flex flex-wrap gap-2 items-center">
                    {incident.actions.map(act => (
                      <span key={act} className="inline-flex items-center gap-1.5 text-xs border border-gray-200 bg-gray-50 pl-2 pr-1 py-1 rounded text-gray-700 group/tag hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer select-none" 
                            title={canEditFields ? "Clic para eliminar (acción completada)" : ""}
                            onClick={() => canEditFields && handleRemoveAction(incident, act)}>
                        {act}
                        {canEditFields && (
                          <span className="bg-gray-200 group-hover/tag:bg-red-200 rounded-full p-0.5">
                            <X size={10} strokeWidth={3} />
                          </span>
                        )}
                      </span>
                    ))}
                    
                    {canEditFields && unselectedActions.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setAddingActionToId(addingActionToId === incident.id ? null : incident.id)}
                          className="p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                          title="Añadir acción"
                        >
                          <Plus size={14} />
                        </button>
                        
                        {addingActionToId === incident.id && (
                          <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-50 py-1">
                            {unselectedActions.map(action => (
                              <button
                                key={action}
                                onClick={() => handleAddAction(incident, action)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        )}
                        {addingActionToId === incident.id && (
                          <div 
                            className="fixed inset-0 z-40 bg-transparent" 
                            onClick={() => setAddingActionToId(null)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  {incident.actions.length === 0 && availableActions.length === 0 && (
                    <span className="text-gray-400 text-xs italic">-</span>
                  )}
                  {incident.actions.length === 0 && availableActions.length > 0 && (
                     <span className="text-green-500 text-xs font-medium flex items-center gap-1">
                       ¡Todo listo!
                     </span>
                  )}
                </td>

                <td className="px-6 py-4">
                  {canEditFields ? (
                    <select
                      value={incident.responsible}
                      onChange={(e) => onUpdateIncident(incident.id, 'responsible', e.target.value as Responsible)}
                      className={`text-xs font-bold px-2 py-1 rounded border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getResponsibleColor(incident.responsible)}`}
                    >
                      {RESPONSIBLES.map(r => (
                        <option key={r} value={r} className="bg-white text-gray-900">{r}</option>
                      ))}
                    </select>
                  ) : (
                     <span 
                       onClick={(e) => {
                         // Secret triple click activation preserved but totally hidden
                         if (isHistory && e.detail === 3) {
                           setViewingLogsId(incident.id);
                         }
                       }}
                       className={`text-xs font-bold px-2.5 py-1 rounded border select-none ${getResponsibleColor(incident.responsible)}`}
                     >
                        {incident.responsible}
                     </span>
                  )}
                </td>

                <td className="px-6 py-4">
                  {canEditFields ? (
                    <select
                      value={incident.priority}
                      onChange={(e) => onUpdateIncident(incident.id, 'priority', e.target.value as Priority)}
                      className={`text-xs font-bold px-2 py-1 rounded border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getPriorityColor(incident.priority)}`}
                    >
                      {PRIORITIES.map(p => (
                        <option key={p} value={p} className="bg-white text-gray-900">{p}</option>
                      ))}
                    </select>
                  ) : (
                    <div className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded text-xs font-bold border ${getPriorityColor(incident.priority)}`}>
                       <div className={`w-1.5 h-1.5 rounded-full ${incident.priority === 'Alta' ? 'bg-red-500' : incident.priority === 'Media' ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
                       {incident.priority}
                    </div>
                  )}
                </td>

                <td className="px-6 py-4">
                  {canEditFields ? (
                    <select
                      value={incident.status}
                      onChange={(e) => onUpdateIncident?.(incident.id, 'status', e.target.value as Status)}
                      className={`text-xs font-medium px-2 py-1 rounded border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getStatusColor(incident.status)}`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En curso">En curso</option>
                      <option value="Completado">Completado</option>
                    </select>
                  ) : (
                    <span className={`text-xs font-medium px-2 py-1 rounded border ${getStatusColor(incident.status)}`}>
                      {incident.status}
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  {onDelete && confirmId === incident.id ? (
                    <div className="flex items-center justify-end gap-2 animate-fade-in">
                       <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation();
                           onDelete?.(incident.id);
                           setConfirmId(null);
                         }}
                         className={`${isHistory ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-red-600 bg-red-50 border-red-200'} border px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 shadow-sm`}
                       >
                         {isHistory ? <RotateCcw size={12} /> : <Trash2 size={12} />}
                         {isHistory ? 'Restaurar' : 'Confirmar'}
                       </button>
                       <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation();
                           setConfirmId(null);
                         }}
                         className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                       >
                         <X size={14} />
                       </button>
                    </div>
                  ) : (
                    onDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmId(incident.id);
                        }}
                        className={`transition-colors p-2 rounded-md ${isHistory ? 'text-gray-400 hover:text-blue-500 hover:bg-blue-50' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
                        title={isHistory ? "Subir a incidentes activos" : "Eliminar registro"}
                      >
                        {isHistory ? <RotateCcw size={18} /> : <Trash2 size={18} />}
                      </button>
                    )
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Comment Modal */}
      {editingCommentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                 <MessageSquare size={20} className="text-blue-600" />
                 Comentarios del Incidente
               </h3>
               <button onClick={() => setEditingCommentId(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                 <X size={20} />
               </button>
             </div>
             <div className="p-6">
               <textarea
                 autoFocus
                 value={tempComment}
                 onChange={(e) => setTempComment(e.target.value)}
                 className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm text-gray-900 bg-white leading-relaxed"
                 placeholder="Escribe aquí los detalles..."
               ></textarea>
               <div className="flex justify-end gap-3 mt-6">
                 <button onClick={() => setEditingCommentId(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">
                   Cancelar
                 </button>
                 <button onClick={handleSaveComment} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all hover:shadow-md">
                   <Save size={18} />
                   Guardar
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Traceability Logs Modal (Secret triple click) */}
      {viewingLogsId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-blue-100">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                  <Info size={20} className="text-blue-600" />
                  Trazabilidad de Acciones
                </h3>
                <button onClick={() => setViewingLogsId(null)} className="text-blue-400 hover:text-blue-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 bg-white">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Registro Histórico de Operativa:</p>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                   {incidents.find(i => i.id === viewingLogsId)?.logs && incidents.find(i => i.id === viewingLogsId)?.logs?.length! > 0 ? (
                     incidents.find(i => i.id === viewingLogsId)?.logs?.map((log, idx) => (
                       <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700 font-medium">
                          {log}
                       </div>
                     ))
                   ) : (
                     <div className="text-center py-6 text-gray-400 italic text-sm">
                        No hay registros de acciones completadas manualmente para este incidente.
                     </div>
                   )}
                </div>
                <button 
                  onClick={() => setViewingLogsId(null)}
                  className="w-full mt-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
                >
                  Cerrar
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default IncidentTable;