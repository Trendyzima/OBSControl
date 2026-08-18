import { useState, useEffect, useRef, useCallback } from 'react';
import { Scissors, Play, Square, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SplitSegment {
  index: number;
  startedAt: string;
  durationSeconds: number;
  status: 'recording' | 'saved';
  sizeLabel: string;
}

interface RecordingAutoSplitterProps {
  isRecording: boolean;
  disabled: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onLogEvent?: (msg: string, category?: string) => void;
}

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const SEGMENT_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
  { label: '2 hr', value: 120 },
];

export default function RecordingAutoSplitter({
  isRecording,
  disabled,
  onStartRecord,
  onStopRecord,
  onLogEvent,
}: RecordingAutoSplitterProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [maxMinutes, setMaxMinutes] = useState(30);
  const [running, setRunning] = useState(false);
  const [segmentSeconds, setSegmentSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [segments, setSegments] = useState<SplitSegment[]>([]);
  const [splitCount, setSplitCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const splitRef = useRef(0);

  const maxSeconds = maxMinutes * 60;
  const remaining = maxSeconds - segmentSeconds;
  const pct = (segmentSeconds / maxSeconds) * 100;
  const warnMode = remaining <= 30 && running;

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const doSplit = useCallback(() => {
    splitRef.current += 1;
    const segIdx = splitRef.current;
    const dur = segmentSeconds;

    // Mark previous segment as saved
    setSegments(prev => prev.map(s =>
      s.status === 'recording' ? { ...s, status: 'saved', durationSeconds: dur } : s
    ));

    // Stop + restart recording
    onStopRecord();
    setTimeout(() => {
      onStartRecord();
      const newSeg: SplitSegment = {
        index: segIdx + 1,
        startedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        durationSeconds: 0,
        status: 'recording',
        sizeLabel: '—',
      };
      setSegments(prev => [...prev, newSeg]);
      setSegmentSeconds(0);
      setSplitCount(s => s + 1);
      onLogEvent?.(`Auto-split: segment ${segIdx + 1} started`, 'record');
      toast(`Recording split → Segment ${segIdx + 1}`);
    }, 800);
  }, [segmentSeconds, onStopRecord, onStartRecord, onLogEvent]);

  // Timer tick
  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setSegmentSeconds(s => {
        const next = s + 1;
        setTotalSeconds(t => t + 1);
        return next;
      });
    }, 1000);
    return stopTimer;
  }, [running, stopTimer]);

  // Auto-split trigger
  useEffect(() => {
    if (!running || !enabled) return;
    if (segmentSeconds >= maxSeconds) {
      doSplit();
    }
  }, [segmentSeconds, maxSeconds, running, enabled, doSplit]);

  function handleStart() {
    if (disabled) return;
    splitRef.current = 0;
    setSegmentSeconds(0);
    setTotalSeconds(0);
    setSegments([{
      index: 1,
      startedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      durationSeconds: 0,
      status: 'recording',
      sizeLabel: '—',
    }]);
    setSplitCount(0);
    setRunning(true);
    onStartRecord();
    onLogEvent?.('Auto-splitter recording started', 'record');
    toast.success('Auto-split recording started');
  }

  function handleStop() {
    setRunning(false);
    stopTimer();
    setSegments(prev => prev.map(s =>
      s.status === 'recording' ? { ...s, status: 'saved', durationSeconds: segmentSeconds } : s
    ));
    onStopRecord();
    onLogEvent?.(`Auto-splitter stopped — ${splitCount} split${splitCount !== 1 ? 's' : ''}, total ${formatTime(totalSeconds)}`, 'record');
    toast.success(`Recording stopped — ${splitCount + 1} segment${splitCount + 1 !== 1 ? 's' : ''}`);
    setTimeout(() => {
      setRunning(false);
      setSegmentSeconds(0);
      setTotalSeconds(0);
    }, 500);
  }

  function manualSplit() {
    if (!running) return;
    doSplit();
  }

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 h-11 border-b border-border cursor-pointer hover:bg-secondary/10 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        <ChevronRight size={13} className={cn('text-muted-foreground transition-transform shrink-0', !collapsed && 'rotate-90')} />
        <Scissors size={12} className={cn('shrink-0', running ? 'text-amber-400' : 'text-muted-foreground')} />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          Recording Auto-Splitter
        </span>
        {running && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 font-mono-console text-[9px] text-amber-400 shrink-0">
            <span className={cn('w-1.5 h-1.5 rounded-full bg-amber-400', warnMode ? 'pulse-red' : '')} />
            SEG {String(segments.length).padStart(2, '0')}
          </span>
        )}
        {running && (
          <span className="font-mono-console text-[10px] tabular-nums text-muted-foreground shrink-0">{formatTime(totalSeconds)}</span>
        )}
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* Config row */}
          <div className="flex items-center gap-3">
            {/* Enable toggle */}
            <button
              onClick={() => setEnabled(v => !v)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono-console text-[10px] transition-colors shrink-0',
                enabled
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <Scissors size={10} />
              Auto-Split: {enabled ? 'ON' : 'OFF'}
            </button>

            {/* Segment length */}
            <div className="flex-1">
              <div className="flex gap-1 flex-wrap">
                {SEGMENT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMaxMinutes(opt.value)}
                    disabled={running}
                    className={cn(
                      'px-2 py-1 rounded font-mono-console text-[9px] transition-colors',
                      maxMinutes === opt.value
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40 disabled:opacity-40'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {running && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono-console text-[9px] text-muted-foreground">
                  Segment {segments.length} — {formatTime(segmentSeconds)} / {formatTime(maxSeconds)}
                </span>
                <span className={cn('font-mono-console text-[9px] tabular-nums', warnMode ? 'text-amber-400' : 'text-muted-foreground')}>
                  {warnMode && <AlertTriangle size={9} className="inline mr-1" />}
                  {formatTime(remaining)} remaining
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-1000',
                    warnMode ? 'bg-amber-400' : 'bg-emerald-400'
                  )}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            {!running ? (
              <button
                onClick={handleStart}
                disabled={disabled}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-mono-console text-xs font-semibold transition-colors disabled:opacity-40"
              >
                <Play size={12} className="fill-white" />
                Start Recording
              </button>
            ) : (
              <>
                <button
                  onClick={manualSplit}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 font-mono-console text-xs transition-colors hover:bg-amber-500/20"
                >
                  <Scissors size={11} />
                  Split Now
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-mono-console text-xs transition-colors"
                >
                  <Square size={11} />
                  Stop Recording
                </button>
              </>
            )}
          </div>

          {/* Segment list */}
          {segments.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              <p className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider">Segments</p>
              {segments.map(seg => (
                <div key={seg.index} className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border',
                  seg.status === 'recording'
                    ? 'border-amber-500/30 bg-amber-500/8'
                    : 'border-border/40 bg-secondary/10'
                )}>
                  <Clock size={10} className={seg.status === 'recording' ? 'text-amber-400' : 'text-muted-foreground/40'} />
                  <span className="font-mono-console text-[10px] text-foreground">Segment {seg.index}</span>
                  <span className="font-mono-console text-[9px] text-muted-foreground/50 flex-1">{seg.startedAt}</span>
                  {seg.status === 'recording' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-red shrink-0" />
                  )}
                  {seg.status === 'saved' && (
                    <span className="font-mono-console text-[9px] text-muted-foreground/60 tabular-nums">{formatTime(seg.durationSeconds)}</span>
                  )}
                  <span className={cn('font-mono-console text-[8px] px-1.5 py-0.5 rounded',
                    seg.status === 'recording'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-secondary text-muted-foreground/60'
                  )}>
                    {seg.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="font-mono-console text-[8px] text-muted-foreground/30 text-center">
            {enabled
              ? `Auto-splits every ${maxMinutes} min — files numbered sequentially`
              : 'Enable auto-split to automatically divide long recordings'}
          </p>
        </div>
      )}
    </div>
  );
}
