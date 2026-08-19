import { AudioTrack } from '@/types/studio';
import { Mic, Video, Music, VolumeX, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import WaveformVisualizer from './WaveformVisualizer';

interface StudioMixerProps {
  tracks: AudioTrack[];
  onVolume: (id: string, v: number) => void;
  onMute: (id: string) => void;
  analyser?: AnalyserNode | null;
}

const TRACK_ICONS: Record<string, React.ElementType> = {
  mic: Mic,
  video: Video,
  music: Music,
};

const TRACK_COLORS: Record<string, { bar: string; wave: string; glow: string }> = {
  mic:   { bar: 'bg-emerald-400',  wave: '#10b981', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]' },
  video: { bar: 'bg-blue-400',     wave: '#60a5fa', glow: 'shadow-[0_0_8px_rgba(96,165,250,0.3)]' },
  music: { bar: 'bg-purple-400',   wave: '#c084fc', glow: 'shadow-[0_0_8px_rgba(192,132,252,0.3)]' },
};

export default function StudioMixer({ tracks, onVolume, onMute, analyser }: StudioMixerProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground">Audio Mixer</h3>

      {/* Waveform visualizer for mic */}
      {analyser && (
        <div className="rounded-xl overflow-hidden border border-border">
          <WaveformVisualizer
            analyser={analyser}
            active={!tracks.find(t => t.id === 'mic')?.muted}
            color="#10b981"
            height={52}
          />
        </div>
      )}

      <div className="flex gap-2">
        {tracks.map(track => {
          const Icon = TRACK_ICONS[track.type] || Mic;
          const colors = TRACK_COLORS[track.type] || TRACK_COLORS.mic;
          const level = track.level ?? 0;

          return (
            <div key={track.id} className={cn(
              'flex-1 flex flex-col items-center gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border transition-all',
              !track.muted && level > 70 ? colors.glow : ''
            )}>
              {/* VU meter */}
              <div className="flex gap-0.5 h-16 items-end">
                {Array.from({ length: 8 }, (_, i) => {
                  const threshold = ((i + 1) / 8) * 100;
                  const lit = !track.muted && level >= threshold;
                  const dangerZone = i >= 6;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'w-2 rounded-sm transition-all duration-75',
                        lit
                          ? dangerZone ? 'bg-red-500' : i >= 4 ? 'bg-amber-400' : colors.bar
                          : 'bg-secondary'
                      )}
                      style={{ height: `${(i + 1) * 12.5}%` }}
                    />
                  );
                })}
              </div>

              {/* Volume slider */}
              <div className="flex flex-col items-center gap-1 w-full">
                <input
                  type="range"
                  min={0} max={100} step={1}
                  value={track.volume}
                  onChange={e => onVolume(track.id, Number(e.target.value))}
                  disabled={track.muted}
                  className="w-full accent-primary h-1"
                />
                <span className="font-mono-console text-[9px] text-muted-foreground tabular-nums">{track.volume}</span>
              </div>

              {/* Mute button */}
              <button
                onClick={() => onMute(track.id)}
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center border transition-colors',
                  track.muted
                    ? 'border-red-500/50 bg-red-500/15 text-red-400'
                    : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                )}
                title={track.muted ? 'Unmute' : 'Mute'}
              >
                {track.muted ? <VolumeX size={14} /> : <Icon size={14} />}
              </button>

              {/* Label */}
              <span className={cn(
                'font-mono-console text-[8px] uppercase tracking-wide text-center leading-tight',
                track.muted ? 'text-red-400/70' : 'text-muted-foreground'
              )}>
                {track.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Level indicators */}
      <div className="space-y-1">
        {tracks.map(track => (
          <div key={track.id} className="flex items-center gap-2">
            <span className="font-mono-console text-[8px] text-muted-foreground/50 w-16 shrink-0 truncate">{track.name}</span>
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-75',
                  track.muted ? 'bg-muted-foreground/20' :
                  (track.level || 0) > 80 ? 'bg-red-500' :
                  (track.level || 0) > 50 ? 'bg-amber-400' :
                  TRACK_COLORS[track.type]?.bar || 'bg-emerald-400'
                )}
                style={{ width: `${track.muted ? 0 : (track.level || 0)}%` }}
              />
            </div>
            <span className="font-mono-console text-[8px] text-muted-foreground/40 w-8 shrink-0 tabular-nums text-right">
              {track.muted ? 'MUTE' : `${track.level || 0}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
