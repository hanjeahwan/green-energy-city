import alarmIcon from '../public/alarm-agent.png'
import ticketIcon from '../public/ticket-agent.png'
import schedulingIcon from '../public/scheduling-agent.png'
import predictiveIcon from '../public/warning-agent.png'
import inspectionIcon from '../public/inspection-agent.png'
import pvIcon from '../public/pv-assistant-agent.png'
import diagnosisIcon from '../public/diagnosis-agent.png'
import dataqaIcon from '../public/data-qa-agent.png'

export type AgentId =
  | 'alarm'
  | 'ticket'
  | 'scheduling'
  | 'predictive'
  | 'inspection'
  | 'pv'
  | 'diagnosis'
  | 'dataqa'

export interface AgentAlarm {
  level: 'crit' | 'warn' | 'ok'
  label: string
  time: string
}

export interface AgentBubble {
  from: 'agent' | 'user' | 'system'
  time?: string
  body: string
  alarms?: AgentAlarm[]
}

export interface AgentMock {
  id: AgentId
  tabCode: string
  title: string
  subtitle: string
  pending: number
  composerPlaceholder: string
  greet: string
  icon: string
  bubbles: AgentBubble[]
  suggested: string[]
  chipReplies: Record<string, string>
  fallbackReplies: string[]
}

