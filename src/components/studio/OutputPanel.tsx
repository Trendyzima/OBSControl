import { useState, useEffect } from 'react';
import { StreamOutput, StudioState, StreamHealth } from '@/types/studio';
import { Radio, Circle, Square, Wifi, HardDrive, FolderOpen, Activity, ChevronDown, ChevronUp, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutputPanelProps {
  state: StudioState;
  output: StreamOutput;
  onOutputChange: (patch: Partial<StreamOutput>) => void;
  onStart: () => void;
  onStop: () => void;
  duration: number;
}

const PLATFORMS = [
  { id: 'youtube', label: 'YT', color: 'text-red-500', whipHint: 'https://stream.youtube.com/live2/YOUR_KEY/whip' },
  { id: 'facebook', label: 'FB', color: 'text-blue-400', whipHint: 'https://media-api.facebook.com/rtmp/YOUR_KEY/whip' },
  { id: 'twitch', label: 'TTW', color: 'text-purple-400', whipHint: 'https://ingest.global-contribute.live-video.net/app/YOUR_KEY' },
  { id: 'custom', label: 'Custom', color: 'text-muted-foreground', whipHint: 'https://your-whip-endpoint/live' },
] as const;

const RESOLUTIONS = ['1920x1080', '1280x720', '854x480'] as const;
const BITRATES = [{ label: '2M', value: 2000 }, { label: '4M', value: 4000 }, { label: '6M', value: 6000 }, { label: '8M', value: 8000 }];

function formatDur(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

function HealthBar({ health }: { health: StreamHealth }) {
  const color = health.score >= 80 ? 'bg-emerald-500' : health.score >= 50 ? 'bg-amber-400' : health.score > 0 ? 'bg-red-500' : 'bg-muted-foreground/20';
  const textColor = health.score >= 80 ? 'text-emerald-400' : health.score >= 50 ? 'text-amber-400' : health.score > 0 ? 'text-red-400' : 'text-muted-foreground';
  return (
    <div className="space-y-2 p-3 rounded-xl border border-border bg-secondary/10">
      <div className="flex items-center justify-between">
        <span className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Activity size={10} /> Stream Health
        </span>
        <span className={cn('font-mono-console text-sm font-bold tabular-nums', textColor)}>{health.score}</span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${health.score}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Bitrate', value: health.estimatedBitrate > 0 ? `${health.estimatedBitrate}k` : '—' },
          { label: 'Status', value: health.encoderStatus },
          { label: 'Dropped', value: String(health.droppedFrames) },
        ].map(m => (
          <div key={m.label} className="text-center">
            <p className="font-mono-console text-[8px] text-muted-foreground/50 uppercase">{m.label}</p>
            <p className={cn('font-mono-console text-[10px] tabular-nums', textColor)}>{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OutputPanel({ state, output, onOutputChange, onStart, onStop, duration }: OutputPanelProps) {
  const { isLive, isRecording, health } = state;
  const isActive = isLive || isRecording;
  const [showWhipInfo, setShowWhipInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fsSupported] = useState(() => 'showDirectoryPicker' in window);

  const selectedPlatform = PLATFORMS.find(p => p.id === output.platform);

  return (
    <div className="space-y-3">
      <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground">Output</h3>

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-1.5">
        <button onClick={() => onOutputChange({ mode: 'record' })} disabled={isActive}
          className={cn('flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border-2 font-mono-console text-[9px] transition-colors',
            output.mode === 'record' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-border text-muted-foreground hover:text-foreground disabled:opacity-40')}>
          <HardDrive size={13} />Download
        </button>
        {fsSupported && (
          <button onClick={() => onOutputChange({ mode: 'folder' })} disabled={isActive}
            className={cn('flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border-2 font-mono-console text-[9px] transition-colors',
              output.mode === 'folder' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-border text-muted-foreground hover:text-foreground disabled:opacity-40')}>
            <FolderOpen size={13} />Folder
          </button>
        )}
        <button onClick={() => onOutputChange({ mode: 'whip' })} disabled={isActive}
          className={cn('flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border-2 font-mono-console text-[9px] transition-colors',
            output.mode === 'whip' ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-border text-muted-foreground hover:text-foreground disabled:opacity-40')}>
          <Wifi size={13} />Go Live
        </button>
      </div>

      {/* Folder mode info */}
      {output.mode === 'folder' && !isActive && (
        <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
          <p className="font-mono-console text-[10px] text-cyan-400 font-semibold">Direct Folder Save</p>
          <p className="font-mono-console text-[10px] text-muted-foreground mt-1 leading-relaxed">
            Click Start — you'll be prompted to choose a folder. Recording saves directly there in real-time. No download needed when stopped.
          </p>
        </div>
      )}

      {/* Record mode info */}
      {output.mode === 'record' && !isActive && (
        <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <p className="font-mono-console text-[10px] text-amber-400 font-semibold">Local Recording</p>
          <p className="font-mono-console text-[10px] text-muted-foreground mt-1 leading-relaxed">
            Records in browser memory and auto-downloads as .webm when stopped. No internet required.
          </p>
        </div>
      )}

      {/* WHIP settings */}
      {output.mode === 'whip' && !isActive && (
        <div className="space-y-2">
          <div className="flex gap-1">
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => onOutputChange({ platform: p.id })}
                className={cn('flex-1 py-1.5 rounded-lg font-mono-console text-[9px] uppercase tracking-wide border transition-colors',
                  output.platform === p.id ? `border-current bg-current/10 ${p.color}` : 'border-border text-muted-foreground hover:text-foreground')}>
                {p.label}
              </button>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase">WHIP Endpoint</label>
              <button onClick={() => setShowWhipInfo(v => !v)} className="text-muted-foreground hover:text-foreground"><Info size={11} /></button>
            </div>
            <input type="url" placeholder={selectedPlatform?.whipHint} value={output.whipUrl}
              onChange={e => onOutputChange({ whipUrl: e.target.value })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Stream Key / Bearer</label>
            <input type="password" placeholder="Stream key..." value={output.streamKey}
              onChange={e => onOutputChange({ streamKey: e.target.value })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />
          </div>
          {showWhipInfo && (
            <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-1.5">
              <p className="font-mono-console text-[10px] text-blue-400 font-semibold">WHIP = Browser-native live streaming</p>
              <p className="font-mono-console text-[10px] text-muted-foreground leading-relaxed">Natively: Cloudflare Stream, Mux. For YouTube/Twitch/FB use a WHIP-to-RTMP relay.</p>
              <a href="https://github.com/Sean-Der/whip-to-rtmp" target="_blank" rel="noopener noreferrer"
                className="font-mono-console text-[10px] text-blue-400 underline flex items-center gap-1">
                whip-to-rtmp relay <ExternalLink size={9} />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Quality settings */}
      {!isActive && (
        <>
          <button onClick={() => setShowSettings(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
            <span className="font-mono-console text-[10px] text-muted-foreground uppercase tracking-wider">Quality Settings</span>
            {showSettings ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
          </button>
          {showSettings && (
            <div className="space-y-2 p-3 rounded-xl border border-border bg-secondary/10">
              <div>
                <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Resolution</label>
                <div className="flex gap-1">
                  {RESOLUTIONS.map(r => (
                    <button key={r} onClick={() => onOutputChange({ resolution: r })}
                      className={cn('flex-1 py-1.5 rounded-lg border font-mono-console text-[9px] transition-colors',
                        output.resolution === r ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                      {r.split('x')[1]}p
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Bitrate</label>
                <div className="flex gap-1">
                  {BITRATES.map(b => (
                    <button key={b.value} onClick={() => onOutputChange({ bitrate: b.value })}
                      className={cn('flex-1 py-1.5 rounded-lg border font-mono-console text-[9px] transition-colors',
                        output.bitrate === b.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Frame Rate</label>
                <div className="flex gap-1">
                  {([30, 60] as const).map(fps => (
                    <button key={fps} onClick={() => onOutputChange({ fps })}
                      className={cn('flex-1 py-1.5 rounded-lg border font-mono-console text-[9px] transition-colors',
                        output.fps === fps ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                      {fps} FPS
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Stream health (while active) */}
      {isActive && <HealthBar health={health} />}

      {/* Go / Stop */}
      {!isActive ? (
        <button onClick={onStart}
          className={cn('w-full py-4 rounded-2xl font-mono-console text-sm font-bold tracking-widest transition-all active:scale-[0.98]',
            output.mode === 'whip' ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' :
            output.mode === 'folder' ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]' :
            'bg-amber-600 hover:bg-amber-700 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)]')}>
          <div className="flex items-center justify-center gap-2.5">
            {output.mode === 'whip' ? <Radio size={16} /> : output.mode === 'folder' ? <FolderOpen size={15} /> : <Circle size={14} className="fill-white" />}
            {output.mode === 'whip' ? 'GO LIVE' : output.mode === 'folder' ? 'RECORD TO FOLDER' : 'START RECORDING'}
          </div>
        </button>
      ) : (
        <div className="space-y-2">
          <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border',
            isLive ? 'border-red-500/50 bg-red-500/10' : 'border-amber-500/50 bg-amber-500/10')}>
            <span className={cn('w-2 h-2 rounded-full animate-pulse', isLive ? 'bg-red-500' : 'bg-amber-500')} />
            <span className={cn('font-mono-console text-xs font-bold flex-1', isLive ? 'text-red-400' : 'text-amber-400')}>
              {isLive ? 'LIVE' : 'RECORDING'}
            </span>
            <span className="font-mono-console text-xs text-muted-foreground tabular-nums">{formatDur(duration)}</span>
          </div>
          <button onClick={onStop}
            className="w-full py-3.5 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-mono-console text-sm font-bold border border-border transition-colors flex items-center justify-center gap-2">
            <Square size={14} />STOP
          </button>
        </div>
      )}
    </div>
  );
}
