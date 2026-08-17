import { useRef, useEffect, useState } from 'react';
import { OBSEventEntry } from '@/types/obs';
import { Terminal, ChevronDown, ChevronUp, Trash2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventLogProps {
  events: OBSEventEntry[];
  onClear: () => void;
}

const SEV_COLORS: Record<string, string> = {
  info:    'text-muted-foreground',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error:   'text-red-400',
};

const CAT_BADGE: Record<string, string> = {
  scene:      'bg-blue-500/20 text-blue-400',
  stream:     'bg-red-500/20 text-[hsl(var(--live-red))]',
  record:     'bg-amber-500/20 text-amber-400',
  audio:      'bg-purple-500/20 text-purple-400',
  media:      'bg-cyan-500/20 text-cyan-400',
  connection: 'bg-emerald-500/20 text-emerald-400',
  sequencer:  'bg-orange-500/20 text-orange-400',
  system:     'bg-muted/50 text-muted-foreground',
};

export default function EventLog({ events, onClear }: EventLogProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll on new events
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  const filtered = filter === 'all' ? events : events.filter(e => e.category === filter);

  function handleExport() {
    const lines = events.map(e =>
      `[${e.timestamp}] [${e.severity.toUpperCase()}] [${e.category}] ${e.message}${e.detail ? ' — ' + e.detail : ''}`
    ).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `obs-log-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const cats = ['all', 'scene', 'stream', 'record', 'audio', 'media', 'connection', 'sequencer', 'system'];

  return (
    <div className={cn(
      'flex flex-col border border-border rounded-xl bg-[hsl(var(--card))] transition-all',
      collapsed ? 'h-10' : 'h-64'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-10 border-b border-border shrink-0">
        <Terminal size={12} className="text-muted-foreground shrink-0" />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          Event Log
        </span>
        {events.length > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-secondary font-mono-console text-[9px] text-muted-foreground">
            {events.length}
          </span>
        )}
        <button onClick={handleExport} title="Export log" className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Download size={11} />
        </button>
        <button onClick={onClear} title="Clear log" className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors">
          <Trash2 size={11} />
        </button>
        <button onClick={() => setCollapsed(v => !v)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Category filter */}
          <div className="flex gap-1 px-3 py-1.5 border-b border-border overflow-x-auto shrink-0">
            {cats.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  'px-2 py-0.5 rounded text-[9px] font-mono-console uppercase tracking-wide whitespace-nowrap transition-colors',
                  filter === c ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Log lines */}
          <div
            ref={listRef}
            onScroll={() => {
              if (!listRef.current) return;
              const { scrollTop, scrollHeight, clientHeight } = listRef.current;
              setAutoScroll(scrollHeight - scrollTop - clientHeight < 40);
            }}
            className="flex-1 overflow-y-auto px-3 py-1.5 space-y-0.5"
          >
            {filtered.length === 0 && (
              <p className="font-mono-console text-[10px] text-muted-foreground/40 pt-4 text-center">
                No events yet
              </p>
            )}
            {filtered.map(ev => (
              <div key={ev.id} className="flex items-start gap-2 group py-0.5">
                <span className="font-mono-console text-[9px] text-muted-foreground/50 shrink-0 mt-px w-16 tabular-nums">{ev.timestamp}</span>
                <span className={cn('px-1 py-px rounded text-[8px] font-mono-console uppercase shrink-0 mt-px', CAT_BADGE[ev.category] || '')}>
                  {ev.category}
                </span>
                <span className={cn('font-mono-console text-[10px] leading-relaxed', SEV_COLORS[ev.severity])}>
                  {ev.message}
                  {ev.detail && <span className="text-muted-foreground/60"> — {ev.detail}</span>}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </>
      )}
    </div>
  );
}
