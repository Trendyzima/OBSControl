import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, Plus, Minus, ChevronRight, Bell, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TimerMode = 'countup' | 'countdown';

function formatTime(seconds: number): string {
  const h = Math.floor(Math.abs(seconds) / 3600);
  const m = Math.floor((Math.abs(seconds) % 3600) / 60);
  const s = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? '-' : '';
  if (h > 0) return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${sign}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface BroadcastTimerProps {
  streamDuration?: string;
  collapsed?: boolean;
}

export default function BroadcastTimer({ streamDuration }: BroadcastTimerProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [mode, setMode] = useState<TimerMode>('countdown');
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [seconds, setSeconds] = useState(0); // 0 = not started; positive = elapsed (countup), negative = remaining
  const [running, setRunning] = useState(false);
  const [warned30, setWarned30] = useState(false);
  const [warned10, setWarned10] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const remaining = mode === 'countdown' ? targetMinutes * 60 - seconds : seconds;
  const isOvertime = mode === 'countdown' && seconds > targetMinutes * 60;
  const progress = mode === 'countdown'
    ? Math.min(100, (seconds / (targetMinutes * 60)) * 100)
    : 0;

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setSeconds(0);
    setWarned30(false);
    setWarned10(false);
  }, [stop]);

  const start = useCallback(() => {
    stop();
    setRunning(true);
    timerRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
  }, [stop]);

  const pause = useCallback(() => {
    stop();
  }, [stop]);

  // Warning toasts for countdown
  useEffect(() => {
    if (mode !== 'countdown' || !running) return;
    const rem = targetMinutes * 60 - seconds;
    if (rem === 30 && !warned30) {
      setWarned30(true);
      toast.warning('⚠ 30 seconds remaining!', { duration: 4000 });
    }
    if (rem === 10 && !warned10) {
      setWarned10(true);
      toast.error('⚠ 10 seconds remaining!', { duration: 4000 });
    }
    if (rem === 0 && !isOvertime) {
      toast.error('⏰ Timer expired!', { duration: 6000 });
    }
  }, [seconds, mode, running, targetMinutes, warned30, warned10, isOvertime]);

  useEffect(() => () => stop(), [stop]);

  const displayTime = mode === 'countdown' ? remaining : seconds;

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-11 border-b border-border cursor-pointer" onClick={() => setCollapsed(v => !v)}>
        <ChevronRight size={13} className={cn('text-muted-foreground transition-transform shrink-0', !collapsed && 'rotate-90')} />
        <Timer size={12} className={cn('shrink-0', running ? 'text-amber-400' : 'text-muted-foreground')} />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          Broadcast Timer
        </span>
        {/* Quick display always visible */}
        <span className={cn(
          'font-mono-console text-sm font-semibold tabular-nums shrink-0',
          isOvertime ? 'text-red-400' : remaining <= 30 && mode === 'countdown' && running ? 'text-amber-400' : 'text-foreground'
        )}>
          {formatTime(displayTime)}
        </span>
        {running && (
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 pulse-red" />
        )}
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Big timer display */}
          <div className={cn(
            'relative flex flex-col items-center justify-center py-6 rounded-xl border overflow-hidden',
            isOvertime ? 'border-red-500/50 bg-red-500/5'
              : remaining <= 30 && mode === 'countdown' && running ? 'border-amber-500/50 bg-amber-500/5'
                : 'border-border bg-secondary/20'
          )}>
            {/* Progress arc (countdown only) */}
            {mode === 'countdown' && (
              <div className="absolute inset-0 flex items-end">
                <div
                  className={cn(
                    'w-full h-1 transition-all duration-1000',
                    isOvertime ? 'bg-red-500' : remaining <= 30 ? 'bg-amber-400' : 'bg-[hsl(var(--live-red))]'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <div className={cn(
              'font-mono-console tabular-nums font-bold leading-none',
              isOvertime ? 'text-red-400' : remaining <= 30 && mode === 'countdown' && running ? 'text-amber-400' : 'text-foreground',
              Math.abs(displayTime) >= 3600 ? 'text-4xl' : 'text-5xl'
            )}>
              {isOvertime ? '+' : ''}{formatTime(Math.abs(displayTime))}
            </div>

            {isOvertime && (
              <span className="mt-2 font-mono-console text-xs text-red-400 uppercase tracking-widest">OVERTIME</span>
            )}
            {remaining === 30 && mode === 'countdown' && running && (
              <span className="mt-2 font-mono-console text-xs text-amber-400 uppercase tracking-widest animate-pulse">30s WARNING</span>
            )}
          </div>

          {/* Mode selector */}
          <div className="flex gap-1">
            {(['countup', 'countdown'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); reset(); }}
                className={cn(
                  'flex-1 py-1.5 rounded-lg font-mono-console text-[10px] uppercase tracking-wide transition-colors',
                  mode === m ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {m === 'countup' ? '▲ Count Up' : '▼ Countdown'}
              </button>
            ))}
          </div>

          {/* Countdown target */}
          {mode === 'countdown' && !running && (
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono-console text-[10px] text-muted-foreground">Duration</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTargetMinutes(m => Math.max(1, m - 5))}
                  className="w-8 h-8 rounded-lg border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="font-mono-console text-sm font-semibold text-foreground w-16 text-center tabular-nums">
                  {targetMinutes} min
                </span>
                <button
                  onClick={() => setTargetMinutes(m => Math.min(180, m + 5))}
                  className="w-8 h-8 rounded-lg border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            {!running ? (
              <button
                onClick={start}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono-console text-xs font-semibold transition-colors active:scale-95"
              >
                <Play size={13} className="fill-white" />
                {seconds > 0 ? 'Resume' : 'Start'}
              </button>
            ) : (
              <button
                onClick={pause}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-mono-console text-xs font-semibold transition-colors active:scale-95"
              >
                <Pause size={13} />
                Pause
              </button>
            )}
            <button
              onClick={reset}
              className="w-11 h-11 flex items-center justify-center rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Show stream clock if streaming */}
          {streamDuration && streamDuration !== '00:00:00' && (
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <Clock size={10} className="text-muted-foreground/50" />
              <span className="font-mono-console text-[9px] text-muted-foreground">Stream time:</span>
              <span className="font-mono-console text-[9px] text-[hsl(var(--live-red))] tabular-nums">{streamDuration}</span>
            </div>
          )}

          {/* Warning alerts config */}
          <div className="flex items-center gap-2 text-[9px] font-mono-console text-muted-foreground/50">
            <Bell size={9} />
            Alerts at 30s and 10s remaining
          </div>
        </div>
      )}
    </div>
  );
}
