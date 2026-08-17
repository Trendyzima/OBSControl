import { useState } from 'react';
import { StreamDestination, StreamDestinationPlatform } from '@/types/obs';
import { Youtube, Facebook, Twitch, Radio, Plus, Trash2, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PLATFORM_META: Record<StreamDestinationPlatform, { label: string; color: string; icon: React.ElementType; defaultUrl: string }> = {
  youtube:  { label: 'YouTube',  color: 'text-red-500',    icon: Youtube,  defaultUrl: 'rtmp://a.rtmp.youtube.com/live2' },
  facebook: { label: 'Facebook', color: 'text-blue-500',   icon: Facebook, defaultUrl: 'rtmps://live-api-s.facebook.com:443/rtmp' },
  twitch:   { label: 'Twitch',   color: 'text-purple-400', icon: Twitch,   defaultUrl: 'rtmp://live.twitch.tv/app' },
  rtmp:     { label: 'Custom RTMP', color: 'text-muted-foreground', icon: Radio, defaultUrl: '' },
};

function genId() { return `dest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

const DEFAULT_DESTINATIONS: StreamDestination[] = [
  { id: genId(), platform: 'youtube',  label: 'YouTube Live',  enabled: true,  status: 'idle' },
  { id: genId(), platform: 'facebook', label: 'Facebook Live', enabled: false, status: 'idle' },
  { id: genId(), platform: 'twitch',   label: 'Twitch',        enabled: false, status: 'idle' },
];

interface StreamDestinationsProps {
  isStreaming: boolean;
  onLogEvent?: (msg: string, category?: string) => void;
}

export default function StreamDestinations({ isStreaming, onLogEvent }: StreamDestinationsProps) {
  const [destinations, setDestinations] = useState<StreamDestination[]>(DEFAULT_DESTINATIONS);
  const [collapsed, setCollapsed] = useState(true);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlatform, setNewPlatform] = useState<StreamDestinationPlatform>('rtmp');
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newKey, setNewKey] = useState('');

  function toggle(id: string) {
    setDestinations(prev => prev.map(d => {
      if (d.id !== id) return d;
      const next = !d.enabled;
      onLogEvent?.(`${d.label} ${next ? 'enabled' : 'disabled'}`, 'stream');
      return { ...d, enabled: next };
    }));
  }

  function updateKey(id: string, key: string) {
    setDestinations(prev => prev.map(d => d.id === id ? { ...d, streamKey: key } : d));
  }

  function remove(id: string) {
    const d = destinations.find(d => d.id === id);
    setDestinations(prev => prev.filter(d => d.id !== id));
    if (d) onLogEvent?.(`Removed destination: ${d.label}`, 'stream');
  }

  function addDestination() {
    if (!newLabel.trim()) { toast.error('Enter a label'); return; }
    const d: StreamDestination = {
      id: genId(),
      platform: newPlatform,
      label: newLabel.trim(),
      url: newUrl || PLATFORM_META[newPlatform].defaultUrl,
      streamKey: newKey,
      enabled: true,
      status: 'idle',
    };
    setDestinations(prev => [...prev, d]);
    onLogEvent?.(`Added destination: ${d.label}`, 'stream');
    setShowAddForm(false);
    setNewLabel('');
    setNewUrl('');
    setNewKey('');
    toast.success(`Added: ${d.label}`);
  }

  const enabledCount = destinations.filter(d => d.enabled).length;

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-10 border-b border-border cursor-pointer" onClick={() => setCollapsed(v => !v)}>
        <ChevronRight size={13} className={cn('text-muted-foreground transition-transform', !collapsed && 'rotate-90')} />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          Stream Destinations
        </span>
        <span className="font-mono-console text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
          {enabledCount} active
        </span>
        {isStreaming && (
          <span className="flex items-center gap-1 font-mono-console text-[9px] text-[hsl(var(--live-red))] pulse-red">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--live-red))]" /> LIVE
          </span>
        )}
      </div>

      {!collapsed && (
        <div className="p-3 space-y-2">
          {destinations.map(dest => {
            const meta = PLATFORM_META[dest.platform];
            const Icon = meta.icon;
            const keyVisible = showKeys[dest.id] || false;

            return (
              <div key={dest.id} className={cn(
                'rounded-lg border p-3 space-y-2 transition-all',
                dest.enabled ? 'border-border bg-secondary/20' : 'border-border/40 bg-secondary/10 opacity-60'
              )}>
                <div className="flex items-center gap-2">
                  <Icon size={14} className={meta.color} />
                  <span className="font-mono-console text-xs text-foreground flex-1">{dest.label}</span>

                  {/* Status badge */}
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-[9px] font-mono-console',
                    isStreaming && dest.enabled ? 'bg-[hsl(var(--live-red))]/20 text-[hsl(var(--live-red))]' : 'bg-secondary text-muted-foreground'
                  )}>
                    {isStreaming && dest.enabled ? 'LIVE' : 'IDLE'}
                  </span>

                  {/* Enable toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(dest.id); }}
                    className={cn(
                      'relative w-9 h-5 rounded-full transition-colors shrink-0',
                      dest.enabled ? 'bg-emerald-500' : 'bg-secondary'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                      dest.enabled ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </button>

                  <button onClick={() => remove(dest.id)} className="w-6 h-6 flex items-center justify-center text-muted-foreground/40 hover:text-red-400 transition-colors">
                    <Trash2 size={10} />
                  </button>
                </div>

                {/* Stream key field */}
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-console text-[9px] text-muted-foreground w-16 shrink-0">Stream Key</span>
                  <div className="flex-1 relative">
                    <input
                      type={keyVisible ? 'text' : 'password'}
                      value={dest.streamKey || ''}
                      onChange={e => updateKey(dest.id, e.target.value)}
                      placeholder="Paste stream key..."
                      className="w-full bg-input border border-border rounded px-2 py-1 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary pr-7"
                    />
                    <button
                      onClick={() => setShowKeys(prev => ({ ...prev, [dest.id]: !keyVisible }))}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {keyVisible ? <EyeOff size={10} /> : <Eye size={10} />}
                    </button>
                  </div>
                </div>

                {isStreaming && dest.enabled && dest.streamKey && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 w-full animate-pulse" />
                    </div>
                    <span className="font-mono-console text-[9px] text-emerald-400">streaming</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add destination */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-[10px] font-mono-console text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              <Plus size={10} />
              Add Destination
            </button>
          ) : (
            <div className="p-3 rounded-lg border border-primary/40 bg-primary/5 space-y-2">
              <p className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider">New Destination</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground">Platform</label>
                  <select
                    value={newPlatform}
                    onChange={e => setNewPlatform(e.target.value as StreamDestinationPlatform)}
                    className="w-full mt-1 bg-input border border-border rounded px-2 py-1 font-mono-console text-[10px] text-foreground focus:outline-none"
                  >
                    {Object.entries(PLATFORM_META).map(([k, v]) => (
                      <option key={k} value={k} className="bg-[hsl(220,18%,11%)]">{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground">Label</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="My Stream"
                    className="w-full mt-1 bg-input border border-border rounded px-2 py-1 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              {newPlatform === 'rtmp' && (
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground">RTMP URL</label>
                  <input
                    type="text"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="rtmp://..."
                    className="w-full mt-1 bg-input border border-border rounded px-2 py-1 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary"
                  />
                </div>
              )}
              <div>
                <label className="font-mono-console text-[9px] text-muted-foreground">Stream Key</label>
                <input
                  type="password"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  placeholder="Stream key..."
                  className="w-full mt-1 bg-input border border-border rounded px-2 py-1 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddForm(false)} className="flex-1 py-1.5 rounded border border-border font-mono-console text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button onClick={addDestination} className="flex-1 py-1.5 rounded bg-[hsl(var(--live-red))] text-white font-mono-console text-[10px] hover:bg-red-700 transition-colors">
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
