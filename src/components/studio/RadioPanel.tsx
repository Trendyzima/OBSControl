import { useState } from 'react';
import { Radio, Mic, Users, Activity, Wifi, ExternalLink, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutoDJState, StreamHealth } from '@/types/studio';

interface RadioPanelProps {
  autoDJ: AutoDJState;
  health: StreamHealth;
  isLive: boolean;
  isRecording: boolean;
  duration: number;
  listenerCount: number;
  onSetListenerCount: (n: number) => void;
  stationName: string;
  onSetStationName: (name: string) => void;
}

function formatDur(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

const RADIO_PRESETS = [
  { label: 'Icecast (Local)', url: 'http://localhost:8000/live', hint: 'Self-hosted Icecast' },
  { label: 'SHOUTcast', url: 'http://stream.shoutcast.com/broadcast', hint: 'SHOUTcast server' },
  { label: 'Azuracast', url: 'https://your-station.azuracast.com/radio/8000', hint: 'Azuracast SaaS' },
];

export default function RadioPanel({
  autoDJ, health, isLive, isRecording, duration, listenerCount, onSetListenerCount,
  stationName, onSetStationName
}: RadioPanelProps) {
  const [streamUrl, setStreamUrl] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const isOnAir = isLive || isRecording;
  const source = isOnAir ? 'LIVE HOST' : autoDJ.status === 'playing' ? 'AUTODJ' : 'STANDBY';
  const sourceColor = isOnAir ? 'text-red-400' : autoDJ.status === 'playing' ? 'text-emerald-400' : 'text-muted-foreground';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Radio size={11} /> Radio Station
        </h3>
        <span className={cn('font-mono-console text-[9px] font-bold', sourceColor)}>
          {source}
        </span>
      </div>

      {/* Station name */}
      <input
        type="text"
        value={stationName}
        onChange={e => onSetStationName(e.target.value)}
        placeholder="Station name..."
        className="w-full bg-input border border-border rounded-xl px-3 py-2.5 font-mono-console text-sm font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary text-center tracking-wider"
      />

      {/* Big status display */}
      <div className={cn(
        'p-4 rounded-2xl border-2 space-y-3 transition-all',
        isOnAir
          ? 'border-red-500 bg-red-500/8 shadow-[0_0_20px_rgba(220,38,38,0.2)]'
          : autoDJ.status === 'playing'
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : 'border-border bg-secondary/10'
      )}>
        {/* Now playing */}
        <div className="text-center">
          <p className="font-mono-console text-[8px] text-muted-foreground/50 uppercase tracking-wider mb-1">Now on air</p>
          {isOnAir ? (
            <div className="flex items-center justify-center gap-2">
              <Mic size={14} className="text-red-400 animate-pulse" />
              <p className="font-mono-console text-base font-bold text-red-400 tracking-wider">LIVE HOST</p>
            </div>
          ) : autoDJ.currentItem ? (
            <div>
              <p className="font-mono-console text-base font-bold text-foreground truncate">{autoDJ.currentItem.title}</p>
              {autoDJ.currentItem.artist && (
                <p className="font-mono-console text-xs text-muted-foreground">{autoDJ.currentItem.artist}</p>
              )}
            </div>
          ) : (
            <p className="font-mono-console text-sm text-muted-foreground/40">Station idle</p>
          )}
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-xl bg-black/20">
            <Users size={12} className="mx-auto text-muted-foreground mb-1" />
            <input
              type="number"
              min={0}
              max={99999}
              value={listenerCount}
              onChange={e => onSetListenerCount(Number(e.target.value))}
              className="w-full bg-transparent font-mono-console text-base font-bold text-foreground text-center tabular-nums focus:outline-none"
            />
            <p className="font-mono-console text-[7px] text-muted-foreground/50 uppercase">Listeners</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-black/20">
            <Activity size={12} className="mx-auto text-muted-foreground mb-1" />
            <p className="font-mono-console text-base font-bold text-foreground tabular-nums">
              {health.estimatedBitrate > 0 ? `${health.estimatedBitrate}k` : '—'}
            </p>
            <p className="font-mono-console text-[7px] text-muted-foreground/50 uppercase">Bitrate</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-black/20">
            <Volume2 size={12} className="mx-auto text-muted-foreground mb-1" />
            <p className="font-mono-console text-base font-bold text-foreground tabular-nums">{formatDur(duration)}</p>
            <p className="font-mono-console text-[7px] text-muted-foreground/50 uppercase">On Air</p>
          </div>
        </div>

        {/* Next */}
        {!isOnAir && autoDJ.nextItem && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20">
            <span className="font-mono-console text-[8px] text-muted-foreground/50 uppercase shrink-0">NEXT</span>
            <span className="font-mono-console text-[10px] text-muted-foreground truncate flex-1">{autoDJ.nextItem.title}</span>
          </div>
        )}
      </div>

      {/* Radio stream config */}
      <button onClick={() => setShowConfig(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
        <span className="font-mono-console text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Wifi size={10} /> Radio Stream Output
        </span>
        <span className="font-mono-console text-[9px] text-muted-foreground">{showConfig ? '▲' : '▼'}</span>
      </button>

      {showConfig && (
        <div className="space-y-3 p-3 rounded-xl border border-border bg-secondary/5">
          <p className="font-mono-console text-[9px] text-muted-foreground leading-relaxed">
            Browser-to-radio streaming requires an Icecast/SHOUTcast server as a relay. Your audio output connects via WHIP or WebRTC to a relay that forwards to the radio protocol.
          </p>

          {/* Preset options */}
          <div className="space-y-1.5">
            <p className="font-mono-console text-[8px] text-muted-foreground/50 uppercase">Quick Presets</p>
            {RADIO_PRESETS.map(p => (
              <button key={p.url} onClick={() => setStreamUrl(p.url)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors text-left">
                <div className="flex-1 min-w-0">
                  <p className="font-mono-console text-[10px] text-foreground">{p.label}</p>
                  <p className="font-mono-console text-[8px] text-muted-foreground/60 truncate">{p.hint}</p>
                </div>
              </button>
            ))}
          </div>

          <div>
            <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Stream URL</label>
            <input type="url" placeholder="http://your-radio-server:8000/live"
              value={streamUrl} onChange={e => setStreamUrl(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />
          </div>

          <a href="https://www.icecast.org/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono-console text-[9px] text-blue-400 underline">
            Learn about Icecast <ExternalLink size={9} />
          </a>
        </div>
      )}

      {/* Auto-switching info */}
      <div className="p-3 rounded-xl border border-border/40 bg-secondary/5">
        <p className="font-mono-console text-[8px] text-muted-foreground/50 uppercase tracking-wider mb-1.5">Auto-Switching Logic</p>
        <div className="space-y-1">
          {[
            { cond: isOnAir, label: 'Host is live', active: isOnAir },
            { cond: true, label: 'AutoDJ fills silence between shows', active: autoDJ.status === 'playing' && !isOnAir },
            { cond: true, label: 'Ads inserted every ' + autoDJ.adInterval + ' songs', active: false },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', row.active ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/20')} />
              <span className={cn('font-mono-console text-[9px]', row.active ? 'text-emerald-400' : 'text-muted-foreground/50')}>{row.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
