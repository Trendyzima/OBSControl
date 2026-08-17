import { AudioSource } from '@/types/obs';
import { Mic, Mic2, Monitor, Music, VolumeX, Volume2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const SOURCE_ICONS: Record<string, React.ElementType> = {
  microphone: Mic,
  guest: Mic2,
  desktop: Monitor,
  music: Music,
};

interface AudioMixerProps {
  sources: AudioSource[];
  onVolumeChange: (id: string, v: number) => void;
  onToggleMute: (id: string) => void;
  disabled: boolean;
}

export default function AudioMixer({ sources, onVolumeChange, onToggleMute, disabled }: AudioMixerProps) {
  return (
    <div className="space-y-3">
      <h2 className="font-mono-console text-xs tracking-widest text-muted-foreground uppercase">Audio Mixer</h2>
      <div className="space-y-2">
        {sources.map(source => {
          const Icon = SOURCE_ICONS[source.type] || Mic;
          return (
            <div
              key={source.id}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg border border-border bg-secondary/30',
                source.muted && 'opacity-50'
              )}
            >
              {/* Mute button */}
              <button
                onClick={() => !disabled && onToggleMute(source.id)}
                disabled={disabled}
                className={cn(
                  'w-8 h-8 rounded flex items-center justify-center transition-colors shrink-0',
                  source.muted
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80',
                  disabled && 'cursor-not-allowed'
                )}
              >
                {source.muted ? <VolumeX size={14} /> : <Icon size={14} />}
              </button>

              {/* Label */}
              <div className="w-24 shrink-0">
                <p className="font-mono-console text-xs text-foreground truncate">{source.name}</p>
                <p className="font-mono-console text-[10px] text-muted-foreground">{source.muted ? 'MUTED' : `${source.volume}%`}</p>
              </div>

              {/* Volume slider */}
              <div className="flex-1 flex items-center gap-2">
                <Volume2 size={10} className="text-muted-foreground/40 shrink-0" />
                <Slider
                  value={[source.volume]}
                  min={0}
                  max={100}
                  step={1}
                  disabled={disabled || source.muted}
                  onValueChange={([v]) => onVolumeChange(source.id, v)}
                  className="flex-1"
                />
                <span className="font-mono-console text-[10px] text-muted-foreground w-8 text-right shrink-0">
                  {source.volume}
                </span>
              </div>

              {/* Volume bar */}
              <div className="w-2 h-8 bg-secondary rounded-full overflow-hidden shrink-0">
                <div
                  className={cn(
                    'w-full rounded-full transition-all duration-100',
                    source.muted ? 'bg-muted-foreground/20' : source.volume > 80 ? 'bg-red-500' : source.volume > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                  )}
                  style={{ height: `${source.muted ? 0 : source.volume}%`, marginTop: `${source.muted ? 100 : 100 - source.volume}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
