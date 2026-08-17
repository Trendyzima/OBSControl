import { useState, useEffect, useRef, useCallback } from 'react';
import { SequencerStep, SequencerState } from '@/types/obs';
import { Play, Pause, Square, Plus, Trash2, GripVertical, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SceneSequencerProps {
  scenes: string[];
  onSwitchScene: (name: string) => void;
  onLogEvent?: (msg: string, category?: string) => void;
  disabled: boolean;
}

function genId() {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatSecs(s: number) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem ? `${m}m ${rem}s` : `${m}m`;
}

const DEFAULT_STEPS: SequencerStep[] = [
  { id: genId(), sceneName: 'INTRO', durationSeconds: 10, label: 'Open' },
  { id: genId(), sceneName: 'LIVE CAMERA', durationSeconds: 1800, label: 'Main segment' },
  { id: genId(), sceneName: 'ADVERTISEMENT', durationSeconds: 30, label: 'Ad break' },
  { id: genId(), sceneName: 'LIVE CAMERA', durationSeconds: 900, label: 'Segment 2' },
  { id: genId(), sceneName: 'OUTRO', durationSeconds: 10, label: 'Close' },
];

export default function SceneSequencer({ scenes, onSwitchScene, onLogEvent, disabled }: SceneSequencerProps) {
  const [steps, setSteps] = useState<SequencerStep[]>(DEFAULT_STEPS);
  const [state, setState] = useState<SequencerState>('idle');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0); // seconds elapsed in current step
  const [collapsed, setCollapsed] = useState(true);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalDuration = steps.reduce((s, step) => s + step.durationSeconds, 0);

  const log = useCallback((msg: string) => {
    onLogEvent?.(msg, 'sequencer');
  }, [onLogEvent]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const advanceStep = useCallback((idx: number, stepsSnap: SequencerStep[]) => {
    if (idx >= stepsSnap.length) {
      setState('idle');
      setCurrentIdx(0);
      setElapsed(0);
      toast.success('Sequencer: completed all steps');
      log('Sequence completed');
      return;
    }
    setCurrentIdx(idx);
    setElapsed(0);
    onSwitchScene(stepsSnap[idx].sceneName);
    log(`Step ${idx + 1}/${stepsSnap.length}: ${stepsSnap[idx].sceneName} (${formatSecs(stepsSnap[idx].durationSeconds)})`);
  }, [onSwitchScene, log]);

  const start = useCallback(() => {
    if (steps.length === 0) return;
    if (disabled) { toast.error('Connect to OBS first'); return; }
    stopTimer();
    setState('running');
    setElapsed(0);
    setCurrentIdx(0);
    advanceStep(0, steps);

    let localIdx = 0;
    let localElapsed = 0;
    const snap = [...steps];

    timerRef.current = setInterval(() => {
      localElapsed += 1;
      setElapsed(localElapsed);
      if (localElapsed >= snap[localIdx].durationSeconds) {
        localIdx += 1;
        localElapsed = 0;
        if (localIdx >= snap.length) {
          stopTimer();
          setState('idle');
          setCurrentIdx(0);
          setElapsed(0);
          toast.success('Sequencer: sequence complete');
          return;
        }
        setCurrentIdx(localIdx);
        setElapsed(0);
        onSwitchScene(snap[localIdx].sceneName);
        log(`Step ${localIdx + 1}/${snap.length}: ${snap[localIdx].sceneName}`);
      }
    }, 1000);
  }, [steps, disabled, stopTimer, advanceStep, onSwitchScene, log]);

  const pause = useCallback(() => {
    stopTimer();
    setState('paused');
    log('Sequencer paused');
  }, [stopTimer, log]);

  const resume = useCallback(() => {
    if (state !== 'paused') return;
    setState('running');
    log('Sequencer resumed');
    const snap = [...steps];
    let localIdx = currentIdx;
    let localElapsed = elapsed;

    timerRef.current = setInterval(() => {
      localElapsed += 1;
      setElapsed(localElapsed);
      if (localElapsed >= snap[localIdx].durationSeconds) {
        localIdx += 1;
        localElapsed = 0;
        if (localIdx >= snap.length) {
          stopTimer();
          setState('idle');
          setCurrentIdx(0);
          setElapsed(0);
          return;
        }
        setCurrentIdx(localIdx);
        setElapsed(0);
        onSwitchScene(snap[localIdx].sceneName);
        log(`Step ${localIdx + 1}/${snap.length}: ${snap[localIdx].sceneName}`);
      }
    }, 1000);
  }, [state, steps, currentIdx, elapsed, stopTimer, onSwitchScene, log]);

  const stop = useCallback(() => {
    stopTimer();
    setState('idle');
    setCurrentIdx(0);
    setElapsed(0);
    log('Sequencer stopped');
  }, [stopTimer, log]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  function addStep() {
    const s: SequencerStep = { id: genId(), sceneName: scenes[0] || 'LIVE CAMERA', durationSeconds: 30 };
    setSteps(prev => [...prev, s]);
  }

  function updateStep(id: string, patch: Partial<SequencerStep>) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  function deleteStep(id: string) {
    setSteps(prev => prev.filter(s => s.id !== id));
  }

  // Drag-reorder
  function handleDragStart(idx: number) { setDragIdx(idx); }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOver(idx); }
  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOver(null); return; }
    const next = [...steps];
    const [item] = next.splice(dragIdx, 1);
    next.splice(idx, 0, item);
    setSteps(next);
    setDragIdx(null);
    setDragOver(null);
  }

  const currentStep = steps[currentIdx];
  const progress = currentStep ? (elapsed / currentStep.durationSeconds) * 100 : 0;

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-10 border-b border-border">
        <ChevronRight
          size={13}
          className={cn('text-muted-foreground transition-transform cursor-pointer', !collapsed && 'rotate-90')}
          onClick={() => setCollapsed(v => !v)}
        />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1 cursor-pointer" onClick={() => setCollapsed(v => !v)}>
          Scene Sequencer
        </span>
        {state !== 'idle' && currentStep && (
          <span className="font-mono-console text-[10px] text-amber-400 shrink-0">
            {currentIdx + 1}/{steps.length} · {currentStep.sceneName} · {elapsed}s/{currentStep.durationSeconds}s
          </span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {state === 'idle' && (
            <button onClick={start} disabled={disabled || steps.length === 0} title="Start sequence"
              className="w-7 h-7 rounded flex items-center justify-center bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 transition-colors disabled:opacity-40">
              <Play size={11} className="fill-emerald-400" />
            </button>
          )}
          {state === 'running' && (
            <button onClick={pause} title="Pause"
              className="w-7 h-7 rounded flex items-center justify-center bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 transition-colors">
              <Pause size={11} />
            </button>
          )}
          {state === 'paused' && (
            <button onClick={resume} title="Resume"
              className="w-7 h-7 rounded flex items-center justify-center bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 transition-colors">
              <Play size={11} className="fill-emerald-400" />
            </button>
          )}
          {state !== 'idle' && (
            <button onClick={stop} title="Stop"
              className="w-7 h-7 rounded flex items-center justify-center bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors">
              <Square size={10} className="fill-red-400" />
            </button>
          )}
          {state === 'idle' && (
            <button onClick={() => { setSteps(DEFAULT_STEPS); setCurrentIdx(0); setElapsed(0); }} title="Reset to defaults"
              className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar (visible when running/paused) */}
      {state !== 'idle' && (
        <div className="h-1 bg-secondary w-full">
          <div
            className="h-full bg-amber-400 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {!collapsed && (
        <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
          {/* Steps */}
          {steps.map((step, idx) => (
            <div
              key={step.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragIdx(null); setDragOver(null); }}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg border transition-all',
                state !== 'idle' && idx === currentIdx
                  ? 'border-amber-400/60 bg-amber-400/10'
                  : state !== 'idle' && idx < currentIdx
                    ? 'border-border bg-secondary/10 opacity-40'
                    : 'border-border bg-secondary/20',
                dragOver === idx && dragIdx !== idx && 'border-primary/60'
              )}
            >
              <GripVertical size={12} className="text-muted-foreground/40 shrink-0 cursor-grab active:cursor-grabbing" />
              <span className="font-mono-console text-[9px] text-muted-foreground/50 w-4 shrink-0">{idx + 1}</span>

              <select
                value={step.sceneName}
                onChange={e => updateStep(step.id, { sceneName: e.target.value })}
                disabled={state !== 'idle'}
                className="flex-1 min-w-0 bg-transparent border border-border rounded px-1.5 py-0.5 font-mono-console text-[10px] text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
              >
                {scenes.map(s => (
                  <option key={s} value={s} className="bg-[hsl(220,18%,11%)]">{s}</option>
                ))}
              </select>

              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  value={step.durationSeconds}
                  min={1}
                  max={7200}
                  onChange={e => updateStep(step.id, { durationSeconds: Math.max(1, Number(e.target.value)) })}
                  disabled={state !== 'idle'}
                  className="w-14 bg-transparent border border-border rounded px-1.5 py-0.5 font-mono-console text-[10px] text-foreground text-right focus:outline-none focus:border-primary disabled:opacity-50"
                />
                <span className="font-mono-console text-[9px] text-muted-foreground">s</span>
              </div>

              <input
                type="text"
                value={step.label || ''}
                placeholder="Label"
                onChange={e => updateStep(step.id, { label: e.target.value })}
                disabled={state !== 'idle'}
                className="w-20 bg-transparent border border-border rounded px-1.5 py-0.5 font-mono-console text-[10px] text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary disabled:opacity-50"
              />

              <button
                onClick={() => deleteStep(step.id)}
                disabled={state !== 'idle'}
                className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/40 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-30"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}

          {/* Add step + total */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={addStep}
              disabled={state !== 'idle'}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono-console text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
            >
              <Plus size={10} />
              Add Step
            </button>
            <span className="font-mono-console text-[9px] text-muted-foreground/50">
              Total: {formatSecs(totalDuration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
