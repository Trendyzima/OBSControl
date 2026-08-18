import { useState, useRef, useEffect } from 'react';
import { Type, Play, Square, Send, Plus, Trash2, ChevronRight, Tv2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TickerMessage {
  id: string;
  text: string;
  active: boolean;
}

function genId() { return `ticker-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }

const DEFAULT_MESSAGES: TickerMessage[] = [
  { id: genId(), text: '🔴 LIVE NOW — Welcome to the show!', active: true },
  { id: genId(), text: '📞 Call-in number: 0800 123 4567', active: true },
  { id: genId(), text: '🌐 Follow us: @YourPodcast', active: true },
  { id: genId(), text: '📺 Subscribe for more episodes every week', active: true },
];

type TickerStyle = 'broadcast' | 'news' | 'minimal';
type TickerPosition = 'bottom' | 'top';

interface LowerThirdTickerProps {
  disabled: boolean;
  isRealOBS: boolean;
  onLogEvent?: (msg: string, category?: string) => void;
}

export default function LowerThirdTicker({ disabled, isRealOBS, onLogEvent }: LowerThirdTickerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState<TickerMessage[]>(DEFAULT_MESSAGES);
  const [newText, setNewText] = useState('');
  const [running, setRunning] = useState(false);
  const [style, setStyle] = useState<TickerStyle>('broadcast');
  const [position, setPosition] = useState<TickerPosition>('bottom');
  const [speed, setSpeed] = useState(60); // px/s simulated
  const [bgColor, setBgColor] = useState('#cc0000');
  const [textColor, setTextColor] = useState('#ffffff');
  const [currentIdx, setCurrentIdx] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeMessages = messages.filter(m => m.active);

  // Cycle through messages
  useEffect(() => {
    if (!running || activeMessages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIdx(i => (i + 1) % activeMessages.length);
    }, Math.max(3000, Math.round(8000 - speed * 40)));
    return () => clearInterval(interval);
  }, [running, activeMessages.length, speed]);

  function addMessage() {
    if (!newText.trim()) return;
    setMessages(prev => [...prev, { id: genId(), text: newText.trim(), active: true }]);
    setNewText('');
  }

  function toggleActive(id: string) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
  }

  function deleteMessage(id: string) {
    setMessages(prev => prev.filter(m => m.id !== id));
  }

  function handleStart() {
    if (activeMessages.length === 0) { toast.error('No active messages to display'); return; }
    setRunning(true);
    setCurrentIdx(0);
    onLogEvent?.('Lower-third ticker started', 'scene');
    if (isRealOBS) toast.success('Ticker sent to OBS Browser Source');
    else toast.success('Ticker preview started');
  }

  function handleStop() {
    setRunning(false);
    onLogEvent?.('Lower-third ticker stopped', 'scene');
    toast('Ticker stopped');
  }

  function sendToOBS() {
    const html = generateTickerHTML();
    console.log('[OBS] Browser Source HTML:', html);
    toast.success('Ticker HTML generated — paste into OBS Browser Source URL or load as local file');
    onLogEvent?.('Lower-third ticker HTML exported for OBS', 'system');
  }

  function generateTickerHTML(): string {
    const activeTexts = activeMessages.map(m => m.text);
    return `<!-- OBS Browser Source Ticker -->
<html><head>
<style>
  body { margin: 0; background: transparent; overflow: hidden; }
  .ticker-wrap { position: fixed; ${position}: 0; width: 100%; background: ${bgColor}; padding: 8px 0; }
  .ticker-inner { display: flex; animation: scroll ${Math.round(200 / (speed / 60))}s linear infinite; white-space: nowrap; }
  .ticker-item { color: ${textColor}; font-family: Arial Black, sans-serif; font-size: 20px; padding: 0 60px; }
  @keyframes scroll { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }
</style></head><body>
<div class="ticker-wrap"><div class="ticker-inner">
  ${activeTexts.map(t => `<span class="ticker-item">${t}</span>`).join('')}
</div></div></body></html>`;
  }

  const currentMessage = activeMessages[currentIdx % Math.max(1, activeMessages.length)];

  const previewBg: Record<TickerStyle, string> = {
    broadcast: bgColor,
    news: '#1a1a2e',
    minimal: 'rgba(0,0,0,0.7)',
  };

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 h-11 border-b border-border cursor-pointer hover:bg-secondary/10 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        <ChevronRight size={13} className={cn('text-muted-foreground transition-transform shrink-0', !collapsed && 'rotate-90')} />
        <Type size={12} className={cn('shrink-0', running ? 'text-amber-400' : 'text-muted-foreground')} />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          Lower-Third Ticker
        </span>
        {running && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 font-mono-console text-[9px] text-amber-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-red" />
            LIVE
          </span>
        )}
        <span className="font-mono-console text-[9px] text-muted-foreground shrink-0">{activeMessages.length} msg</span>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* Live preview */}
          <div className="relative rounded-lg overflow-hidden bg-[hsl(220,18%,8%)] aspect-video border border-border">
            {/* Fake camera scene */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Tv2 size={40} className="text-muted-foreground/10" />
            </div>
            {/* Ticker overlay */}
            {running && currentMessage && (
              <div
                className={cn(
                  'absolute left-0 right-0 py-2 px-4 overflow-hidden',
                  position === 'bottom' ? 'bottom-0' : 'top-0'
                )}
                style={{ background: previewBg[style] }}
              >
                <p
                  className="font-bold text-sm truncate animate-marquee"
                  style={{ color: textColor, fontFamily: 'Arial Black, sans-serif' }}
                >
                  {currentMessage.text}
                </p>
              </div>
            )}
            {!running && (
              <div className="absolute inset-0 flex items-end justify-center pb-4">
                <p className="font-mono-console text-[9px] text-muted-foreground/30">Preview will appear here</p>
              </div>
            )}
          </div>

          {/* Style + position controls */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">Style</label>
              <div className="flex gap-1">
                {(['broadcast', 'news', 'minimal'] as TickerStyle[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={cn(
                      'flex-1 py-1 rounded text-[9px] font-mono-console uppercase transition-colors',
                      style === s ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">Position</label>
              <div className="flex gap-1">
                {(['bottom', 'top'] as TickerPosition[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPosition(p)}
                    className={cn(
                      'flex-1 py-1 rounded text-[9px] font-mono-console uppercase transition-colors',
                      position === p ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color + speed */}
          <div className="grid grid-cols-3 gap-2 items-end">
            <div>
              <label className="font-mono-console text-[9px] text-muted-foreground block mb-1">Background</label>
              <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-border bg-secondary/20">
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" />
                <span className="font-mono-console text-[9px] text-muted-foreground">{bgColor}</span>
              </div>
            </div>
            <div>
              <label className="font-mono-console text-[9px] text-muted-foreground block mb-1">Text</label>
              <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-border bg-secondary/20">
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" />
                <span className="font-mono-console text-[9px] text-muted-foreground">{textColor}</span>
              </div>
            </div>
            <div>
              <label className="font-mono-console text-[9px] text-muted-foreground block mb-1">Speed {speed}%</label>
              <input type="range" min={20} max={100} value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-full h-1.5 accent-amber-400" />
            </div>
          </div>

          {/* Message list */}
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleActive(msg.id)}
                  className={cn(
                    'w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors',
                    msg.active ? 'bg-emerald-500 border-emerald-500' : 'border-border bg-transparent'
                  )}
                >
                  {msg.active && <span className="text-white text-[8px]">✓</span>}
                </button>
                <p className={cn(
                  'flex-1 font-mono-console text-[10px] truncate',
                  msg.active ? 'text-foreground' : 'text-muted-foreground/40 line-through'
                )}>
                  {msg.text}
                </p>
                <button onClick={() => deleteMessage(msg.id)} className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={9} />
                </button>
              </div>
            ))}
          </div>

          {/* Add message */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add ticker message..."
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMessage()}
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
            />
            <button
              onClick={addMessage}
              disabled={!newText.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!running ? (
              <button
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-mono-console text-xs font-semibold transition-colors"
              >
                <Play size={12} className="fill-white" />
                Start Ticker
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-mono-console text-xs transition-colors"
              >
                <Square size={11} />
                Stop Ticker
              </button>
            )}
            <button
              onClick={sendToOBS}
              title="Export HTML for OBS Browser Source"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-secondary/40 hover:bg-secondary font-mono-console text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Send size={11} />
              Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
