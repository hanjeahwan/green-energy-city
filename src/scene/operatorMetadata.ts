import type { ShowroomOperatorRole } from './showroomContract'

export type OperatorActionId = 'message' | 'locate' | 'reassign' | 'wearable'
export type OperatorPhoneState = 'available' | 'unavailable'
export type OperatorWearableState = 'online' | 'degraded' | 'offline'

export interface OperatorActionAvailability {
  enabled: boolean
  reason?: string
}

export interface OperatorProfile {
  id: string
  name: string
  title: string
  role: ShowroomOperatorRole
  subtitle: string
  defaultStatus: string
  office: string
  phone: OperatorPhoneState
  wearable: OperatorWearableState
  capabilities: string[]
  actions: Record<OperatorActionId, OperatorActionAvailability>
}

const ACTIONS_AVAILABLE: Record<OperatorActionId, OperatorActionAvailability> = {
  message: { enabled: true },
  locate: { enabled: true },
  reassign: { enabled: true },
  wearable: { enabled: true }
}

function actions(overrides: Partial<Record<OperatorActionId, OperatorActionAvailability>> = {}) {
  return { ...ACTIONS_AVAILABLE, ...overrides }
}

export const OPERATOR_PROFILES: Record<string, OperatorProfile> = {
  'ops-docent-command': {
    id: 'ops-docent-command',
    name: 'Maya Tan',
    title: 'Site Manager',
    role: 'docent',
    subtitle: 'Operations Manager',
    defaultStatus: 'Walking · Central admin',
    office: 'Office · Block C',
    phone: 'available',
    wearable: 'online',
    capabilities: ['showroom', 'command-center'],
    actions: actions({ reassign: { enabled: false, reason: 'No active assignment' } })
  },
  'ops-dispatch-command': {
    id: 'ops-dispatch-command',
    name: 'Daniel Koh',
    title: 'Dispatch Lead',
    role: 'dispatch',
    subtitle: 'Central admin',
    defaultStatus: 'Monitoring · Command desk',
    office: 'Office · Block C',
    phone: 'available',
    wearable: 'online',
    capabilities: ['dispatch', 'queue', 'pv', 'grid'],
    actions: actions()
  },
  'ops-security-plaza': {
    id: 'ops-security-plaza',
    name: 'Aisha Lim',
    title: 'Safety Marshal',
    role: 'security',
    subtitle: 'Visitor route safety',
    defaultStatus: 'Standing by · PS-02 perimeter',
    office: 'Office · East plaza',
    phone: 'available',
    wearable: 'online',
    capabilities: ['safety', 'perimeter'],
    actions: actions({ reassign: { enabled: false, reason: 'Safety role fixed' } })
  },
  'ops-inspect-solar': {
    id: 'ops-inspect-solar',
    name: 'Ravi Menon',
    title: 'Solar Inspector',
    role: 'inspection',
    subtitle: 'PV field inspection',
    defaultStatus: 'Patrol · PS-01 array',
    office: 'Office · Solar desk',
    phone: 'available',
    wearable: 'degraded',
    capabilities: ['pv', 'combiner', 'inverter'],
    actions: actions()
  },
  'ops-repair-battery-a': {
    id: 'ops-repair-battery-a',
    name: 'Chen Wei',
    title: 'Battery Technician',
    role: 'repair',
    subtitle: 'Repair crew A',
    defaultStatus: 'Standby · East storage',
    office: 'Office · Field bay',
    phone: 'available',
    wearable: 'online',
    capabilities: ['battery', 'inverter', 'pv', 'electrical'],
    actions: actions()
  },
  'ops-repair-battery-b': {
    id: 'ops-repair-battery-b',
    name: 'Nur Aina',
    title: 'Battery Technician',
    role: 'repair',
    subtitle: 'Repair crew B',
    defaultStatus: 'Standby · East storage',
    office: 'Office · Field bay',
    phone: 'unavailable',
    wearable: 'online',
    capabilities: ['battery', 'inverter', 'pv', 'electrical'],
    actions: actions({ message: { enabled: false, reason: 'Phone unavailable' } })
  },
  'ops-docent-ev': {
    id: 'ops-docent-ev',
    name: 'Sofia Lee',
    title: 'Mobility Guide',
    role: 'docent',
    subtitle: 'V2G tour guide',
    defaultStatus: 'Walking · V2G hub',
    office: 'Office · North mobility',
    phone: 'available',
    wearable: 'online',
    capabilities: ['showroom', 'ev'],
    actions: actions({ reassign: { enabled: false, reason: 'No active assignment' } })
  },
  'ops-dispatch-grid': {
    id: 'ops-dispatch-grid',
    name: 'Marcus Goh',
    title: 'Grid Dispatcher',
    role: 'dispatch',
    subtitle: 'Remote operations',
    defaultStatus: 'Monitoring · South grid',
    office: 'Office · Block C',
    phone: 'available',
    wearable: 'online',
    capabilities: ['grid', 'remote', 'vat', 'h2'],
    actions: actions()
  },
  'ops-security-park': {
    id: 'ops-security-park',
    name: 'Hana Yusuf',
    title: 'Community Safety',
    role: 'security',
    subtitle: 'NW park watch',
    defaultStatus: 'Walking · Community edge',
    office: 'Office · NW park',
    phone: 'available',
    wearable: 'offline',
    capabilities: ['safety', 'community'],
    actions: actions({ wearable: { enabled: true, reason: 'Wearable offline' } })
  },
  'ops-inspect-wind': {
    id: 'ops-inspect-wind',
    name: 'Owen Teo',
    title: 'Wind Technician',
    role: 'inspection',
    subtitle: 'Wind field inspection',
    defaultStatus: 'Patrol · SW wind farm',
    office: 'Office · SW wind',
    phone: 'available',
    wearable: 'online',
    capabilities: ['wind', 'inspection', 'vibration'],
    actions: actions()
  },
  'ops-repair-hydrogen-west': {
    id: 'ops-repair-hydrogen-west',
    name: 'Farid Noor',
    title: 'Hydrogen Technician',
    role: 'repair',
    subtitle: 'H2 response crew',
    defaultStatus: 'Standby · West H2 station',
    office: 'Office · Field bay',
    phone: 'available',
    wearable: 'degraded',
    capabilities: ['h2', 'pressure', 'safety'],
    actions: actions()
  }
}

export function getOperatorProfile(id: string): OperatorProfile {
  return OPERATOR_PROFILES[id] ?? {
    id,
    name: 'Unknown Operator',
    title: 'Operations Staff',
    role: 'inspection',
    subtitle: 'Unregistered demo profile',
    defaultStatus: 'Standby · Unknown area',
    office: 'Office · Unknown',
    phone: 'unavailable',
    wearable: 'offline',
    capabilities: [],
    actions: actions({
      message: { enabled: false, reason: 'Profile missing' },
      reassign: { enabled: false, reason: 'Profile missing' }
    })
  }
}

export function hasOperatorProfile(id: string): boolean {
  return id in OPERATOR_PROFILES
}
