import { useEffect, useState } from 'react';
import { OBSScene, TransitionType } from '@/types/obs';
import { X, ArrowRight, Camera, Users, Newspaper, Video, Image, Megaphone, Play, LogOut, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const SCENE_ICONS: Record<string, React.ElementType> = {
  'LIVE CAMERA': Camera,
  'GUEST CAMERA': Users,
  'NEWS CLIP': Newspaper,
  'FULL VIDEO': Video,
  'PHOTO SLIDE': Image,
  'ADVERTISEMENT': Megaphone,
  'INTRO': Play,
  'OUTRO': LogOut,
  'BRB': Clock,
};

const TRANSITION_DESCRIPTIONS: Record<TransitionType, string> = {
  Cut: 'Instant hard cut — no transition effect',
  Fade: 'Smooth opacity fade between scenes',
  Swipe: 'Horizontal slide transition',
  Stinger: 'Full-screen branded stinger wipe',
};

const TRANSITION_DURATION: Record<TransitionType, number> = {
  Cut: 0,
  Fade: 300,
  Swipe: 250,
  Stinger: 400,
};

interface SceneTransitionPreviewProps {
  open: boolean;
  fromScene: OBSScene | null;
  toScene: OBSScene | null;
  transition: TransitionType;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SceneTransitionPreview({
  open,
  fromScene,
  toScene,
  transition,
  onConfirm,
  onCancel,
}: SceneTransitionPreviewProps) {
  const [animating, setAnimating] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'out' | 'in' | 'done'>('idle');

  useEffect(() => {
    if (open) { setPhase('idle'); setAnimating(false); }
  }, [open, fromScene, toScene]);

  if (!open || !fromScene || !toScene) return null;

  const FromIcon = SCENE_ICONS[fromScene.sceneName] || Camera;
  const ToIcon = SCENE_ICONS[toScene.sceneName] || Camera;
  const dur = TRANSITION_DURATION[transition];

  function runPreview() {
    if (animating) return;
    setAnimating(true);
    setPhase('out');
    const halfDur = Math.max(dur / 2, 50);
    setTimeout(() => setPhase('in'), halfDur + 50);
    setTimeout(() => { setPhase('done'); setAnimating(false); }, halfDur * 2 + 100);
  }

  // Compute CSS classes for each panel based on transition type and phase
  function getFromClass() {
    if (transition === 'Cut') return phase !== 'idle' ? 'opacity-0' : 'opacity-100';
    if (transition === 'Fade') return phase === 'out' || phase === 'in' || phase === 'done' ? 'opacity-0 transition-opacity duration-300' : 'opacity-100 transition-opacity duration-300';
    if (transition === 'Swipe') return phase === 'out' || phase === 'in' || phase === 'done' ? '-translate-x-full opacity-0 transition-all duration-300' : 'translate-x-0 opacity-100 transition-all duration-300';
    if (transition === 'Stinger') return phase === 'out' || phase === 'in' || phase === 'done' ? 'scale-110 opacity-0 transition-all duration-300' : 'scale-100 opacity-100 transition-all duration-300';
    return '';
  }

  function getToClass() {
    if (transition === 'Cut') return phase === 'done' ? 'opacity-100' : 'opacity-0';
    if (transition === 'Fade') return phase === 'done' ? 'opacity-100 transition-opacity duration-300' : 'opacity-0 transition-opacity duration-300';
    if (transition === 'Swipe') return phase === 'done' ? 'translate-x-0 opacity-100 transition-all duration-300' : 'translate-x-full opacity-0 transition-all duration-300';
    if (transition === 'Stinger') return phase === 'done' ? 'scale-100 opacity-100 transition-all duration-300' : 'scale-90 opacity-0 transition-all duration-300';
    return '';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onCancel}>
      <div
        className="bg-[hsl(var(--card))] border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            <span className="font-mono-console text-sm font-semibold text-foreground uppercase tracking-wider">Scene Transition Preview</span>
          </div>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Preview panels */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 relative">
            {/* From scene */}
            <div className="space-y-2">
              <p className="font-mono-console text-[9px] uppercase tracking-widest text-muted-foreground">Current Scene</p>
              <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-[hsl(var(--live-red))]/60 bg-secondary/20">
                <div className={cn('absolute inset-0', getFromClass())}>
                  {fromScene.previewUrl ? (
                    <img src={fromScene.previewUrl} alt={fromScene.sceneName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/40">
                      <FromIcon size={32} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--live-red))]/90">
                  <span className="w-1.5 h-1.5 rounded-full bg-white pulse-red" />
                  <span className="font-mono-console text-[8px] font-bold text-white">LIVE</span>
                </div>
              </div>
              <p className="font-mono-console text-[10px] text-center text-foreground uppercase tracking-wide">{fromScene.sceneName}</p>
            </div>

            {/* Arrow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <ArrowRight size={16} className="text-white" />
              </div>
            </div>

            {/* To scene */}
            <div className="space-y-2">
              <p className="font-mono-console text-[9px] uppercase tracking-widest text-muted-foreground">Target Scene</p>
              <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-emerald-400/60 bg-secondary/20">
                <div className={cn('absolute inset-0', getToClass())}>
                  {toScene.previewUrl ? (
                    <img src={toScene.previewUrl} alt={toScene.sceneName} className="w-full h-full object-cover brightness-75" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/40">
                      <ToIcon size={32} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/80">
                  <span className="font-mono-console text-[8px] font-bold text-white">NEXT</span>
                </div>
              </div>
              <p className="font-mono-console text-[10px] text-center text-foreground uppercase tracking-wide">{toScene.sceneName}</p>
            </div>
          </div>

          {/* Transition info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono-console text-[10px] font-semibold text-foreground uppercase">{transition}</span>
                {dur > 0 && (
                  <span className="font-mono-console text-[9px] text-muted-foreground">{dur}ms</span>
                )}
              </div>
              <p className="font-mono-console text-[9px] text-muted-foreground/70 mt-0.5">{TRANSITION_DESCRIPTIONS[transition]}</p>
            </div>
            <button
              onClick={runPreview}
              disabled={animating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 font-mono-console text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <Play size={10} className={animating ? 'animate-pulse' : ''} />
              {animating ? 'Playing...' : 'Preview'}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border font-mono-console text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-primary hover:opacity-90 font-mono-console text-sm font-bold text-white transition-opacity"
          >
            Switch Scene →
          </button>
        </div>
      </div>
    </div>
  );
}
