import { useState } from 'react';
import { AlignLeft, Eye, EyeOff, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TickerEditorProps {
  ticker: string;
  tickerVisible: boolean;
  onShow: (text: string) => void;
  onHide: () => void;
}

const PRESETS = [
  'BREAKING NEWS: Live broadcast in progress',
  'LIVE NOW — Watch the full show',
  'Follow us on social media for updates',
  'Subscribe for more content',
  'Like & share this broadcast',
];

export default function TickerEditor({ ticker, tickerVisible, onShow, onHide }: TickerEditorProps) {
  const [text, setText] = useState(ticker || PRESETS[0]);

  return (
    <div className="space-y-2">
      <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground">News Ticker</h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Ticker text..."
          className="flex-1 bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
        />
        <button
          onClick={() => tickerVisible ? onHide() : onShow(text)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg border font-mono-console text-xs transition-colors shrink-0',
            tickerVisible
              ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
          )}
        >
          {tickerVisible ? <EyeOff size={12} /> : <Eye size={12} />}
          {tickerVisible ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* Presets */}
      <div className="space-y-1">
        <p className="font-mono-console text-[8px] text-muted-foreground/50 uppercase tracking-wider">Presets</p>
        <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => { setText(p); if (tickerVisible) onShow(p); }}
              className="text-left px-2.5 py-1.5 rounded-lg border border-border/50 bg-secondary/10 hover:bg-secondary/30 font-mono-console text-[10px] text-muted-foreground hover:text-foreground transition-colors truncate"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {tickerVisible && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="font-mono-console text-[10px] text-red-400 flex-1 truncate">Live: {ticker}</span>
        </div>
      )}
    </div>
  );
}
