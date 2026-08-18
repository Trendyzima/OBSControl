import { useState } from 'react';
import { OBSScene, TransitionType } from '@/types/obs';
import { Camera, Users, Newspaper, Video, Image, Megaphone, Play, LogOut, Clock, Expand } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ScenePreviewModal from './ScenePreviewModal';
import SceneTransitionPreview from './SceneTransitionPreview';

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

const SCENE_BORDER_COLORS: Record<string, string> = {
  'LIVE CAMERA': 'hover:border-emerald-400/70',
  'GUEST CAMERA': 'hover:border-blue-400/70',
  'NEWS CLIP': 'hover:border-amber-400/70',
  'FULL VIDEO': 'hover:border-purple-400/70',
  'PHOTO SLIDE': 'hover:border-cyan-400/70',
  'ADVERTISEMENT': 'hover:border-orange-400/70',
  'INTRO': 'hover:border-green-400/70',
  'OUTRO': 'hover:border-red-400/70',
  'BRB': 'hover:border-yellow-400/70',
};

const ACTIVE_RING: Record<string, string> = {
  'LIVE CAMERA': 'border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.4)]',
  'GUEST CAMERA': 'border-blue-400 shadow-[0_0_16px_rgba(96,165,250,0.4)]',
  'NEWS CLIP': 'border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.4)]',
  'FULL VIDEO': 'border-purple-400 shadow-[0_0_16px_rgba(167,139,250,0.4)]',
  'PHOTO SLIDE': 'border-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.4)]',
  'ADVERTISEMENT': 'border-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.4)]',
  'INTRO': 'border-green-400 shadow-[0_0_16px_rgba(74,222,128,0.4)]',
  'OUTRO': 'border-red-400 shadow-[0_0_16px_rgba(248,113,113,0.4)]',
  'BRB': 'border-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.4)]',
};

interface SceneGridProps {
  scenes: OBSScene[];
  currentScene: string;
  transition: TransitionType;
  onSwitchScene: (name: string) => void;
  onSetTransition: (t: TransitionType) => void;
  disabled: boolean;
  enableTransitionPreview?: boolean;
}

const TRANSITIONS: TransitionType[] = ['Cut', 'Fade', 'Swipe', 'Stinger'];

export default function SceneGrid({ scenes, currentScene, transition, onSwitchScene, onSetTransition, disabled, enableTransitionPreview = false }: SceneGridProps) {
  const [previewScene, setPreviewScene] = useState<OBSScene | null>(null);
  const [pendingScene, setPendingScene] = useState<OBSScene | null>(null);

  const fromScene = scenes.find(s => s.sceneName === currentScene) ?? null;

  function handleSceneClick(scene: OBSScene) {
    if (disabled || scene.sceneName === currentScene) return;
    if (enableTransitionPreview && transition !== 'Cut') {
      setPendingScene(scene);
    } else {
      onSwitchScene(scene.sceneName);
    }
  }

  function confirmTransition() {
    if (pendingScene) {
      onSwitchScene(pendingScene.sceneName);
      setPendingScene(null);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-mono-console text-xs tracking-widest text-muted-foreground uppercase">Scenes</h2>
            <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono-console">
              NOW: <span className="text-[hsl(var(--live-red))] font-semibold">{currentScene}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono-console uppercase hidden sm:block">FX:</span>
            <Select value={transition} onValueChange={v => onSetTransition(v as TransitionType)} disabled={disabled}>
              <SelectTrigger className="h-7 w-24 text-xs font-mono-console border-border bg-secondary text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {TRANSITIONS.map(t => (
                  <SelectItem key={t} value={t} className="text-xs font-mono-console text-foreground">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid — 3 columns */}
        <div className="grid grid-cols-3 gap-2">
          {scenes.map((scene, idx) => {
            const Icon = SCENE_ICONS[scene.sceneName] || Camera;
            const isActive = scene.sceneName === currentScene;
            return (
              <div key={scene.sceneName} className="relative group">
                <button
                  onClick={() => handleSceneClick(scene)}
                  disabled={disabled}
                  title={`[${idx + 1}] ${scene.sceneName}`}
                  className={cn(
                    'relative w-full flex flex-col rounded-xl overflow-hidden border-2 transition-all duration-150',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    isActive
                      ? cn('border-2', ACTIVE_RING[scene.sceneName] || 'border-primary')
                      : cn('border-border bg-secondary/20', SCENE_BORDER_COLORS[scene.sceneName] || 'hover:border-primary/50')
                  )}
                >
                  {/* Thumbnail preview */}
                  <div className="relative aspect-video w-full bg-muted overflow-hidden">
                    {scene.previewUrl ? (
                      <img
                        src={scene.previewUrl}
                        alt={scene.sceneName}
                        className={cn(
                          'w-full h-full object-cover transition-all duration-300',
                          isActive ? 'brightness-90' : 'brightness-50 group-hover:brightness-70'
                        )}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/40">
                        <Icon size={16} className="text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Keyboard shortcut badge */}
                    <span className="absolute top-1 left-1 w-4 h-4 rounded text-[8px] font-mono-console bg-black/70 text-muted-foreground flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {/* Active live dot */}
                    {isActive && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[hsl(var(--live-red))] pulse-red" />
                    )}
                  </div>

                  {/* Label */}
                  <div className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5',
                    isActive ? 'bg-secondary/60' : 'bg-secondary/20 group-hover:bg-secondary/40'
                  )}>
                    <Icon size={10} className={cn('shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground')} />
                    <span className={cn(
                      'font-mono-console text-[9px] leading-tight truncate uppercase tracking-wide',
                      isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    )}>
                      {scene.sceneName}
                    </span>
                  </div>
                </button>

                {/* Preview expand button */}
                <button
                  onClick={e => { e.stopPropagation(); setPreviewScene(scene); }}
                  className="absolute bottom-7 right-1 w-5 h-5 rounded bg-black/70 flex items-center justify-center text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Full preview"
                >
                  <Expand size={9} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scene preview modal */}
      <ScenePreviewModal
        scene={previewScene}
        currentScene={currentScene}
        transition={transition}
        onClose={() => setPreviewScene(null)}
        onSwitch={onSwitchScene}
      />

      {/* Transition preview modal */}
      <SceneTransitionPreview
        open={pendingScene !== null}
        fromScene={fromScene}
        toScene={pendingScene}
        transition={transition}
        onConfirm={confirmTransition}
        onCancel={() => setPendingScene(null)}
      />
    </>
  );
}
