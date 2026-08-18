import { useState, useEffect, useRef } from 'react';
import { CalendarClock, Plus, Trash2, ChevronRight, Clock, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleSegment {
  id: string;
  label: string;
  startTime: string; // HH:MM
  durationMinutes: number;
  scene?: string;
  color: string;
}

const COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-amber-500',
  'bg-purple-500', 'bg-cyan-500', 'bg-rose-500', 'bg-orange-500'
];

function genId() { return `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function nowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

const DEFAULT_SEGMENTS: ScheduleSegment[] = [
  { id: genId(), label: 'Pre-Show', startTime: '20:00', durationMinutes: 5, scene: 'INTRO', color: COLORS[0] },
  { id: genId(), label: 'Opening', startTime: '20:05', durationMinutes: 10, scene: 'LIVE CAMERA', color: COLORS[1] },
  { id: genId(), label: 'Main Segment', startTime: '20:15', durationMinutes: 30, scene: 'LIVE CAMERA', color: COLORS[2] },
  { id: genId(), label: 'Ad Break', startTime: '20:45', durationMinutes: 5, scene: 'ADVERTISEMENT', color: COLORS[5] },
  { id: genId(), label: 'Closing', startTime: '20:50', durationMinutes: 10, scene: 'OUTRO', color: COLORS[3] },
];

interface StreamSchedulePlannerProps {
  scenes: string[];
  disabled: boolean;
  onSwitchScene?: (scene: string) => void;
}

type SegmentStatus = 'upcoming' | 'live' | 'done' | 'late';

export default function StreamSchedulePlanner({ scenes, disabled, onSwitchScene }: StreamSchedulePlannerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [segments, setSegments] = useState<ScheduleSegment[]>(DEFAULT_SEGMENTS);
  const [currentTime, setCurrentTime] = useState(nowTime());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tickRef.current = setInterval(() => setCurrentTime(nowTime()), 10000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  function getStatus(seg: ScheduleSegment): SegmentStatus {
    const nowMins = timeToMinutes(currentTime);
    const start = timeToMinutes(seg.startTime);
    const end = start + seg.durationMinutes;
    if (nowMins >= start && nowMins < end) return 'live';
    if (nowMins >= end) return 'done';
    if (nowMins > start) return 'late';
    return 'upcoming';
  }

  function getEndTime(seg: ScheduleSegment): string {
    return minutesToTime(timeToMinutes(seg.startTime) + seg.durationMinutes);
  }

  function addSegment() {
    const last = segments[segments.length - 1];
    const newStart = last ? minutesToTime(timeToMinutes(last.startTime) + last.durationMinutes) : nowTime();
    setSegments(prev => [...prev, {
      id: genId(),
      label: 'New Segment',
      startTime: newStart,
      durationMinutes: 15,
      scene: scenes[0],
      color: COLORS[prev.length % COLORS.length],
    }]);
  }

  function updateSegment(id: string, patch: Partial<ScheduleSegment>) {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  function deleteSegment(id: string) {
    setSegments(prev => prev.filter(s => s.id !== id));
  }

  const liveSegment = segments.find(s => getStatus(s) === 'live');
  const nextSegment = segments.find(s => getStatus(s) === 'upcoming');

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 h-11 border-b border-border cursor-pointer hover:bg-secondary/10 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        <ChevronRight size={13} className={cn('text-muted-foreground transition-transform shrink-0', !collapsed && 'rotate-90')} />
        <CalendarClock size={12} className={cn('shrink-0', liveSegment ? 'text-[hsl(var(--live-red))]' : 'text-muted-foreground')} />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          Show Schedule
        </span>
        {liveSegment && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--live-red))]/15 border border-[hsl(var(--live-red))]/30 font-mono-console text-[9px] text-[hsl(var(--live-red))] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--live-red))] pulse-red" />
            {liveSegment.label}
          </span>
        )}
        <span className="font-mono-console text-[10px] text-muted-foreground shrink-0 tabular-nums">{currentTime}</span>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-2">
          {/* Status strip */}
          {(liveSegment || nextSegment) && (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border">
              {liveSegment && (
                <div className="flex-1 min-w-0">
                  <p className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider">On Air Now</p>
                  <p className="font-mono-console text-xs text-foreground truncate">{liveSegment.label}</p>
                  <p className="font-mono-console text-[9px] text-[hsl(var(--live-red))]">until {getEndTime(liveSegment)}</p>
                </div>
              )}
              {nextSegment && (
                <div className="flex-1 min-w-0">
                  <p className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider">Up Next</p>
                  <p className="font-mono-console text-xs text-foreground truncate">{nextSegment.label}</p>
                  <p className="font-mono-console text-[9px] text-amber-400">{nextSegment.startTime}</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-1">
            {segments.map(seg => {
              const status = getStatus(seg);
              return (
                <div
                  key={seg.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg border transition-all',
                    status === 'live' ? 'border-[hsl(var(--live-red))]/50 bg-[hsl(var(--live-red))]/8' :
                    status === 'done' ? 'border-border/40 bg-transparent opacity-50' :
                    status === 'late' ? 'border-amber-500/40 bg-amber-500/5' :
                    'border-border bg-secondary/15'
                  )}
                >
                  {/* Status icon */}
                  <div className="shrink-0">
                    {status === 'live' && <span className="w-2 h-2 rounded-full bg-[hsl(var(--live-red))] pulse-red block" />}
                    {status === 'done' && <CheckCircle2 size={12} className="text-muted-foreground/40" />}
                    {status === 'late' && <AlertCircle size={12} className="text-amber-400" />}
                    {status === 'upcoming' && <Circle size={12} className="text-muted-foreground/40" />}
                  </div>

                  {/* Color dot */}
                  <div className={cn('w-2 h-2 rounded-full shrink-0', seg.color)} />

                  {/* Time */}
                  <div className="flex flex-col shrink-0 w-16">
                    <span className="font-mono-console text-[10px] text-foreground tabular-nums">{seg.startTime}</span>
                    <span className="font-mono-console text-[8px] text-muted-foreground/50 tabular-nums">{getEndTime(seg)}</span>
                  </div>

                  {/* Label */}
                  <input
                    type="text"
                    value={seg.label}
                    onChange={e => updateSegment(seg.id, { label: e.target.value })}
                    className="flex-1 min-w-0 bg-transparent font-mono-console text-[10px] text-foreground focus:outline-none border-b border-transparent focus:border-border/60 truncate"
                  />

                  {/* Duration */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Clock size={9} className="text-muted-foreground/40" />
                    <input
                      type="number"
                      value={seg.durationMinutes}
                      min={1}
                      max={480}
                      onChange={e => updateSegment(seg.id, { durationMinutes: Math.max(1, Number(e.target.value)) })}
                      className="w-10 bg-transparent border border-border/40 rounded px-1 py-0.5 font-mono-console text-[9px] text-foreground text-right focus:outline-none"
                    />
                    <span className="font-mono-console text-[9px] text-muted-foreground/40">m</span>
                  </div>

                  {/* Scene + switch */}
                  <select
                    value={seg.scene || ''}
                    onChange={e => updateSegment(seg.id, { scene: e.target.value })}
                    className="w-24 bg-input border border-border/40 rounded px-1 py-0.5 font-mono-console text-[9px] text-foreground focus:outline-none"
                  >
                    <option value="" className="bg-[hsl(220,18%,11%)]">— scene —</option>
                    {scenes.map(s => <option key={s} value={s} className="bg-[hsl(220,18%,11%)]">{s}</option>)}
                  </select>

                  {seg.scene && onSwitchScene && (
                    <button
                      onClick={() => { if (!disabled && seg.scene) onSwitchScene(seg.scene); }}
                      disabled={disabled}
                      className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/40 hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 shrink-0"
                      title={`Switch to ${seg.scene}`}
                    >
                      ▶
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => deleteSegment(seg.id)}
                    className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/30 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                  >
                    <Trash2 size={9} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={addSegment}
            className="w-full py-2 rounded-lg border border-dashed border-border/50 font-mono-console text-[10px] text-muted-foreground hover:text-foreground hover:border-border transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={10} />
            Add Segment
          </button>
        </div>
      )}
    </div>
  );
}
