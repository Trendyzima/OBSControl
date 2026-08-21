import { useState } from 'react';
import {
  Settings, Circle, Square, Folder, Wifi, Radio, Zap, Upload,
  Cloud, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudioState, StreamOutput } from '@/types/studio';
import { useCloudStorage } from '@/hooks/useCloudStorage';
import { UserProfile } from '@/lib/supabase';
import { toast } from 'sonner';

interface OutputPanelProps {
  state: StudioState;
  output: StreamOutput;
  onOutputChange: (patch: Partial<StreamOutput>) => void;
  onStart: () => void;
  onStop: () => void;
  duration: number;
  user?: UserProfile | null;
  lastRecordingBlob?: { blob: Blob; name: string } | null;
  onClearRecording?: () => void;
}

function formatDur(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

const MODES = [
  { id: 'record', label: 'Record', icon: Circle, desc: 'Save to device' },
  { id: 'folder', label: 'Folder', icon: Folder, desc: 'Save to folder' },
  { id: 'whip', label: 'WHIP', icon: Wifi, desc: 'WebRTC stream' },
  { id: 'rtmp', label: 'RTMP', icon: Radio, desc: 'Live stream' },
] as const;

const RESOLUTIONS = ['1280x720', '1920x1080', '854x480', '3840x2160'] as const;
const BITRATES = [1500, 2500, 4000, 6000, 8000, 12000] as const;

export default function OutputPanel({
  state, output, onOutputChange, onStart, onStop, duration,
  user, lastRecordingBlob, onClearRecording
}: OutputPanelProps) {
  const { isLive, isRecording, health } = state;
  const isActive = isLive || isRecording;
  const [uploadingCloud, setUploadingCloud] = useState(false);
  const { uploadMedia } = useCloudStorage(user?.id ?? null);

  const SCORE_COLOR = health.score >= 80 ? 'text-emerald-400' : health.score >= 50 ? 'text-amber-400' : 'text-red-400';
  const SCORE_BG = health.score >= 80 ? 'bg-emerald-500' : health.score >= 50 ? 'bg-amber-500' : 'bg-red-500';

  async function handleUploadToCloud() {
    if (!lastRecordingBlob || !user) {
      if (!user) toast.error('Sign in to upload recordings to cloud');
      return;
    }
    setUploadingCloud(true);
    try {
      const file = new File([lastRecordingBlob.blob], lastRecordingBlob.name, { type: 'video/webm' });
      await uploadMedia(file, 'recording', 'recordings');
      toast.success('Recording uploaded to cloud library');
      onClearRecording?.();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingCloud(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Settings size={11} /> Output
        </h3>
        {isActive && (
          <span className="font-mono-console text-[11px] font-bold tabular-nums text-red-400">{formatDur(duration)}</span>
        )}
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-4 gap-1">
        {MODES.map(m => {
          const Icon = m.icon;
          return (
            <button key={m.id}
              onClick={() => !isActive && onOutputChange({ mode: m.id })}
              disabled={isActive}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 rounded-xl border font-mono-console text-[8px] transition-all',
                output.mode === m.id
                  ? 'border-primary bg-primary/15 text-primary shadow-[0_0_8px_rgba(var(--primary),0.2)]'
                  : 'border-border text-muted-foreground hover:text-foreground disabled:opacity-50'
              )}
            >
              <Icon size={13} />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Mode description */}
      <p className="font-mono-console text-[9px] text-muted-foreground/50 text-center">
        {MODES.find(m => m.id === output.mode)?.desc}
        {output.mode === 'whip' && ' — requires WHIP relay endpoint'}
        {output.mode === 'rtmp' && ' — requires nginx-rtmp or relay server'}
      </p>

      {/* WHIP settings */}
      {output.mode === 'whip' && (
        <div className="space-y-2">
          <div>
            <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">WHIP Endpoint URL</label>
            <input type="url" value={output.whipUrl} onChange={e => onOutputChange({ whipUrl: e.target.value })}
              placeholder="https://your-whip-endpoint/..."
              disabled={isActive}
              className="w-full bg-input border border-border rounded-xl px-3 py-2 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary disabled:opacity-50" />
          </div>
          <div>
            <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Bearer Token (optional)</label>
            <input type="password" value={output.streamKey} onChange={e => onOutputChange({ streamKey: e.target.value })}
              placeholder="Optional auth token..."
              disabled={isActive}
              className="w-full bg-input border border-border rounded-xl px-3 py-2 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary disabled:opacity-50" />
          </div>
        </div>
      )}

      {/* RTMP settings */}
      {output.mode === 'rtmp' && (
        <div className="space-y-2">
          <div>
            <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">RTMP URL</label>
            <input type="url" value={output.rtmpUrl} onChange={e => onOutputChange({ rtmpUrl: e.target.value })}
              placeholder="rtmp://your-server/live"
              disabled={isActive}
              className="w-full bg-input border border-border rounded-xl px-3 py-2 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary disabled:opacity-50" />
          </div>
          <div>
            <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Stream Key</label>
            <input type="password" value={output.streamKey} onChange={e => onOutputChange({ streamKey: e.target.value })}
              placeholder="xxxx-xxxx-xxxx-xxxx"
              disabled={isActive}
              className="w-full bg-input border border-border rounded-xl px-3 py-2 font-mono-console text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary disabled:opacity-50" />
          </div>
          <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <p className="font-mono-console text-[9px] text-amber-400 leading-relaxed">
              Browsers cannot send RTMP directly. A relay server (nginx-rtmp, Node-Media-Server) is required. Recording locally as fallback.
            </p>
          </div>
        </div>
      )}

      {/* Quality settings */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Resolution</label>
          <select value={output.resolution} onChange={e => onOutputChange({ resolution: e.target.value as StreamOutput['resolution'] })}
            disabled={isActive}
            className="w-full bg-input border border-border rounded-xl px-2 py-2 font-mono-console text-[10px] text-foreground focus:outline-none disabled:opacity-50">
            {RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Frame Rate</label>
          <select value={output.fps} onChange={e => onOutputChange({ fps: Number(e.target.value) as 30 | 60 })}
            disabled={isActive}
            className="w-full bg-input border border-border rounded-xl px-2 py-2 font-mono-console text-[10px] text-foreground focus:outline-none disabled:opacity-50">
            <option value={30}>30 FPS</option>
            <option value={60}>60 FPS</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="font-mono-console text-[9px] text-muted-foreground uppercase">Bitrate</label>
          <span className="font-mono-console text-[9px] text-foreground">{output.bitrate} kbps</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {BITRATES.map(b => (
            <button key={b} onClick={() => !isActive && onOutputChange({ bitrate: b })} disabled={isActive}
              className={cn('px-2 py-1 rounded-lg border font-mono-console text-[8px] transition-colors disabled:opacity-50',
                output.bitrate === b ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
              {b >= 1000 ? `${b / 1000}M` : b + 'k'}
            </button>
          ))}
        </div>
      </div>

      {/* Stream health */}
      {isActive && (
        <div className="p-3 rounded-xl border border-border bg-secondary/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider">Stream Health</span>
            <span className={cn('font-mono-console text-[10px] font-bold', SCORE_COLOR)}>{health.score}/100</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-1000', SCORE_BG)}
              style={{ width: `${health.score}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[
              { label: 'Bitrate', value: `${health.estimatedBitrate}k` },
              { label: 'Status', value: health.encoderStatus.toUpperCase() },
              { label: 'Time', value: formatDur(duration) },
            ].map(({ label, value }) => (
              <div key={label} className="px-2 py-1.5 rounded-lg bg-secondary/20">
                <p className="font-mono-console text-[7px] text-muted-foreground/50 uppercase">{label}</p>
                <p className="font-mono-console text-[9px] font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start / Stop */}
      {isActive ? (
        <button onClick={onStop}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-red-500/60 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono-console text-sm font-bold tracking-widest transition-all active:scale-[0.98]">
          <Square size={16} />
          STOP {isLive ? 'STREAM' : 'RECORDING'}
        </button>
      ) : (
        <button onClick={onStart}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-mono-console text-sm font-bold tracking-widest transition-all active:scale-[0.98]',
            output.mode === 'whip' || output.mode === 'rtmp'
              ? 'border-red-500/60 bg-red-500/10 hover:bg-red-500/20 text-red-400 shadow-[0_0_14px_rgba(220,38,38,0.2)]'
              : 'border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
          )}>
          <Circle size={16} className={output.mode === 'whip' || output.mode === 'rtmp' ? 'fill-red-500' : 'fill-emerald-500'} />
          {output.mode === 'whip' ? 'GO LIVE (WHIP)' : output.mode === 'rtmp' ? 'GO LIVE (RTMP)' : 'START RECORDING'}
        </button>
      )}

      {/* Cloud upload after recording */}
      {lastRecordingBlob && !isActive && (
        <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle size={13} className="text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-mono-console text-[10px] font-semibold text-foreground">Recording ready</p>
              <p className="font-mono-console text-[8px] text-muted-foreground truncate">{lastRecordingBlob.name}</p>
            </div>
          </div>
          {user ? (
            <button onClick={handleUploadToCloud} disabled={uploadingCloud}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-400 font-mono-console text-[10px] font-bold hover:bg-blue-500/20 transition-colors disabled:opacity-50">
              {uploadingCloud ? (
                <><RefreshCw size={12} className="animate-spin" /> Uploading...</>
              ) : (
                <><Cloud size={12} /> Upload to Cloud Library</>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle size={11} className="text-amber-400 shrink-0" />
              <p className="font-mono-console text-[9px] text-amber-400">Sign in to upload recordings to cloud</p>
            </div>
          )}
          <button onClick={onClearRecording}
            className="w-full py-1.5 rounded-lg border border-border text-muted-foreground font-mono-console text-[9px] hover:text-foreground transition-colors">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
