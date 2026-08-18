import { TransitionType } from '@/types/studio';
import { Zap, Layers, ArrowRight, ArrowLeft, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransitionControlProps {
  transition: TransitionType;
  transitionDuration: number;
  onTransition: (t: TransitionType) => void;
  onDuration: (d: number) => void;
}

const TRANSITIONS: { type: TransitionType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: 'cut', label: 'Cut', icon: Zap, desc: 'Instant switch' },
  { type: 'fade', label: 'Fade', icon: Layers, desc: 'Fade to black' },
  { type: 'dissolve', label: 'Dissolve', icon: Waves, desc: 'Cross-dissolve' },
  { type: 'wipe-left', label: 'Wipe ←', icon: ArrowLeft, desc: 'Wipe left' },
  { type: 'wipe-right', label: 'Wipe →', icon: ArrowRight, desc: 'Wipe right' },
];

export default function TransitionControl({ transition, transitionDuration, onTransition, onDuration }: TransitionControlProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground">Scene Transitions</h3>

      <div className="grid grid-cols-5 gap-1.5">
        {TRANSITIONS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.type} onClick={() => onTransition(t.type)}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all font-mono-console text-[8px]',
                transition === t.type
                  ? 'border-primary bg-primary/10 text-primary shadow-[0_0_8px_rgba(220,38,38,0.3)]'
                  : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
              )}>
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {transition !== 'cut' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-mono-console text-[9px] text-muted-foreground uppercase">Duration</label>
            <span className="font-mono-console text-[10px] text-muted-foreground">{transitionDuration}ms</span>
          </div>
          <input type="range" min={100} max={2000} step={50} value={transitionDuration}
            onChange={e => onDuration(Number(e.target.value))}
            className="w-full accent-primary h-1" />
          <div className="flex justify-between mt-0.5">
            <span className="font-mono-console text-[8px] text-muted-foreground/40">100ms</span>
            <span className="font-mono-console text-[8px] text-muted-foreground/40">2000ms</span>
          </div>
        </div>
      )}

      <p className="font-mono-console text-[8px] text-muted-foreground/40 text-center">
        Applies when using CUT button or double-tapping scenes
      </p>
    </div>
  );
}