export const AGENTS: AgentMock[] = [
  {
    id: 'alarm',
    tabCode: 'ALM',
    title: 'Alarm Agent',
    subtitle: 'Triage & dispatch active alarms',
    pending: 2,
    composerPlaceholder: 'e.g. Analyze PS-02 ground fault',
    icon: alarmIcon,
    greet: 'Good afternoon. I sorted the last 15 minutes of alarms by confidence. Penang PS-02 is the most critical pair right now.',
    bubbles: [
      {
        from: 'agent',
        time: '14:32',
        body: 'Penang industrial park has 2 active alarms. Latest status pulled from ops:',
        alarms: [
          { level: 'crit', label: 'PS-02 / Inverter #4 · DC string ground fault', time: '14:32:11' },
          { level: 'warn', label: 'PS-02 / Combiner #2 · 24°C above baseline', time: '14:18:04' }
        ]
      },
      { from: 'user', time: '14:34', body: 'Isolate string #4 first, then dispatch?' },
      {
        from: 'agent',
        time: '14:34',
        body: 'OK. Short-term loss after isolation ≈ 38 kW (3.2% of site), no impact on output commitment. Already synced with Grid Agent.'
      },
      { from: 'user', time: '14:35', body: 'Good — isolate, then send crew 2.' },
      {
        from: 'agent',
        time: '14:35',
        body: 'Dispatched: ① remote isolate string #4; ② crew 2 (Chen) en route · ETA 38 min; ③ drone IR re-check in 6 min. Will report when done.'
      }
    ],
    suggested: ['View all alarms', 'Analyze Penang #2', 'Auto dispatch', 'Acknowledge all'],
    chipReplies: {
      'View all alarms': '6 alarms in last 24h: 2 CRIT, 3 WARN, 1 INFO auto-resolved. Grouped by site: PS-02 has 4, PS-05 has 2. Click any row for the evidence chain.',
      'Analyze Penang #2': 'PS-02 / Combiner #2 temp rose from +18°C to +24°C over 30 min. Combined with last night\'s storm, likely terminal moisture / loose contact. Diagnosis Agent re-running root cause.',
      'Auto dispatch': 'Auto-dispatched: crew 2 (Chen) + service van 04, carrying IGBT spares and terminal blocks. ETA 38 min. Drone leaves in 6 min for IR re-check.',
      'Acknowledge all': 'Batch-acknowledged both alarms. Ops will not escalate further unless metrics worsen.'
    },
    fallbackReplies: [
      'Logged. Mapped this onto the current alarm context — data suggests no field intervention needed yet, monitoring.',
      'Checked ops history. Correlation with current PS-02 alarm is low — likely routine fluctuation, marked grey confidence.',
      'Asked Diagnosis Agent to re-run. Will share its confidence + recommended path shortly.'
    ]
  },
  {
    id: 'ticket',
    tabCode: 'TKT',
    title: 'Ticket Agent',
    subtitle: 'Work order lifecycle',
    pending: 0,
    composerPlaceholder: 'e.g. Bump WO-2026-0418 to P1',
    icon: ticketIcon,
    greet: '18 open tickets. 3 overdue by more than 24 hours.',
    bubbles: [
      {
        from: 'agent',
        time: '14:30',
        body: 'Auto-nudged 3 overdue tickets and pushed the missing-parts list to procurement:',
        alarms: [
          { level: 'warn', label: 'WO-2026-0418 overdue 3d / Penang inverter', time: '14:00:00' },
          { level: 'warn', label: 'WO-2026-0421 spare shortage / IGBT module', time: '13:45:21' },
          { level: 'warn', label: 'WO-2026-0423 customer sign-off pending / panel wash', time: '12:30:12' }
        ]
      },
      { from: 'user', time: '14:33', body: 'Bump 0418 to P1 — Penang must close tonight.' },
      {
        from: 'agent',
        time: '14:33',
        body: 'WO-2026-0418 set to P1. Notified Scheduling Agent to tighten Chen\'s morning SLA to 6 hours.'
      },
      { from: 'user', time: '14:34', body: 'When do the parts arrive?' },
      {
        from: 'agent',
        time: '14:34',
        body: 'IGBT modules shipped from KL central depot, arriving Penang by 22:30 tonight. Tracking number attached to the ticket.'
      }
    ],
    suggested: ['View all tickets', 'Nudge overdue', 'Order parts', 'Export crew stats'],
    chipReplies: {
      'View all tickets': '18 tickets sorted by priority: P1 has 4 (incl. today\'s new 0418), P2 has 9, P3 has 5. Full list opened.',
      'Nudge overdue': 'Sent secondary reminder to 3 overdue (WO-0418 / 0421 / 0423) and escalated to crew leads. Want SMS too?',
      'Order parts': 'Purchase order created: IGBT ×2, terminal block ×5, sealant ×3. Express channel — arrival at central depot by 22:30 tonight.',
      'Export crew stats': 'Monthly crew performance generated (close rate / avg time / SLA hit). File ticket-team-2026-05.xlsx on your workspace.'
    },
    fallbackReplies: [
      'Searched ticket history. Conclusion: 2 similar cases in last 30 days, avg close 4.2 hours.',
      'Drafting the ticket — template fields filled, please review before sending.',
      'Attached this recommendation to WO-0418 and synced context to crew 2.'
    ]
  },
  {
    id: 'scheduling',
    tabCode: 'SCH',
    title: 'Scheduling Agent',
    subtitle: 'Crew & route optimization',
    pending: 0,
    composerPlaceholder: 'e.g. How many free crews today?',
    icon: schedulingIcon,
    greet: '4 dispatch routes running. 3 crews en route, 1 idle.',
    bubbles: [
      {
        from: 'agent',
        time: '14:28',
        body: 'Live crew positions:',
        alarms: [
          { level: 'ok',   label: 'Crew 1 (Wong) / PS-04 Malacca · returning', time: '14:25:00' },
          { level: 'warn', label: 'Crew 2 (Chen) / dispatched to Penang · ETA 38m', time: '14:35:00' },
          { level: 'ok',   label: 'Inspection 1 / SW Wind Farm · in progress', time: '14:20:00' }
        ]
      },
      { from: 'user', time: '14:31', body: 'After Penang, can Chen swing by PS-05 for the spares on the way back?' },
      {
        from: 'agent',
        time: '14:31',
        body: 'Doable. Merging PS-05 IGBT pickup into crew 2\'s return — ETA central depot 19:50. Window confirmed with dispatch.'
      },
      { from: 'user', time: '14:32', body: 'Good. Where do we send the idle crew?' },
      {
        from: 'agent',
        time: '14:32',
        body: 'Recommend South H2 station for tomorrow 06:30 valve re-check, avoiding Penang peak hours. Map route generated.'
      }
    ],
    suggested: ['View route map', 'Merge tickets', 'Schedule idle crew', 'Export ETA'],
    chipReplies: {
      'View route map': 'Live route map opened: crew 1 returning / crew 2 to Penang / inspection 1 at SW wind farm — color = ETA.',
      'Merge tickets': 'Merge suggestion: combine PS-04 cleaning into crew 2\'s return path. +4 km, saves one trip, 1.2-hour window saved.',
      'Schedule idle crew': 'Idle inspection 2 scheduled to South H2 SOP at 06:30 tomorrow, avoiding Penang peak. Notification sent.',
      'Export ETA': "Today's ETA report generating (route / crew / window / minutes deviation). File coming to your workspace."
    },
    fallbackReplies: [
      'Re-ran the optimal path — current plan still best.',
      'Added this change to today\'s ops cadence. Will push to crew leads for confirmation.',
      'Cross-checked ETA with Ticket Agent — no conflicts.'
    ]
  },
  {
    id: 'predictive',
    tabCode: 'PRD',
    title: 'Predictive Alert',
    subtitle: 'Anomaly forecasting',
    pending: 2,
    composerPlaceholder: 'e.g. 6h ahead risk forecast',
    icon: predictiveIcon,
    greet: '2 model warnings for the next 6 hours · both > 80% confidence.',
    bubbles: [
      {
        from: 'agent',
        time: '14:20',
        body: 'Potential anomalies in window 14:30 - 20:30:',
        alarms: [
          { level: 'warn', label: 'PS-05 array #12 hot-spot probability → 73% (baseline 18%)', time: '14:20:00' },
          { level: 'warn', label: 'SW turbine 02 · blade vibration trend worsening · 81% confidence', time: '14:20:00' }
        ]
      },
      { from: 'user', time: '14:22', body: 'For the hot-spot row, what features is the model using?' },
      {
        from: 'agent',
        time: '14:22',
        body: 'IR imagery (30d) + string current deviation + local irradiance variation — 3 weighted features. If temperature drops tonight, it falls back to 32%.'
      },
      { from: 'user', time: '14:23', body: 'So no immediate action needed?' },
      {
        from: 'agent',
        time: '14:23',
        body: 'Correct. Added to tomorrow\'s R-3 patrol — drone will do close-range IR review. The blade is more urgent: recommend turbine 02 derated for 4 hours.'
      }
    ],
    suggested: ['View forecast window', 'Derate operation', 'Add to patrol', 'Retrain model'],
    chipReplies: {
      'View forecast window': '14:30-20:30 panel opened: x-axis time, y-axis risk probability. Red line at 60% threshold. Both alarms exceed it.',
      'Derate operation': 'Turbine 02 derate command sent (80% → 65%) for 4 hours. Should pull vibration trend back to 1.2× baseline.',
      'Add to patrol': 'PS-05 #12 added to R-3 tomorrow — drone will run 0.5× denser close-range IR.',
      'Retrain model': 'Incremental retrain triggered (last 30 days anomalies). Expected 06:00 completion. Will notify on new version.'
    },
    fallbackReplies: [
      'Model explanation: main drivers are irradiance variation + historical similarity, confidence 73-81%.',
      '3 similar warnings in last 14 days under same features — 2 confirmed true positives.',
      'Suggest 1 hour observation. During that window I\'ll route the alarm to ops / diagnosis agents.'
    ]
  },
  {
    id: 'inspection',
    tabCode: 'INS',
    title: 'Inspection Agent',
    subtitle: 'Routine SOP & checklist',
    pending: 0,
    composerPlaceholder: 'e.g. How many R-2 checks left?',
    icon: inspectionIcon,
    greet: '4 patrol routes running. R-2 has 6 of 8 checks done.',
    bubbles: [
      {
        from: 'agent',
        time: '14:15',
        body: 'R-2 (PS-02 / PS-05 combined patrol) SOP progress:',
        alarms: [
          { level: 'ok',   label: '1-6 done (panel appearance / connector seal / ground resistance …)', time: '14:14:30' },
          { level: 'warn', label: '7. Combiner temp re-check — in progress', time: '14:15:00' },
          { level: 'ok',   label: '8. Remote comms heartbeat — pending', time: '—' }
        ]
      },
      { from: 'user', time: '14:17', body: 'Where are the combiner IR images stored?' },
      {
        from: 'agent',
        time: '14:17',
        body: 'Uploaded to ops storage / inspection / 2026-05-25 / PS-02 — 18 images total, 4 with anomaly annotations.'
      },
      { from: 'user', time: '14:18', body: "Export today's inspection report." },
      {
        from: 'agent',
        time: '14:18',
        body: 'Report generated (PDF + Excel): 4 routes summarized + anomaly list + handling recommendations. Send to ops dept for sign-off?'
      }
    ],
    suggested: ['View routes', 'IR imagery', 'Export report', 'Densify R-2'],
    chipReplies: {
      'View routes': '4 patrol route maps opened. R-1 / R-3 / R-4 all green. R-2 at step 7 combiner re-check — wrapping in 15 min.',
      'IR imagery': 'Pushed today\'s 18 IR images to viewer. 4 marked anomalous (click to zoom and see hot-spot coords).',
      'Export report': 'Inspection report generated (PDF + Excel): 4 routes / 32 checks / 5 anomalies. Send to ops manager now?',
      'Densify R-2': 'R-2 densified to 0.5× spacing — added 4 sample points (combiner shell, terminal block, cable conduit).'
    },
    fallbackReplies: [
      'SOP template matched to latest version — applies to next patrol automatically.',
      'Route optimization saved to drafts pending your sign-off.',
      'Logged this in today\'s inspection notes — tomorrow\'s review will summarize automatically.'
    ]
  },
  {
    id: 'pv',
    tabCode: 'PV',
    title: 'PV Assistant',
    subtitle: 'Performance specialist',
    pending: 0,
    composerPlaceholder: 'e.g. Why is PS-05 performance ratio low?',
    icon: pvIcon,
    greet: '5 PV sites · PR comparison: 4 on target, PS-05 at 89% (baseline 92%).',
    bubbles: [
      {
        from: 'agent',
        time: '14:10',
        body: 'Site 24h performance ratio ranking:',
        alarms: [
          { level: 'ok',   label: 'PS-01 KL 96.1% / PS-04 Malacca 94.8%', time: '14:10:00' },
          { level: 'ok',   label: 'PS-02 Penang 93.2% (excluding isolated string)', time: '14:10:00' },
          { level: 'warn', label: 'PS-05 Johor 89.0% · 3pp below baseline', time: '14:10:00' }
        ]
      },
      { from: 'user', time: '14:12', body: 'Where is PS-05\'s 3% loss coming from?' },
      {
        from: 'agent',
        time: '14:12',
        body: 'Soiling 1.6% / array #12 hot-spot 0.8% / inverter derate 0.6%. Recommend scheduling a wash first.'
      },
      { from: 'user', time: '14:13', body: 'Can the wash wait till next week?' },
      {
        from: 'agent',
        time: '14:13',
        body: 'Yes. Scheduled wash for next Tuesday 06:30 (cloud forecast 70%, minimum wash loss) and notified procurement to stage water.'
      }
    ],
    suggested: ['View ranking', 'Wash schedule', 'Export PR', 'Derate analysis'],
    chipReplies: {
      'View ranking': '5-site PR ranking opened: PS-01 96.1% / PS-04 94.8% / PS-02 93.2% / PS-03 retired / PS-05 89.0% (3pp below baseline).',
      'Wash schedule': 'Wash WO scheduled for next Tuesday 06:30 · ETA 4 hours · est. wash loss 0.18 MWh. Procurement notified to stage water.',
      'Export PR': 'PR report generated (24h / 7d / 30d). File pv-performance-2026-05-25.xlsx on workspace.',
      'Derate analysis': 'PS-05 inverter derate 0.6% mainly from string #3 IGBT high temp. Ticket opened to test cooling fans.'
    },
    fallbackReplies: [
      'Site snapshot shows this metric in normal fluctuation range — not an anomaly.',
      'Routing this data request to the Data Q&A agent — will return both answers shortly.',
      'Suggest pinning this curve to your watch list — I\'ll do a trend review tomorrow.'
    ]
  },
  {
    id: 'diagnosis',
    tabCode: 'DX',
    title: 'Diagnosis Agent',
    subtitle: 'Root-cause analysis',
    pending: 0,
    composerPlaceholder: 'e.g. Explain PS-02 ground fault root cause',
    icon: diagnosisIcon,
    greet: 'Bayesian root-cause for PS-02 / Inverter #4 DC ground fault complete · 91% confidence.',
    bubbles: [
      {
        from: 'agent',
        time: '14:33',
        body: 'Root cause (ranked by probability):',
        alarms: [
          { level: 'crit', label: 'Combiner terminal moisture corrosion — 91%', time: '14:33:00' },
          { level: 'warn', label: 'Panel backsheet local damage — 6%', time: '14:33:00' },
          { level: 'ok',   label: 'Cable insulation aging — 3%', time: '14:33:00' }
        ]
      },
      { from: 'user', time: '14:36', body: 'Why is terminal corrosion so high?' },
      {
        from: 'agent',
        time: '14:36',
        body: 'Penang had 7 days of heavy rain. Same site had 2 similar terminal alarms in May. Model weights both pieces of historical evidence.'
      },
      { from: 'user', time: '14:37', body: 'What spares should crew bring on arrival?' },
      {
        from: 'agent',
        time: '14:37',
        body: 'List ready: ① terminal block ×2; ② waterproof sealant; ③ thermal compound; ④ multimeter. Synced to crew 2\'s dispatch SMS.'
      }
    ],
    suggested: ['Evidence chain', 'Similar history', 'Parts list', 'Generate report'],
    chipReplies: {
      'Evidence chain': 'Evidence chain expanded: ① 30d IR (terminal temp trend); ② string current deviation > 5% for 7 days; ③ 2 same-site prior cases. Weighted to 91%.',
      'Similar history': 'Same-model inverter had 4 similar root-cause events in last 12 months — 3 terminal corrosion, 1 cable damage. Baseline match 0.78.',
      'Parts list': 'Parts list: terminal block ×2, sealant ×1, thermal compound ×1, multimeter ×1. Synced to crew 2 dispatch SMS.',
      'Generate report': 'Report generating (PDF): root cause, evidence chain, parts list, recommendations, similar history. ~30s to your workspace.'
    },
    fallbackReplies: [
      'Re-ran with same evidence — conclusion stable, confidence drift ≤ 1pp.',
      'Recommend adding this root cause to the next model retrain — will improve similar predictions.',
      'Asked Ops Agent to verify field handling strategy. Will align shortly.'
    ]
  },
  {
    id: 'dataqa',
    tabCode: 'Q&A',
    title: 'Data Q&A',
    subtitle: 'Ask anything about telemetry',
    pending: 0,
    composerPlaceholder: 'e.g. What is total 24h generation?',
    icon: dataqaIcon,
    greet: 'I can query any telemetry. What time window and metric do you want?',
    bubbles: [
      { from: 'user', time: '14:05', body: 'What is total portfolio generation in the last 24 hours?' },
      {
        from: 'agent',
        time: '14:05',
        body: '47.3 MWh. Breakdown: PS-04 1.84 / PS-01 2.14 / PS-05 4.32 / PS-02 0.92 (alarm-impacted) MWh — rest from wind + rooftop.'
      },
      { from: 'user', time: '14:07', body: 'Is PS-05 up or down from yesterday?' },
      {
        from: 'agent',
        time: '14:07',
        body: 'Down 6.8%. Mainly cloud cover rose from 38% to 52% and soiling has accumulated for 14 days.'
      },
      { from: 'user', time: '14:08', body: 'Export the site comparison table.' },
      {
        from: 'agent',
        time: '14:08',
        body: 'Excel generated: 5 sites · 24h cumulative · YoY/MoM · performance ratio · fault hours (5 columns). Download link sent to your workspace.'
      }
    ],
    suggested: ['Query 24h yield', 'YoY / MoM', 'Panel temp distribution', 'Export report'],
    chipReplies: {
      'Query 24h yield': '24h total 47.3 MWh. Detail: PS-01 2.14, PS-02 0.92, PS-04 1.84, PS-05 4.32 MWh — rest from wind + rooftop.',
      'YoY / MoM': 'MoM −3.4% / YoY +1.2%. Drop driven by PS-05 cloud rise + PS-02 fault isolation.',
      'Panel temp distribution': 'Current panel temp histogram: mean 41.2°C, p95 53.8°C, > 60°C count 17 (clustered in PS-05 #12 array).',
      'Export report': 'Site comparison Excel generated (5 sites / 24h / YoY-MoM / PR / fault hours). Download link on your workspace.'
    },
    fallbackReplies: [
      'Needs telemetry query — answering from latest 5-min snapshot: all key metrics in normal range.',
      'Added to query history — similar questions can be reused next time.',
      'Suggest saving this as a watch card for daily auto-push.'
    ]
  }
]
