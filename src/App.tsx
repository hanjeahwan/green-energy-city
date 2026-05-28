import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Zap,
  Activity,
  CircleCheck,
  ContactRound,
  Info,
  MapPinHouse,
  OctagonAlert,
  Pause,
  SwitchCamera,
  TriangleAlert,
} from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { motion } from 'framer-motion'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { toast } from 'sonner'
import LayoutAuditBanner from './components/LayoutAuditBanner'
import { AnimatedNumber } from './components/AnimatedNumber'
import { FpsBadge } from './components/FpsBadge'
import { OperatorFocusProxyLayer } from './components/OperatorFocusProxyLayer'
import { SceneZoomReadout } from './components/SceneZoomReadout'
import { Button } from './components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu'
import { Kbd } from './components/ui/kbd'
import { Toaster, type ToastTone } from './components/ui/sonner'
import { AGENTS, type AgentBubble, type AgentId } from './data/agents'
import { EVENT_LEVEL_LABELS, events, type EventLevel, type EventRow } from './data'
import { useEventStream } from './hooks/useEventStream'
import { useLiveKpis, type NodeStatus } from './hooks/useLiveKpis'
import { useNow } from './hooks/useNow'
import { SelectionProvider, useSelectionStore } from './scene/selection'
import { CameraModeProvider, useCameraMode } from './scene/cameraMode'
import { useScenario, type ScenarioId } from './scene/scenarios'
import { ShowroomActionsProvider } from './scene/showroomActions'
import { OPERATOR_PLACEMENTS } from './scene/operatorPlacements'
import { getOperatorProfile } from './scene/operatorMetadata'
import { operatorIncidentStatus } from './scene/operatorResponse'
import { SHOWROOM_ANCHOR_REGISTRY } from './scene/showroomContract'
import { getMeta } from './scene/facilityMetadata'
import { deriveStatus } from './scene/status'

// Lazy chunks — splits ~1MB CityScene + ~150KB Recharts off the first-load bundle
const CityScene = lazy(() => import('./components/CityScene'))
const AreaSpark = lazy(() => import('./components/TelemetryCharts').then((m) => ({ default: m.AreaSpark })))
const AlarmBars = lazy(() => import('./components/TelemetryCharts').then((m) => ({ default: m.AlarmBars })))
const NodePills = lazy(() => import('./components/TelemetryCharts').then((m) => ({ default: m.NodePills })))
const ChartFallback = () => <div className="h-full w-full bg-surface-soft animate-pulse rounded-md" />
import viewAlarmsIcon from './public/alert-marker.png'
import createWoIcon from './public/work-order-icon.png'
import dispatchIcon from './public/dispatch-icon.png'
import checklistIcon from './public/checklist-icon.png'
import historyIcon from './public/history-icon.png'
import smartReportIcon from './public/human-report-icon.png'
import maintenanceIcon from './public/maintenance-icon.png'
import sosIcon from './public/sos-marker.png'

const ENABLE_LAYOUT_AUDIT = import.meta.env.DEV
const ENABLE_FPS_BADGE = false

type AddEvent = (row: Omit<EventRow, 'ts'>) => void
type AddToast = (text: string, tone?: ToastTone) => void

const EVENT_LEVEL_ICON_CLASS: Record<EventLevel, string> = {
  INFO: 'text-info',
  OK: 'text-ok',
  WARN: 'text-warn',
  CRIT: 'text-crit',
}

// mock：项目"已运行 540 天"基线（用户每次 reload 都从 540 天起，符合客户展厅语境）
const APP_START = Date.now() - 540 * 24 * 60 * 60 * 1000
const pad = (n: number) => String(n).padStart(2, '0')
const fmtHMS = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
const fmtUtc = (d: Date) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
const fmtUptime = (now: Date): string => {
  const ms = now.getTime() - APP_START
  const days = Math.floor(ms / 86_400_000)
  return `${days}d ${fmtHMS(now)}`
}
const daysSince = (now: Date) => Math.floor((now.getTime() - APP_START) / 86_400_000)

