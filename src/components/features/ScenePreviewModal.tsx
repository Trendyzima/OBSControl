import { OBSScene, TransitionType } from '@/types/obs';
import { X, Camera, Users, Newspaper, Video, Image, Megaphone, Play, LogOut, Clock, Zap } from 'lucide-react';
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

const SCENE_ACCENTS: Record<string, string> = {
  'LIVE CAMERA': 'from-emerald-900/60 border-emerald-400/40',
  'GUEST CAMERA': 'from-blue-900/60 border-blue-400/40',
  'NEWS CLIP': 'from-amber-900/60 border-amber-400/40',
  'FULL VIDEO': 'from-purple-900/60 border-purple-400/40',
  'PHOTO SLIDE': 'from-cyan-900/60 border-cyan-400/40',
  'ADVERTISEMENT': 'from-orange-900/60 border-orange-400/40',
  'INTRO': 'from-green-900/60 border-green-400/40',
  'OUTRO': 'from-red-900/60 border-red-400/40',
  'BRB': 'from-yellow-900/60 border-yellow-400/40',
};

const SCENE_BTN_COLORS: Record<string, string> = {
  'LIVE CAMERA': 'bg-emerald-600 hover:bg-emerald-700',
  'GUEST CAMERA': 'bg-blue-600 hover:bg-blue-700',
  'NEWS CLIP': 'bg-amber-600 hover:bg-amber-700',
  'FULL VIDEO': 'bg-purple-600 hover:bg-purple-700',
  'PHOTO SLIDE': 'bg-cyan-600 hover:bg-cyan-700',
  'ADVERTISEMENT': 'bg-orange-600 hover:bg-orange-700',
  'INTRO': 'bg-green-600 hover:bg-green-700',
  'OUTRO': 'bg-red-600 hover:bg-red-700',
  'BRB': 'bg-yellow-600 hover:bg-yellow-700',
};

interface ScenePreviewModalProps {
  scene: OBSScene | null;
  currentScene: string;
  transition: TransitionType;
  onClose: () => void;
  onSwitch: (name: string) => void;
}

export default function ScenePreviewModal({ scene, currentScene, transition, onClose, onSwitch }: ScenePreviewModalProps) {
  if (!scene) return null;

  const Icon = SCENE_ICONS[scene.sceneName] || Camera;
  const isActive = scene.sceneName === currentScene;
  const accent = SCENE_ACCENTS[scene.sceneName] || 'from-gray-900/60 border-gray-400/40';
  const btnColor = SCENE_BTN_COLORS[scene.sceneName] || 'bg-primary hover:bg-primary/90';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={cn(
        'relative z-10 w-full max-w-2xl rounded-2xl border bg-[hsl(var(--card))] overflow-hidden shadow-2xl',
        'bg-gradient-to-b',
        accent
      )}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>

        {/* Preview image — full width */}
        <div className="relative aspect-video w-full bg-black overflow-hidden">
          {scene.previewUrl ? (
            <img
              src={scene.previewUrl}
              alt={scene.sceneName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon size={64} className="text-muted-foreground/20" />
            </div>
          )}

          {/* Live overlay */}
          {isActive && (
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--live-red))]/90 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-white pulse-red" />
              <span className="font-mono-console text-xs font-semibold text-white tracking-widest">LIVE</span>
            </div>
          )}

          {/* Scene number */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 backdrop-blur-sm">
            <Zap size={10} className="text-muted-foreground" />
            <span className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider">
              {transition} transition
            </span>
          </div>
        </div>

        {/* Info panel */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              isActive ? 'bg-[hsl(var(--live-red))]/20' : 'bg-secondary'
            )}>
              <Icon size={18} className={isActive ? 'text-[hsl(var(--live-red))]' : 'text-muted-foreground'} />
            </div>
            <div className="min-w-0">
              <h2 className="font-mono-console text-base font-semibold text-foreground tracking-widest uppercase truncate">
                {scene.sceneName}
              </h2>
              <p className="font-mono-console text-[10px] text-muted-foreground mt-0.5">
                {isActive ? '● Currently live' : 'Ready to switch'}
              </p>
            </div>
          </div>

          {isActive ? (
            <div className="px-4 py-2 rounded-xl border border-[hsl(var(--live-red))]/40 bg-[hsl(var(--live-red))]/10 font-mono-console text-xs text-[hsl(var(--live-red))] shrink-0">
              ACTIVE SCENE
            </div>
          ) : (
            <button
              onClick={() => { onSwitch(scene.sceneName); onClose(); }}
              className={cn(
                'px-5 py-2.5 rounded-xl font-mono-console text-xs font-semibold text-white transition-all active:scale-95 shrink-0',
                btnColor
              )}
            >
              Switch to Scene →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
