import { useState, useEffect, useRef } from 'react';
import { RundownSegment, StudioScene } from '@/types/studio';
import { Plus, Trash2, Play, ChevronUp, ChevronDown, Clock, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RundownPanelProps {
  rundown: RundownSegment[];
  scenes: StudioScene[];
  currentSceneId: string;
  isLive: boolean;
  onAdd: (seg: Omit<RundownSegment, 'id'>) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<RundownSegment>) => void;
  onSwitchToScene: (sceneId: string) => void;
}

function formatDur(s: number) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const STATUS_STYLE: Record<RundownSegment['status'], string> = {
  pending:  'text-muted-foreground border-border',
  live:     'text-red-400 border-red-500/50 bg-red-500/8',
  done:     'text-muted-foreground/40 border-border/30',
  overrun:  'text-orange-400 border-orange-500/50 bg-orange-500/8',
};

const STATUS_ICON: Record<RundownSegment['status'], React.ElementType> = {
  pending:  Clock,
  live:     Zap,
  done:     CheckCircle2,
  overrun:  AlertTriangle,
};

export default function RundownPanel({
  rundown, scenes, currentSceneId, isLive, onAdd, onRemove, onUpdate, onSwitchToScene
}: RundownPanelProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSceneId, setNewSceneId] = useState(scenes[0]?.id || '');
  const [newDuration, setNewDuration] = useState(60);
  const [elapsed, setElapsed] = useState<Record<string, number>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick live segment
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const liveId = rundown.find(s => s.status === 'live')?.id;
    if (!liveId) return;
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        const next = { ...e, [liveId]: (e[liveId] || 0) + 1 };
        const seg = rundown.find(s => s.id === liveId);
        if (seg && next[liveId] > seg.plannedDuration) {
          onUpdate(liveId, { status: 'overrun' });
        }
        return next;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [rundown, onUpdate]);

  function handleAdd() {
    if (!newTitle.trim()) return;
    onAdd({ title: newTitle.trim(), sceneId: newSceneId, plannedDuration: newDuration, status: 'pending' });
    setNewTitle('');
    setAdding(false);
  }

  function goLive(seg: RundownSegment) {
    // Mark all previous as done, this one as live
    rundown.forEach(s => {
      if (s.status === 'live') onUpdate(s.id, { status: 'done' });
    });
    onUpdate(seg.id, { status: 'live' });
    setElapsed(e => ({ ...e, [seg.id]: 0 }));
    onSwitchToScene(seg.sceneId);
  }

  const totalDuration = rundown.reduce((s, seg) => s + seg.plannedDuration, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Clock size={11} /> Show Rundown
        </h3>
        <span className="font-mono-console text-[9px] text-muted-foreground">Total: {formatDur(totalDuration)}</span>
      </div>

      {/* Segments */}
      <div className="space-y-1.5">
        {rundown.length === 0 && (
          <div className="text-center py-4 font-mono-console text-[10px] text-muted-foreground/40">
            No segments — add your show structure below
          </div>
        )}
        {rundown.map((seg, idx) => {
          const Icon = STATUS_ICON[seg.status];
          const segElapsed = elapsed[seg.id] || 0;
          const progress = Math.min(100, (segElapsed / seg.plannedDuration) * 100);
          const remaining = Math.max(0, seg.plannedDuration - segElapsed);
          const scene = scenes.find(s => s.id === seg.sceneId);
          return (
            <div key={seg.id} className={cn('p-2.5 rounded-xl border transition-all', STATUS_STYLE[seg.status])}>
              <div className="flex items-center gap-2">
                <span className="font-mono-console text-[9px] text-muted-foreground/50 w-4 shrink-0">{idx + 1}</span>
                <Icon size={11} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono-console text-[11px] font-semibold truncate">{seg.title}</p>
                  <p className="font-mono-console text-[8px] text-muted-foreground/60">{scene?.name || '—'} · {formatDur(seg.plannedDuration)}</p>
                </div>
                {seg.status === 'live' && (
                  <span className="font-mono-console text-[9px] text-red-400 tabular-nums shrink-0">{formatDur(remaining)}</span>
                )}
                <button onClick={() => goLive(seg)} disabled={seg.status === 'done'}
                  className={cn('w-7 h-7 flex items-center justify-center rounded-lg border transition-colors shrink-0',
                    seg.status === 'live' ? 'border-red-500/50 bg-red-500/15 text-red-400' :
                    seg.status === 'done' ? 'border-border/30 text-muted-foreground/30 cursor-not-allowed' :
                    'border-border text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/50'
                  )} title="Go to segment">
                  <Play size={10} fill={seg.status === 'live' ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => onRemove(seg.id)} className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/30 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={9} />
                </button>
              </div>
              {seg.status === 'live' && (
                <div className="mt-1.5 w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-1000', progress > 90 ? 'bg-orange-500' : 'bg-red-500')}
                    style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add segment */}
      {adding ? (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
          <input autoFocus type="text" placeholder="Segment title..." value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary" />
          <select value={newSceneId} onChange={e => setNewSceneId(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground focus:outline-none focus:border-primary">
            {scenes.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label className="font-mono-console text-[9px] text-muted-foreground uppercase shrink-0">Duration (sec)</label>
            <input type="number" min={5} max={7200} value={newDuration} onChange={e => setNewDuration(Number(e.target.value))}
              className="flex-1 bg-input border border-border rounded px-2 py-1 font-mono-console text-xs text-foreground focus:outline-none" />
            <span className="font-mono-console text-[9px] text-muted-foreground">{formatDur(newDuration)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-1.5 rounded-lg border border-border font-mono-console text-xs text-muted-foreground">Cancel</button>
            <button onClick={handleAdd} disabled={!newTitle.trim()} className="flex-1 py-1.5 rounded-lg bg-primary text-white font-mono-console text-xs font-semibold disabled:opacity-40">Add</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 font-mono-console text-xs transition-colors">
          <Plus size={13} /> Add Segment
        </button>
      )}
    </div>
  );
}