export default function App() {
  const { list: eventList, push } = useEventStream(events)
  const live = useLiveKpis()

  const addEvent: AddEvent = useCallback((row) => push(row), [push])

  const addToast: AddToast = useCallback((text, tone = 'ok') => {
    const options = { duration: 2600 }
    if (tone === 'warn') {
      toast.warning(text, options)
    } else if (tone === 'info') {
      toast.info(text, options)
    } else if (tone === 'crit') {
      toast.error(text, options)
    } else {
      toast.success(text, options)
    }
  }, [])

  // Prefetch the 1.1MB CityScene chunk shortly after first paint so the first
  // facility hover/click doesn't pay the lazy-load latency.
  useEffect(() => {
    const t = window.setTimeout(() => {
      void import('./components/CityScene')
    }, 800)
    return () => window.clearTimeout(t)
  }, [])

  const alertEvents = useMemo(
    () => eventList.filter((e) => e.level === 'WARN' || e.level === 'CRIT'),
    [eventList]
  )
  const criticalEvents = useMemo(
    () => alertEvents.filter((e) => e.level === 'CRIT'),
    [alertEvents]
  )

  return (
    <CameraModeProvider>
      <SelectionProvider>
        <ShowroomActionsProvider addEvent={addEvent} addToast={addToast}>
          <div className="app">
            {ENABLE_LAYOUT_AUDIT && <LayoutAuditBanner />}
            <TopBar
              criticalCount={criticalEvents.length}
              latencyMs={live.latencyMs}
              agentsOnline={live.agentsOnline}
              agentsTotal={AGENTS.length}
            />
            <LeftFeed events={eventList} />
            <CenterScene
              alertCount={alertEvents.length}
              nodeCount={live.nodes.length}
              addEvent={addEvent}
              addToast={addToast}
            />
            <AgentPanel alarmCount={alertEvents.length} live={live} />
            <Toaster position="top-center" offset={72} />
          </div>
        </ShowroomActionsProvider>
      </SelectionProvider>
    </CameraModeProvider>
  )
}

interface TopBarProps {
  criticalCount: number
  latencyMs: number
  agentsOnline: number
  agentsTotal: number
}

type PillTone = 'ok' | 'warn' | 'crit'

function TopBar({ criticalCount, latencyMs, agentsOnline, agentsTotal }: TopBarProps) {
  const now = useNow(1000)
  const systemLabel = criticalCount === 0 ? 'SYS NOMINAL' : criticalCount <= 2 ? 'SYS CAUTION' : 'SYS CRITICAL'
  const systemTone: PillTone = criticalCount === 0 ? 'ok' : criticalCount <= 2 ? 'warn' : 'crit'
  const anomalySuffix = ` ANOMAL${criticalCount === 1 ? 'Y' : 'IES'}`
  const anomalyTone: PillTone = criticalCount === 0 ? 'ok' : criticalCount <= 2 ? 'warn' : 'crit'
  const latencyTone: PillTone = latencyMs < 150 ? 'ok' : latencyMs < 175 ? 'warn' : 'crit'
  const pillBase = 'pill font-sans tabular-nums'
  // void agentsTotal here — display "AI · N AGENTS" uses live online count only
  void agentsTotal
  return (
    <header className="topbar flex items-center gap-6 px-5 border-b border-border bg-bg z-10">
      <div className="brand flex items-center gap-3 min-w-[260px]">
        <div className="brand-mark w-7 h-7 rounded-full border-[1.5px] border-accent grid place-items-center text-accent">
          <Activity size={14} strokeWidth={2.25} />
        </div>
        <div className="brand-text flex flex-col gap-0.5 leading-ui-lockup">
          <b className="text-ui-title font-bold tracking-ui-brand">RUNJIAN COMMAND</b>
          <span className="font-sans text-ui-micro text-text-dim tracking-ui-wide">MY-SECTOR · INTERNATIONAL LANDING PLANTS</span>
        </div>
      </div>
      <div className="pills status-strip" role="status" aria-label="System status summary">
        <span className={`${pillBase} ${systemTone}`}>{systemLabel}</span>
        <span className={`${pillBase} ${anomalyTone}`}>
          <AnimatedNumber value={criticalCount} duration={0.4} />{anomalySuffix}
        </span>
        <span className={`${pillBase} ${latencyTone}`}>
          UPLINK <AnimatedNumber value={latencyMs} duration={0.5} />ms
        </span>
        <span className={`${pillBase} ok`}>
          AI · <AnimatedNumber value={agentsOnline} duration={0.45} /> AGENTS
        </span>
      </div>
      <div className="clock font-sans text-ui-caption text-text text-right tabular-nums w-[124px]">
        <div><span className="dim text-text-dim tracking-ui-label">MYT </span>{fmtHMS(now)}</div>
        <div><span className="dim text-text-dim tracking-ui-label">UTC </span>{fmtUtc(now)}</div>
        <div><span className="dim text-text-dim tracking-ui-label">T+ </span>{fmtUptime(now)}</div>
      </div>
      <div className="user flex items-center gap-2.5 pl-4 border-l border-border">
        <div className="avatar w-8 h-8 rounded-full bg-surface-avatar border border-accent/40 grid place-items-center font-sans text-ui-body font-bold text-accent">H</div>
        <div className="meta font-sans text-ui-body leading-ui-compact">
          <div className="tracking-ui-label">CMDR · HUNTER</div>
          <div className="dim text-text-dim text-ui-caption tracking-ui-label">CLEARANCE: P3 · INTL OPS</div>
        </div>
      </div>
    </header>
  )
}

