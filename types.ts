export type IncidentType = 'GSR' | 'CSR' | 'ASR' | 'Gestión de riesgos' | 'PRL' | 'Otro';

export type Responsible = 'ALEX' | 'PEDRO' | 'OLEK' | 'LAURA' | 'Sin Asignar';

export type Priority = 'Alta' | 'Media' | 'Baja';

export type Status = 'Pendiente' | 'En curso' | 'Completado';

export interface Incident {
  id: string;
  name: string; // New field: Nombre del Incidente
  date: string;
  type: IncidentType;
  subject: string;
  actions: string[]; 
  responsible: Responsible;
  priority: Priority;
  status: Status;
  comments?: string; // New field for notes/comments
}

export interface Reminder {
  id: string;
  message: string;
  datetime: string; // Start ISO string
  endDatetime?: string; // End ISO string (optional)
}

export const INCIDENT_TYPES: IncidentType[] = [
  'GSR', 'CSR', 'ASR', 'Gestión de riesgos', 'PRL', 'Otro'
];

export const RESPONSIBLES: Responsible[] = ['Sin Asignar', 'ALEX', 'PEDRO', 'OLEK', 'LAURA'];

export const PRIORITIES: Priority[] = ['Alta', 'Media', 'Baja'];

export const STATUSES: Status[] = ['Pendiente', 'En curso', 'Completado'];

// Logic mappings
export const getAvailableActions = (type: IncidentType): string[] => {
  if (type === 'PRL') {
    return ['Volante mutua', '5.1', '5.3', 'R39', 'OD'];
  }
  if (type === 'Gestión de riesgos') {
    return [];
  }
  // All others
  return ['R05', 'R39', 'R06', 'OD'];
};