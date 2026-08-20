import { useState } from 'react';
import { Plus, Trash2, Wifi, Radio, Activity, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface StreamDestination {
  id: string;
  label: string;
  platform: 'youtube' | 'facebook' | 'twitch' | 'rtmp' | 'whip' | 'radio';
  url: string;
  streamKey: string;
  enabled: boolean;
  status: 'idle' | 'connecting' | 'live' | 'error';
  bitrate?: number;
}

interface StreamDestinationManagerProps {
  destinations: StreamDestination[];
  isActive: boolean;
  onAdd: (dest: Omit<StreamDestination, 'id' | 'status'>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onUpdateKey: (id: string, key: string) => void;
}

const PLATFORM_PRESETS = [
  { platform: 'youtube' as const, label: 'YouTube Live', color: 'text-red-400', hint: 'https://a.youtube.com/api/broadcast/v1/live_streams/YOUR_KEY/whip' },
  { platform: 'facebook' as const, label: 'Facebook Live', color: 'text-blue-400', hint: 'rtmps://live-api-s.facebook.com:443/rtmp/' },
  { platform: 'twitch' as const, label: 'Twitch', color: 'text-purple-400', hint: 'rtmp://live.twitch.tv/app/' },
  { platform: 'rtmp' as const, label: 'Custom RTMP', color: 'text-amber-400', hint: 'rtmp://your-server/live' },
  { platform: 'whip' as const, label: 'WHIP Relay', color: 'text-cyan-400', hint: 'https://your-whip-server/whip' },
  { platform: 'radio' as const, label: 'Radio / Icecast', color: 'text-emerald-400', hint: 'http://your-icecast:8000/stream' },
];

const STATUS_COLORS = {
  idle: 'text-muted-foreground',
  connecting: 'text-amber-400',
  live: 'text-emerald-400',
  error: 'text-red-400',
};

const STATUS_DOTS = {
  idle: 'bg-muted-foreground/30',
  connecting: 'bg-amber-400 animate-pulse',
  live: 'bg-emerald-400 animate-pulse',
  error: 'bg-red-500',
};

export default function StreamDestinationManager({
  destinations, isActive, onAdd, onRemove, onToggle, onUpdateKey
}: StreamDestinationManagerProps) {
  const [adding, setAdding] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(PLATFORM_PRESETS[0]);
  const [url, setUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [label, setLabel] = useState('');

  function handleAdd() {
    if (!url.trim()) { toast.error('Enter stream URL'); return; }
    onAdd({
      label: label || selectedPreset.label,
      platform: selectedPreset.platform,
      url: url.trim(),
      streamKey: streamKey.trim(),
      enabled: true,
      bitrate: 4000,
    });
    setUrl(''); setStreamKey(''); setLabel('');
    setAdding(false);
    toast.success('Destination added');
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Radio size={11} /> Stream Destinations
        </h3>
        <span className="font-mono-console text-[9px] text-muted-foreground">
          {destinations.filter(d => d.enabled && d.status === 'live').length} live
        </span>
      </div>

      {/* Destinations list */}
      {destinations.length === 0 && !adding ? (
        <div className="text-center py-5 font-mono-console text-[10px] text-muted-foreground/40">
          No destinations — stream to multiple platforms simultaneously
        </div>
      ) : (
        <div className="space-y-2">
          {destinations.map(dest => {
            const preset = PLATFORM_PRESETS.find(p => p.platform === dest.platform) || PLATFORM_PRESETS[3];
            return (
              <div key={dest.id} className={cn(
                'p-2.5 rounded-xl border transition-all',
                dest.status === 'live' ? 'border-emerald-500/40 bg-emerald-500/5' :
                dest.status === 'error' ? 'border-red-500/30 bg-red-500/5' :
                'border-border bg-secondary/10'
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', STATUS_DOTS[dest.status])} />
                  <span className={cn('font-mono-console text-[10px] font-semibold flex-1', preset.color)}>
                    {dest.label}
                  </span>
                  <span className={cn('font-mono-console text-[8px] uppercase', STATUS_COLORS[dest.status])}>
                    {dest.status}
                  </span>
                  <button onClick={() => onToggle(dest.id)} className="shrink-0">
                    {dest.enabled
                      ? <ToggleRight size={18} className="text-primary" />
                      : <ToggleLeft size={18} className="text-muted-foreground/40" />
                    }
                  </button>
                  <button onClick={() => onRemove(dest.id)} className="w-6 h-6 flex items-center justify-center text-muted-foreground/30 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 size={10} />
                  </button>
                </div>
                <div className="mt-1.5 ml-4">
                  <p className="font-mono-console text-[8px] text-muted-foreground/50 truncate">{dest.url}</p>
                  {dest.bitrate && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Activity size={8} className="text-muted-foreground/40" />
                      <span className="font-mono-console text-[8px] text-muted-foreground/40">{dest.bitrate}kbps</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add form */}
      {adding ? (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2.5">
          {/* Platform selector */}
          <div className="grid grid-cols-3 gap-1.5">
            {PLATFORM_PRESETS.map(p => (
              <button key={p.platform} onClick={() => { setSelectedPreset(p); setUrl(p.hint); }}
                className={cn('py-2 rounded-xl border font-mono-console text-[9px] transition-colors',
                  selectedPreset.platform === p.platform ? `border-current bg-current/10 ${p.color}` : 'border-border text-muted-foreground hover:text-foreground')}>
                {p.label}
              </button>
            ))}
          </div>

          <input type="text" placeholder="Label (optional)..." value={label} onChange={e => setLabel(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />

          <input type="url" placeholder={selectedPreset.hint} value={url} onChange={e => setUrl(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />

          <input type="password" placeholder="Stream key (optional)..." value={streamKey} onChange={e => setStreamKey(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />

          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-1.5 rounded-lg border border-border font-mono-console text-xs text-muted-foreground">Cancel</button>
            <button onClick={handleAdd} disabled={!url.trim()}
              className="flex-1 py-1.5 rounded-lg bg-primary text-white font-mono-console text-xs font-semibold disabled:opacity-40">
              Add Destination
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 font-mono-console text-xs transition-colors">
          <Plus size={13} /> Add Stream Destination
        </button>
      )}

      {destinations.length > 0 && (
        <div className="p-2.5 rounded-xl border border-border/30 bg-secondary/5">
          <p className="font-mono-console text-[8px] text-muted-foreground/50 leading-relaxed">
            WHIP destinations stream directly from the browser. RTMP requires a relay server (e.g. nginx-rtmp, Node-Media-Server). Enable/disable destinations independently.
          </p>
        </div>
      )}
    </div>
  );
}