function EventLevelIcon({ level }: { level: EventLevel }) {
  const className = `h-4 w-4 shrink-0 ${EVENT_LEVEL_ICON_CLASS[level]}`
  const label = EVENT_LEVEL_LABELS[level]
  const iconProps = {
    className,
    strokeWidth: 2.35,
    absoluteStrokeWidth: true,
    'aria-hidden': true,
  } as const

  if (level === 'CRIT') {
    return (
      <span role="img" aria-label={label}>
        <OctagonAlert {...iconProps} />
      </span>
    )
  }

  if (level === 'WARN') {
    return (
      <span role="img" aria-label={label}>
        <TriangleAlert {...iconProps} />
      </span>
    )
  }

  if (level === 'OK') {
    return (
      <span role="img" aria-label={label}>
        <CircleCheck {...iconProps} />
      </span>
    )
  }

  return (
    <span role="img" aria-label={label}>
      <Info {...iconProps} />
    </span>
  )
}

function LeftFeed({ events: eventList }: { events: EventRow[] }) {
  // auto-animate runs FLIP on this container's children: smooth insert/remove
  // /reorder with spring physics, ~3kb runtime, zero config beyond the ref.
  const [listRef] = useAutoAnimate<HTMLDivElement>({ duration: 280, easing: 'ease-out' })
  return (
    <aside className="left border-r border-border bg-bg flex flex-col overflow-hidden">
      <div className="panel-head flex items-center gap-2 px-3.5 py-2.5 border-b border-border font-sans text-ui-caption tracking-ui-label uppercase text-text-dim whitespace-nowrap">
        <span className="live-dot" />
        <span className="badge text-text">EVENT FEED</span>
        <span className="spacer flex-1" />
        <span><AnimatedNumber value={eventList.length} duration={0.3} /> EVENTS</span>
      </div>
      <div className="event-list flex-1 overflow-y-auto py-2 font-sans text-ui-body" ref={listRef}>
        {eventList.map((e) => {
          const key = `${e.ts}-${e.src}-${e.detail}`
          return (
          <div
            className="row flex flex-col gap-1 px-3 py-2 border-b border-dashed border-white/5"
            key={key}
          >
            <div className="meta flex items-center gap-2 min-w-0">
              <EventLevelIcon level={e.level} />
              <span className="src text-ui-body text-text font-semibold whitespace-nowrap overflow-hidden text-ellipsis min-w-0">{e.src}</span>
              <span className="ts text-ui-caption text-text-mute ml-auto shrink-0 font-sans">{e.ts}</span>
            </div>
            <div className="text text-ui-body leading-ui-normal text-text-mute">
              {e.detail}
            </div>
          </div>
          )
        })}
      </div>
    </aside>
  )
}

interface CenterSceneProps {
  alertCount: number
  nodeCount: number
  addEvent: AddEvent
  addToast: AddToast
}

