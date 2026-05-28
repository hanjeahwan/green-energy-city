const SHORT_VALUE_MAP: Record<string, string> = {
  'Assigned queue': 'Queued',
  'On-site inspection': 'On-site',
  'Remote monitoring': 'Remote',
  'Inverter arc fault isolation': 'Arc fault',
  'Overdue work order triage': 'Work order',
  'Blade vibration inspection': 'Blade vibration',
  'Pressure relief valve response': 'Pressure relief',
  'RPM below dispatch threshold': 'RPM low'
}

const FACILITY_SUFFIX = /\s+·\s+(?:PS-\d+|wind-\d+|h2-[A-Z-]+|vat-[A-Z-]+)$/i

const OPERATOR_STATUS_VALUE_MAP: Array<[RegExp, string]> = [
  [/^On-site repair$/i, 'Repair'],
  [/^On-site inspection$/i, 'On-site'],
  [/^Supporting crew$/i, 'Supporting'],
  [/^Dispatch watch$/i, 'Watch'],
  [/^Assigned queue$/i, 'Queued'],
  [/^Remote monitoring$/i, 'Remote'],
  [/^Standing by$/i, 'Standby'],
  [/^Walking$/i, 'Walking'],
  [/^Monitoring$/i, 'Monitoring'],
  [/^Patrol$/i, 'Patrol'],
  [/^Standby$/i, 'Standby']
]

export function formatCardValue(value: string | number | undefined | null): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const compact = raw.replace(FACILITY_SUFFIX, '')
  const shortened = SHORT_VALUE_MAP[compact] ?? compact
  if (/^[a-z]/.test(shortened)) return shortened.charAt(0).toUpperCase() + shortened.slice(1)
  const numericWord = shortened.match(/^([+-]?\d+(?:[.,]\d+)?\s+)([a-z])(.*)$/)
  if (numericWord) {
    return `${numericWord[1]}${numericWord[2].toUpperCase()}${numericWord[3]}`
  }
  return shortened
}

export function formatOperatorStatusValue(value: string | undefined | null): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const compact = raw
    .replace(FACILITY_SUFFIX, '')
    .split(' · ')[0]
    .trim()
  const matched = OPERATOR_STATUS_VALUE_MAP.find(([pattern]) => pattern.test(compact))
  return matched ? matched[1] : formatCardValue(compact)
}
