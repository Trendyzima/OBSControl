import { AudioTrack } from '@/types/studio';
import { Mic, Video, Music, VolumeX, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudioMixerProps {
  tracks: AudioTrack[];
  onVolume: (id: string, v: number) => void;
  onMute: (id: string) => void;
}

const TRACK_ICONS: Record<string, React.ElementType> = {
  mic: Mic,
  video: Video,
  music: Music,
};

const TRACK_COLORS: Record<string, string> = {
  mic: 'bg-emerald-400',
  video: 'bg-blue-400',
  music: 'bg-purple-400',
};

export default function StudioMixer({ tracks, onVolume, onMute }: StudioMixerProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground">Audio Mixer</h3>
      <div className="flex gap-2">
        {tracks.map(track => {
          const Icon = TRACK_ICONS[track.type] || Mic;
          const barColor = TRACK_COLORS[track.type] || 'bg-emerald-400';
          const level = track.level ?? 0;

          return (
            <div key={track.id} className="flex-1 flex flex-col items-center gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border">
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
                          ? dangerZone ? 'bg-red-500' : i >= 4 ? 'bg-amber-400' : barColor
                          : 'bg-secondary'
                      )}
                      style={{ height: `${(i + 1) * 12.5}%` }}
                    />
                  );
                })}
              </div>

              {/* Volume slider — vertical */}
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
    </div>
  );
}