function CenterScene({ alertCount, nodeCount, addEvent, addToast }: CenterSceneProps) {
  return (
    <main
      className="center relative bg-surface-scene overflow-hidden"
      data-fps-badge={ENABLE_FPS_BADGE ? 'true' : 'false'}
    >
      <Suspense fallback={null}>
        <CityScene />
      </Suspense>
      {/* CSS-only vignette overlay — was a per-frame fullscreen GPU pass
          inside EffectComposer; this is composited by the browser at the
          window-comp stage and costs nothing per render frame. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 220px 72px rgba(8, 12, 22, 0.32)' }}
      />
      <div className="scene-meta absolute top-5 left-6 font-sans text-ui-caption tracking-ui-brand uppercase text-text-dim pointer-events-none">
        <b className="text-text font-semibold">8-SECTOR SHOWROOM MAP</b> · DISTRIBUTED ENERGY · {nodeCount} PV NODES · AUTO PATROL
      </div>
      {ENABLE_FPS_BADGE && <FpsBadge />}
      <SceneZoomReadout />
      <OperatorFocusProxyLayer />
      <div className="scene-corners">
        <span className="tl" />
        <span className="tr" />
        <span className="bl" />
        <span className="br" />
      </div>
      <QuickActionsBar
        alertCount={alertCount}
        addEvent={addEvent}
        addToast={addToast}
      />
    </main>
  )
}

interface QuickActionDef {
  icon: string
  label: string
  hint: string
  key: string
  trigger: (alertCount: number) => { level: EventLevel; src: string; detail: string; toast: string; tone?: ToastTone }
  /** If set, pressing this action runs the named scenario script instead of firing trigger() once. */
  scenario?: ScenarioId
}

const QUICK_ACTIONS: QuickActionDef[] = [
  {
    icon: viewAlarmsIcon, label: 'View Alarms', hint: 'Active alarms', key: 'Q',
    trigger: (n) => ({ level: 'INFO', src: 'Operator', detail: `Alarm panel opened (${n} active alarms)`, toast: 'Alarm panel opened' })
  },
  {
    icon: createWoIcon, label: 'Create Work Order', hint: 'One-tap create', key: 'W',
    trigger: () => ({ level: 'INFO', src: 'Ticket System', detail: `Work order WO-2026-${String(Math.floor(Math.random() * 900) + 100)} created`, toast: 'Work order created' })
  },
  {
    icon: dispatchIcon, label: 'Dispatch Crew', hint: 'Field response', key: 'E',
    trigger: () => ({ level: 'WARN', src: 'Dispatch Center', detail: 'Repair crew 2 dispatched · ETA 18 min', toast: 'Crew dispatched', tone: 'warn' as const }),
    scenario: 'gridFault'
  },
  {
    icon: checklistIcon, label: 'Inspection', hint: 'Start patrol', key: 'R',
    trigger: () => ({ level: 'INFO', src: 'Inspection Agent', detail: 'Site-wide auto inspection started', toast: 'Inspection started' }),
    scenario: 'turbineOverspeed'
  },
  {
    icon: historyIcon, label: 'Ticket History', hint: 'Traceable', key: 'T',
    trigger: () => ({ level: 'OK', src: 'Ticket System', detail: 'Reviewed last 72 historical tickets', toast: 'History opened' })
  },
  {
    icon: smartReportIcon, label: 'Smart Report', hint: 'Daily summary', key: 'Y',
    trigger: () => ({ level: 'INFO', src: 'Report Center', detail: "Today's ops report generated (PDF + Excel)", toast: 'Report generated' })
  },
  {
    icon: maintenanceIcon, label: 'Maintenance', hint: 'Preventive', key: 'U',
    trigger: () => ({ level: 'INFO', src: 'Maintenance', detail: 'Preventive maintenance window opened (06:30-08:00)', toast: 'Window scheduled' }),
    scenario: 'hydrogenLeakRecovery'
  },
  {
    icon: sosIcon, label: 'SOS Escalate', hint: 'Emergency', key: 'I',
    trigger: () => ({ level: 'CRIT', src: 'Emergency', detail: 'SOS escalated · regional lead engaged within 60s', toast: 'SOS escalated', tone: 'warn' as const }),
    scenario: 'sos'
  }
]

const SCENE_DOCK_BUTTON_CLASS = 'inline-flex h-[32px] w-[32px] items-center justify-center rounded-md border border-[rgba(var(--accent-rgb),0.45)] bg-[rgba(8,12,18,0.88)] p-0 text-accent shadow-[0_4px_14px_rgba(var(--shadow-rgb),0.4)] backdrop-blur-md transition-[background,border-color,color] duration-150 hover:border-[rgba(var(--accent-rgb),0.7)] hover:bg-[rgba(8,12,18,0.94)] hover:text-text-bright data-[state=open]:border-[rgba(var(--accent-rgb),0.72)] data-[state=open]:bg-[rgba(8,12,18,0.96)]'
const SCENE_DOCK_ICON_CLASS = 'size-[18px]'

function compactTechnicianTitle(title: string): string {
  return title
    .replace('Battery Technician', 'Battery Tech')
    .replace('Hydrogen Technician', 'H2 Tech')
    .replace('Technician', 'Tech')
}

function compactOperatorStatus(status: string): string {
  return status.split(' · ')[0] ?? status
}

function QuickActionsBar({ alertCount, addEvent, addToast }: { alertCount: number; addEvent: AddEvent; addToast: AddToast }) {
  const runScenario = useScenario(addEvent, addToast)
  const { cruiseState, pauseCruise, resumeCruise } = useCameraMode()
  const selectedTarget = useSelectionStore((state) => state.selectedTarget)
  const selectedId = selectedTarget?.id ?? null
  const selectedFacilityId = selectedTarget?.kind === 'facility' ? selectedTarget.id : null
  const selectedOperatorId = selectedTarget?.kind === 'operator' ? selectedTarget.id : null
  const setSelected = useSelectionStore((state) => state.setSelected)
  const cruiseRunning = cruiseState === 'running'
  const facilityChoices = useMemo(() => {
    return Object.keys(SHOWROOM_ANCHOR_REGISTRY).map((id) => {
      const meta = getMeta(id)
      return {
        id,
        title: meta.title,
        status: meta.status ?? deriveStatus(id),
      }
    })
  }, [])
  const technicianChoices = useMemo(() => {
    return OPERATOR_PLACEMENTS
      .filter((placement) => placement.role === 'repair')
      .map((placement) => ({
        placement,
        profile: getOperatorProfile(placement.id),
        status: operatorIncidentStatus(placement.id)
      }))
  }, [])
  const dispatch = useCallback((qa: QuickActionDef) => {
    if (qa.scenario) {
      runScenario(qa.scenario)
    } else {
      const t = qa.trigger(alertCount)
      addEvent({ level: t.level, src: t.src, detail: t.detail })
      addToast(t.toast, t.tone)
    }
  }, [alertCount, addEvent, addToast, runScenario])
  const focusOperator = useCallback((operatorId: string) => {
    setSelected(operatorId, 'operator')
  }, [setSelected])
  const focusFacility = useCallback((facilityId: string) => {
    setSelected(facilityId, 'facility')
  }, [setSelected])
  const toggleCruise = useCallback(() => {
    if (cruiseRunning) {
      pauseCruise('cruise-toggle')
    } else {
      if (selectedId) setSelected(null)
      resumeCruise()
    }
  }, [cruiseRunning, pauseCruise, resumeCruise, selectedId, setSelected])
  // Global hotkeys: Q/W/E/R/T/Y/U/I → trigger respective QuickAction (hook ignores presses while <input>/<textarea> focused by default).
  useHotkeys(
    QUICK_ACTIONS.map((a) => a.key.toLowerCase()).join(','),
    (_e, handler) => {
      const k = (handler.keys?.[0] ?? '').toUpperCase()
      const qa = QUICK_ACTIONS.find((a) => a.key === k)
      if (qa) dispatch(qa)
    },
    { preventDefault: true },
    [dispatch]
  )
  return (
    <div className="scene-quickbar">
      <Button
        variant="ghost"
        className={`scene-cruise-button ${SCENE_DOCK_BUTTON_CLASS}`}
        data-cruise={cruiseRunning ? 'running' : 'paused'}
        aria-pressed={cruiseRunning}
        aria-label={cruiseRunning ? 'Pause city cruise' : 'Resume city cruise'}
        title={cruiseRunning ? 'Pause city cruise' : 'Resume city cruise'}
        onClick={toggleCruise}
      >
        {cruiseRunning
          ? <Pause className={SCENE_DOCK_ICON_CLASS} size={18} strokeWidth={2.25} />
          : <SwitchCamera className={SCENE_DOCK_ICON_CLASS} size={18} strokeWidth={2.25} />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
        >
          <Button
            variant="ghost"
            className={SCENE_DOCK_BUTTON_CLASS}
            aria-label="Open facility focus menu"
            title="Facility focus"
          >
            <MapPinHouse className={SCENE_DOCK_ICON_CLASS} size={18} strokeWidth={2.25} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={8}
          className="facility-focus-menu flex w-[248px] min-w-[248px] flex-col gap-[3px] rounded-lg border border-white/10 bg-[rgba(8,12,18,0.94)] p-[5px] text-text shadow-[0_16px_40px_rgba(var(--shadow-rgb),0.5)] backdrop-blur-xl"
        >
          {facilityChoices.map(({ id, title, status }) => {
            const active = selectedFacilityId === id
            return (
              <DropdownMenuItem
                key={id}
                className={`facility-focus-item min-h-[34px] w-full min-w-0 cursor-pointer gap-[8px] rounded-md border px-[9px] py-[6px] text-text transition-[background,border-color,transform] duration-150 hover:border-[rgba(var(--accent-rgb),0.32)] hover:bg-[rgba(var(--accent-rgb),0.08)] active:translate-y-px focus:bg-[rgba(var(--accent-rgb),0.08)] focus:!text-text ${active ? 'border-[rgba(var(--accent-rgb),0.46)] bg-[rgba(var(--accent-rgb),0.1)]' : 'border-transparent'}`}
                data-facility-focus-choice={id}
                data-selected={active ? 'true' : 'false'}
                onSelect={() => focusFacility(id)}
              >
                <span className={`fac-dot ${status}`} aria-hidden="true" />
                <b className="min-w-0 flex-1 truncate text-left text-ui-body font-semibold text-text group-focus/dropdown-menu-item:!text-text">
                  {title}
                </b>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
        >
          <Button
            variant="ghost"
            className={`${SCENE_DOCK_BUTTON_CLASS} operator-quick-focus-button`}
            aria-label="Open technician focus menu"
            title="Technician focus"
          >
            <ContactRound className={SCENE_DOCK_ICON_CLASS} size={18} strokeWidth={2.25} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={8}
          className="flex w-[248px] min-w-[248px] flex-col gap-[3px] rounded-lg border border-white/10 bg-[rgba(8,12,18,0.94)] p-[5px] text-text shadow-[0_16px_40px_rgba(var(--shadow-rgb),0.5)] backdrop-blur-xl"
        >
          {technicianChoices.map(({ placement, profile, status }) => {
            const active = selectedOperatorId === profile.id
            const initials = profile.name
              .split(/\s+/)
              .map((part) => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
            return (
              <DropdownMenuItem
                key={profile.id}
                className={`w-full min-w-0 cursor-pointer gap-[8px] rounded-md border px-[8px] py-[6px] text-text transition-[background,border-color,transform] duration-150 hover:border-[rgba(var(--accent-rgb),0.32)] hover:bg-[rgba(var(--accent-rgb),0.08)] active:translate-y-px focus:bg-[rgba(var(--accent-rgb),0.08)] focus:!text-text ${active ? 'border-[rgba(var(--accent-rgb),0.46)] bg-[rgba(var(--accent-rgb),0.1)]' : 'border-transparent'}`}
                data-operator-focus-choice={profile.id}
                data-anchor-id={placement.anchorId}
                data-selected={active ? 'true' : 'false'}
                onSelect={() => focusOperator(profile.id)}
              >
                <span className="operator-choice-avatar grid h-[24px] w-[24px] shrink-0 place-items-center rounded-full border border-[rgba(var(--accent-rgb),0.34)] bg-[rgba(var(--accent-rgb),0.1)] font-sans text-ui-micro font-bold tracking-normal text-accent">
                  {initials}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-[2px] text-left leading-ui-compact">
                  <b className="truncate text-ui-body font-semibold text-text group-focus/dropdown-menu-item:!text-text">{profile.name}</b>
                  <span className="operator-choice-subtitle truncate font-sans text-ui-caption tracking-ui-data text-text-dim group-focus/dropdown-menu-item:!text-text-dim">
                    {compactTechnicianTitle(profile.title)} · {compactOperatorStatus(status)}
                  </span>
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
        >
          <Button
            variant="ghost"
            className={SCENE_DOCK_BUTTON_CLASS}
            aria-label="Open ops menu"
          >
            <Zap className={SCENE_DOCK_ICON_CLASS} size={18} strokeWidth={2.25} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={8}
          className="flex w-[206px] min-w-[206px] flex-col gap-[3px] rounded-lg border border-white/10 bg-[rgba(8,12,18,0.94)] p-[5px] text-text shadow-[0_16px_40px_rgba(var(--shadow-rgb),0.5)] backdrop-blur-xl"
        >
          {QUICK_ACTIONS.map((qa) => (
            <DropdownMenuItem
              key={qa.key}
              className="w-full min-w-0 cursor-pointer gap-[8px] rounded-md border border-transparent px-[9px] py-[5px] text-text transition-[background,border-color,transform] duration-150 hover:border-[rgba(var(--accent-rgb),0.32)] hover:bg-[rgba(var(--accent-rgb),0.08)] active:translate-y-px focus:bg-[rgba(var(--accent-rgb),0.08)] focus:!text-text"
              onSelect={() => dispatch(qa)}
            >
              <img className="h-[22px] w-[22px] shrink-0 border-0 bg-transparent p-0 object-contain" src={qa.icon} alt="" />
              <div className="flex min-w-0 flex-1 flex-col gap-[2px] text-left leading-ui-compact">
                <b className="truncate text-ui-body font-semibold text-text group-focus/dropdown-menu-item:!text-text">{qa.label}</b>
                <span className="truncate font-sans text-ui-caption tracking-ui-data text-text-dim group-focus/dropdown-menu-item:!text-text-dim">{qa.hint}</span>
              </div>
              <Kbd className="ml-auto h-[16px] min-w-0 w-[16px] shrink-0 rounded-sm border border-[rgba(var(--white-rgb),0.14)] bg-[rgba(var(--white-rgb),0.04)] px-0 text-ui-micro tracking-normal text-text-dim group-hover/dropdown-menu-item:border-[rgba(var(--white-rgb),0.28)] group-hover/dropdown-menu-item:!text-text group-focus/dropdown-menu-item:!text-text">
                {qa.key}
              </Kbd>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function nowHHMM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

type LiveKpis = ReturnType<typeof useLiveKpis>

function AgentPanel({ alarmCount, live }: { alarmCount: number; live: LiveKpis }) {
  const [activeId, setActiveId] = useState<AgentId>('alarm')

  // Number keys 1..N → jump directly to that agent. Hook ignores presses while
  // <input>/<textarea> is focused so composer typing still works.
  useHotkeys(
    AGENTS.map((_, i) => String(i + 1)).join(','),
    (_e, handler) => {
      const idx = parseInt(handler.keys?.[0] ?? '0', 10) - 1
      const agent = AGENTS[idx]
      if (agent) setActiveId(agent.id)
    },
    { preventDefault: true },
    []
  )

  const [chatLog, setChatLog] = useState<Record<AgentId, AgentBubble[]>>(
    () => Object.fromEntries(AGENTS.map((a) => [a.id, [...a.bubbles]])) as Record<AgentId, AgentBubble[]>
  )
  const [typing, setTyping] = useState<Record<AgentId, boolean>>(
    () => Object.fromEntries(AGENTS.map((a) => [a.id, false])) as Record<AgentId, boolean>
  )
  const [draft, setDraft] = useState('')
  const chatRef = useRef<HTMLDivElement | null>(null)
  // Combine auto-animate callback ref with object ref used for auto-scroll
  const [autoAnimateChatRef] = useAutoAnimate<HTMLDivElement>({ duration: 220, easing: 'ease-out' })
  const setChatNode = useCallback((node: HTMLDivElement | null) => {
    chatRef.current = node
    autoAnimateChatRef(node)
  }, [autoAnimateChatRef])
  const agent = AGENTS.find((a) => a.id === activeId) ?? AGENTS[0]
  const bubbles = chatLog[activeId]
  const isTyping = typing[activeId]

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [bubbles, isTyping, activeId])

  const appendUserAndReply = useCallback((userText: string, replyText: string) => {
    const userTime = nowHHMM()
    setChatLog((prev) => ({
      ...prev,
      [activeId]: [...prev[activeId], { from: 'user', time: userTime, body: userText }]
    }))
    setTyping((prev) => ({ ...prev, [activeId]: true }))
    const targetId = activeId
    window.setTimeout(() => {
      setChatLog((prev) => ({
        ...prev,
        [targetId]: [...prev[targetId], { from: 'agent', time: nowHHMM(), body: replyText }]
      }))
      setTyping((prev) => ({ ...prev, [targetId]: false }))
    }, 800)
  }, [activeId])

  const onChipClick = (chip: string) => {
    const reply = agent.chipReplies[chip] ?? agent.fallbackReplies[0]
    appendUserAndReply(chip, reply)
  }
  const onSend = () => {
    const text = draft.trim()
    if (!text) return
    const reply = agent.fallbackReplies[Math.floor(Math.random() * agent.fallbackReplies.length)]
    appendUserAndReply(text, reply)
    setDraft('')
  }

  return (
    <aside className="right border-l border-border bg-bg flex flex-col overflow-hidden">
      <TelemetryPanel alarmCount={alarmCount} live={live} />
      <div className="agent-area flex-1 grid grid-cols-[60px_1fr] min-h-0 overflow-hidden">
        <div className="agent-rail flex flex-col gap-0.5 py-1.5 px-0.5 bg-white/[0.02] border-r border-border overflow-y-auto">
          {AGENTS.map((a, i) => (
            <button
              key={a.id}
              className={`rail-tab${a.id === activeId ? ' active' : ''}`}
              title={`${a.title} · press ${i + 1}`}
              onClick={() => setActiveId(a.id)}
              aria-pressed={a.id === activeId}
            >
              <img className="rail-ic" src={a.icon} alt="" />
              {i < 9 && <span className="kbd" aria-hidden="true">{i + 1}</span>}
              {a.pending > 0 && (
                <motion.span
                  className="dot"
                  key={a.pending}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                >
                  {a.pending}
                </motion.span>
              )}
            </button>
          ))}
        </div>
        <div className="agent-main flex flex-col min-w-0 min-h-0 overflow-hidden">
          <div className="agent-head flex items-center gap-2.5 px-3.5 py-2 border-b border-border relative" title={agent.subtitle}>
            <div className="ic-wrap w-9 h-9 grid place-items-center shrink-0">
              <img className="ic w-9 h-9 object-contain" src={agent.icon} alt="" />
            </div>
            <h3 className="m-0 text-ui-title font-semibold text-text tracking-ui-data flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">{agent.title}</h3>
            {agent.pending > 0 && (
              <motion.span
                className="pending px-2 py-[3px] rounded-md bg-crit/15 border border-crit/40 text-crit font-sans text-ui-caption font-semibold whitespace-nowrap shrink-0"
                key={agent.pending}
                initial={{ scale: 1.25 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 360, damping: 20 }}
              >
                <AnimatedNumber value={agent.pending} duration={0.35} /> active
              </motion.span>
            )}
          </div>
          <div className="chat flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5" ref={setChatNode}>
            <div className="system text-ui-caption text-text-mute italic text-center py-0.5">Switched to {agent.title}.</div>
            <div className="bubble agent greet text-ui-body leading-ui-chat text-text max-w-full">{agent.greet}</div>
            {bubbles.map((b, i) => (
              <div className={`bubble ${b.from} border border-border rounded-lg px-3 py-2 text-ui-body leading-ui-chat max-w-[86%] flex flex-col gap-1 ${b.from === 'user' ? 'self-end bg-accent/10 border-accent/35!' : 'self-start bg-surface-panel'}`} key={`${activeId}-${i}`}>
                {b.time && <span className={`time text-ui-micro tracking-ui-data ${b.from === 'user' ? 'text-accent/70' : 'text-text-mute'}`}>{b.time}</span>}
                <div className="body">{b.body}</div>
                {b.alarms && (
                  <div className="alarms flex flex-col gap-1.5 mt-2">
                    {b.alarms.map((al, j) => (
                      <div className="alarm-line flex items-start gap-2 text-ui-body" key={j}>
                        <span className={`dot ${al.level} w-[7px] h-[7px] rounded-full mt-[5px] shrink-0`} />
                        <span className="label flex-1 text-text">{al.label}</span>
                        <span className="time text-text-mute shrink-0">{al.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="bubble agent typing self-start bg-surface-panel border border-border rounded-lg px-3 py-2 flex flex-col gap-1">
                <span className="time text-ui-micro tracking-ui-data text-text-mute">{nowHHMM()}</span>
                <div className="typing-dots"><span /><span /><span /></div>
              </div>
            )}
          </div>
          <div className="suggested flex flex-wrap gap-1.5 px-3.5 py-2.5 border-t border-border">
            {agent.suggested.map((s) => (
              <button key={s} className="chip px-3 py-1.5 bg-surface-muted border border-border-strong rounded-md text-text font-sans text-ui-body hover:bg-surface-hover hover:border-accent hover:text-accent" onClick={() => onChipClick(s)}>{s}</button>
            ))}
          </div>
          <div className="composer flex gap-2 px-3.5 py-2.5 border-t border-border">
            <input
              className="flex-1 bg-surface-panel border border-border text-text px-3 py-2 rounded-md font-sans text-ui-title placeholder:text-text-mute"
              placeholder={agent.composerPlaceholder}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSend() }}
            />
            <Button
              className="h-[32px] rounded-md border-0 bg-accent px-3.5 py-2 font-sans text-ui-body font-semibold text-text-on-accent hover:bg-accent/80"
              onClick={onSend}
            >
              SEND
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}

function TelemetryPanel({ alarmCount, live }: { alarmCount: number; live: LiveKpis }) {
  const { power, tokens, powerHist, tokensHist, alarmHist24h, nodes } = live
  const okNodes = nodes.filter((n) => n.ok).length
  return (
    <div className="telemetry px-3.5 py-3 border-b border-border">
      <div className="head flex items-center gap-2.5 mb-2 font-sans text-ui-caption tracking-ui-brand uppercase text-text-dim">
        <span>DATA</span>
        <b className="text-text font-semibold">LIVE TELEMETRY</b>
        <span className="spacer flex-1" />
        <span className="dim text-text-mute">{okNodes}/{nodes.length} NODES OK</span>
      </div>
      <div className="kpi-grid grid grid-cols-2 gap-1.5">
        <KpiTile
          label="PORTFOLIO POWER"
          value={<AnimatedNumber value={power} format={(n) => Math.round(n).toLocaleString()} duration={0.8} />}
          unit="kW"
        >
          <Suspense fallback={<ChartFallback />}>
            <AreaSpark hist={powerHist} />
          </Suspense>
        </KpiTile>
        <KpiTile
          label="ALARM COUNT 24H"
          value={<AnimatedNumber value={alarmCount} duration={0.4} />}
          crit={alarmCount > 4}
        >
          <Suspense fallback={<ChartFallback />}>
            <AlarmBars hist={alarmHist24h} />
          </Suspense>
        </KpiTile>
        <KpiTile label="NODE STATUS" value={`${okNodes}/${nodes.length} OK`}>
          <Suspense fallback={<ChartFallback />}>
            <NodePills nodes={nodes} />
          </Suspense>
        </KpiTile>
        <KpiTile
          label="AGENT ACTIVITY"
          value={<AnimatedNumber value={tokens} format={(n) => n.toFixed(1)} duration={0.7} />}
          unit="k tok"
        >
          <Suspense fallback={<ChartFallback />}>
            <AreaSpark hist={tokensHist} />
          </Suspense>
        </KpiTile>
      </div>
    </div>
  )
}

interface KpiTileProps {
  label: string
  value: ReactNode
  unit?: string
  crit?: boolean
  children?: ReactNode
}

function KpiTile({ label, value, unit, crit, children }: KpiTileProps) {
  return (
    <div className="kpi flex flex-col gap-1 px-2.5 py-2 bg-panel-solid border border-border rounded-md h-24">
      <div className="font-sans text-ui-caption tracking-ui-wide text-text-dim uppercase leading-ui-compact whitespace-nowrap overflow-hidden text-ellipsis">{label}</div>
      <div className={`font-sans text-ui-metric font-bold leading-none whitespace-nowrap tabular-nums ${crit ? 'text-crit' : 'text-text'}`}>
        {value}
        {unit ? <span className="text-ui-caption text-text-dim font-normal ml-1">{unit}</span> : null}
      </div>
      <div className="flex-1 min-h-0 w-full select-none pointer-events-none">{children}</div>
    </div>
  )
}

// AreaSpark / AlarmBars / NodePills moved to ./components/TelemetryCharts.tsx + React.lazy at top.
