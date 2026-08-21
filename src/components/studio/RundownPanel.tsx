import { useState, useEffect } from 'react';
import { Zap, ZapOff, Play, Square, Clock, ChevronRight, RefreshCw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudioScene, RundownSegment } from '@/types/studio';
import { toast } from 'sonner';

interface RundownPanelProps {
  rundown: RundownSegment[];
  scenes: StudioScene[];
  currentSceneId: string;
  isLive: boolean;
  autoPilot: boolean;
  rundownCurrentIndex: number;
  onAdd: (seg: Omit<RundownSegment, 'id'>) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<RundownSegment>) => void;
  onSwitchToScene: (id: string) => void;
  onStartAutoPilot: () => void;
  onStopAutoPilot: () => void;
}

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

export default function RundownPanel({
  rundown, scenes, currentSceneId, isLive, autoPilot, rundownCurrentIndex,
  onAdd, onRemove, onUpdate, onSwitchToScene, onStartAutoPilot, onStopAutoPilot
}: RundownPanelProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSceneId, setNewSceneId] = useState('');
  const [newDur, setNewDur] = useState(30);
  const [elapsed, setElapsed] = useState<Record<string, number>>({});

  const liveSegment = rundown.find(s => s.status === 'live');

  // Elapsed timer for live segment
  useEffect(() => {
    if (!isLive || !liveSegment) return;
    const timer = setInterval(() => {
      setElapsed(prev => ({
        ...prev,
        [liveSegment.id]: (prev[liveSegment.id] || 0) + 1,
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive, liveSegment?.id]);

  function handleAdd() {
    if (!newTitle.trim() || !newSceneId) return;
    onAdd({ title: newTitle.trim(), sceneId: newSceneId, plannedDuration: newDur, status: 'pending' });
    setNewTitle('');
    setNewSceneId('');
    setAdding(false);
    toast.success('Segment added');
  }

  const totalDuration = rundown.reduce((s, r) => s + (r.plannedDuration || 0), 0);
  const elapsedTotal = rundown.filter(s => s.status === 'done').reduce((s, r) => s + (r.plannedDuration || 0), 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Clock size={11} /> Rundown
        </h3>
        <div className="flex items-center gap-2">
          {rundown.length > 0 && (
            <span className="font-mono-console text-[9px] text-muted-foreground">
              {formatTime(totalDuration)} total
            </span>
          )}
        </div>
      </div>

      {/* AutoPilot control */}
      <div className={cn(
        'p-3 rounded-xl border transition-all',
        autoPilot
          ? 'border-emerald-500/40 bg-emerald-500/8 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
          : 'border-border bg-secondary/10'
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {autoPilot ? (
              <Zap size={13} className="text-emerald-400" />
            ) : (
              <ZapOff size={13} className="text-muted-foreground" />
            )}
            <div>
              <p className={cn('font-mono-console text-[11px] font-bold',
                autoPilot ? 'text-emerald-400' : 'text-muted-foreground')}>
                {autoPilot ? 'AUTOPILOT RUNNING' : 'AUTOPILOT OFF'}
              </p>
              <p className="font-mono-console text-[8px] text-muted-foreground/60">
                {autoPilot
                  ? `Segment ${Math.min(rundownCurrentIndex, rundown.length)} of ${rundown.length}`
                  : 'TV runs automatically through rundown'}
              </p>
            </div>
          </div>
          <button
            onClick={autoPilot ? onStopAutoPilot : onStartAutoPilot}
            disabled={!autoPilot && rundown.length === 0}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl border font-mono-console text-[10px] font-bold transition-all active:scale-[0.97] disabled:opacity-40',
              autoPilot
                ? 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            )}
          >
            {autoPilot ? <><Square size={10} /> Stop</> : <><Play size={10} /> Start</>}
          </button>
        </div>

        {autoPilot && liveSegment && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-mono-console text-[9px] text-emerald-400 flex-1 truncate">{liveSegment.title}</span>
            <span className="font-mono-console text-[9px] text-emerald-400 tabular-nums">
              {formatTime(elapsed[liveSegment.id] || 0)} / {formatTime(liveSegment.plannedDuration)}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {rundown.length > 0 && (
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: totalDuration > 0 ? `${(elapsedTotal / totalDuration) * 100}%` : '0%' }}
            />
          </div>
          <div className="flex justify-between font-mono-console text-[8px] text-muted-foreground/50">
            <span>{formatTime(elapsedTotal)} elapsed</span>
            <span>{formatTime(totalDuration - elapsedTotal)} remaining</span>
          </div>
        </div>
      )}

      {/* Segments */}
      {rundown.length === 0 ? (
        <div className="text-center py-6 space-y-1">
          <Clock size={24} className="mx-auto text-muted-foreground/20" />
          <p className="font-mono-console text-[10px] text-muted-foreground/40">No segments yet</p>
          <p className="font-mono-console text-[9px] text-muted-foreground/30">Add segments to build your show</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto no-scrollbar">
          {rundown.map((seg, idx) => {
            const scene = scenes.find(s => s.id === seg.sceneId);
            const isActive = seg.status === 'live';
            const isDone = seg.status === 'done';
            const isNext = autoPilot && idx === rundownCurrentIndex && seg.status === 'pending';
            const segElapsed = elapsed[seg.id] || 0;
            const isOverrun = isActive && segElapsed > seg.plannedDuration;

            return (
              <div
                key={seg.id}
                className={cn(
                  'relative flex items-start gap-2.5 p-2.5 rounded-xl border transition-all',
                  isActive
                    ? 'border-emerald-500/50 bg-emerald-500/8 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                    : isOverrun
                    ? 'border-red-500/50 bg-red-500/8'
                    : isNext
                    ? 'border-blue-500/40 bg-blue-500/5'
                    : isDone
                    ? 'border-border/30 bg-secondary/5 opacity-60'
                    : 'border-border bg-secondary/10'
                )}
              >
                {/* Index */}
                <div className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-mono-console text-[9px] font-bold',
                  isActive ? 'bg-emerald-500/20 text-emerald-400' : isDone ? 'bg-secondary/20 text-muted-foreground/40' : 'bg-secondary/30 text-muted-foreground'
                )}>
                  {isDone ? '✓' : idx + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
                    {isNext && <ChevronRight size={10} className="text-blue-400 shrink-0" />}
                    <p className={cn('font-mono-console text-[10px] font-semibold truncate',
                      isActive ? 'text-emerald-400' : isDone ? 'text-muted-foreground/40' : 'text-foreground')}>
                      {seg.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    {scene && (
                      <span className="font-mono-console text-[8px] text-muted-foreground/50">
                        {scene.icon} {scene.name}
                      </span>
                    )}
                    <span className={cn('font-mono-console text-[8px] font-mono tabular-nums',
                      isOverrun ? 'text-red-400 font-bold' : 'text-muted-foreground/50')}>
                      {isActive
                        ? `${formatTime(segElapsed)} / ${formatTime(seg.plannedDuration)}${isOverrun ? ' OVERRUN' : ''}`
                        : formatTime(seg.plannedDuration)
                      }
                    </span>
                  </div>

                  {seg.notes && (
                    <p className="font-mono-console text-[8px] text-muted-foreground/40 mt-0.5 truncate">{seg.notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onSwitchToScene(seg.sceneId)} title="Switch to scene"
                    className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-emerald-400 transition-colors">
                    <Play size={9} />
                  </button>
                  <button onClick={() => onRemove(seg.id)}
                    className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground/40 hover:text-red-400 transition-colors">
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add segment */}
      {adding ? (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
          <p className="font-mono-console text-[10px] text-muted-foreground uppercase tracking-wider">Add Segment</p>
          <input autoFocus type="text" placeholder="Segment title..." value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary" />
          <select value={newSceneId} onChange={e => setNewSceneId(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground focus:outline-none">
            <option value="">— Select scene —</option>
            {scenes.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
          <div>
            <label className="font-mono-console text-[8px] text-muted-foreground uppercase block mb-1">
              Duration: {formatTime(newDur)}
            </label>
            <input type="range" min={10} max={3600} step={10} value={newDur}
              onChange={e => setNewDur(Number(e.target.value))}
              className="w-full accent-primary h-1" />
            <div className="flex justify-between mt-0.5">
              <span className="font-mono-console text-[7px] text-muted-foreground/40">10s</span>
              <span className="font-mono-console text-[7px] text-muted-foreground/40">1hr</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-1.5 rounded-lg border border-border font-mono-console text-xs text-muted-foreground">Cancel</button>
            <button onClick={handleAdd} disabled={!newTitle.trim() || !newSceneId} className="flex-1 py-1.5 rounded-lg bg-primary text-white font-mono-console text-xs font-semibold disabled:opacity-40">Add</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 font-mono-console text-xs transition-colors">
          + Add Segment
        </button>
      )}

      {rundown.length > 0 && (
        <div className="flex items-start gap-1.5 px-2">
          <Info size={9} className="text-muted-foreground/30 mt-0.5 shrink-0" />
          <p className="font-mono-console text-[8px] text-muted-foreground/30 leading-relaxed">
            AutoPilot advances through segments automatically. Each scene plays for its planned duration.
          </p>
        </div>
      )}
    </div>
  );
}
