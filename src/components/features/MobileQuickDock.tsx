import { OBSScene, StreamStatus, AudioSource } from '@/types/obs';
import { Camera, Users, Newspaper, Video, Image, Megaphone, Play, LogOut, Clock, Square, Circle, Monitor, Mic, Mic2 } from 'lucide-react';
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

const SCENE_COLORS: Record<string, string> = {
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

const SCENE_COLORS_INACTIVE: Record<string, string> = {
  'LIVE CAMERA': 'border-emerald-500/40 text-emerald-300',
  'GUEST CAMERA': 'border-blue-500/40 text-blue-300',
  'NEWS CLIP': 'border-amber-500/40 text-amber-300',
  'FULL VIDEO': 'border-purple-500/40 text-purple-300',
  'PHOTO SLIDE': 'border-cyan-500/40 text-cyan-300',
  'ADVERTISEMENT': 'border-orange-500/40 text-orange-300',
  'INTRO': 'border-green-500/40 text-green-300',
  'OUTRO': 'border-red-500/40 text-red-300',
  'BRB': 'border-yellow-500/40 text-yellow-300',
};

interface MobileQuickDockProps {
  scenes: OBSScene[];
  currentScene: string;
  streamStatus: StreamStatus;
  audioSources: AudioSource[];
  disabled: boolean;
  onSwitchScene: (name: string) => void;
  onToggleStream: () => void;
  onToggleRecord: () => void;
  onToggleMute: (id: string) => void;
}

export default function MobileQuickDock({
  scenes,
  currentScene,
  streamStatus,
  audioSources,
  disabled,
  onSwitchScene,
  onToggleStream,
  onToggleRecord,
  onToggleMute,
}: MobileQuickDockProps) {
  const hostMic = audioSources.find(s => s.type === 'microphone');
  const guestMic = audioSources.find(s => s.type === 'guest');

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[hsl(220,22%,6%)]/95 backdrop-blur-md border-t border-border safe-bottom">
      {/* Scene quick switcher */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {scenes.map(scene => {
            const Icon = SCENE_ICONS[scene.sceneName] || Camera;
            const isActive = scene.sceneName === currentScene;
            return (
              <button
                key={scene.sceneName}
                onClick={() => !disabled && onSwitchScene(scene.sceneName)}
                disabled={disabled}
                className={cn(
                  'flex flex-col items-center gap-1 min-w-[60px] px-2 py-2.5 rounded-xl border transition-all active:scale-95 shrink-0',
                  isActive
                    ? cn(SCENE_COLORS[scene.sceneName] || 'bg-primary', 'border-transparent text-white shadow-lg')
                    : cn('border bg-secondary/40 backdrop-blur-sm', SCENE_COLORS_INACTIVE[scene.sceneName] || 'border-border text-muted-foreground'),
                  disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Icon size={18} />
                <span className="font-mono-console text-[7px] uppercase tracking-wide leading-tight text-center whitespace-nowrap">
                  {scene.sceneName.replace(' ', '\n')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control row */}
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        {/* Mic mute buttons */}
        <div className="flex gap-2">
          {hostMic && (
            <button
              onClick={() => !disabled && onToggleMute(hostMic.id)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-0.5 w-14 h-12 rounded-xl border transition-all active:scale-95',
                hostMic.muted
                  ? 'border-red-500/60 bg-red-500/15 text-red-400'
                  : 'border-border bg-secondary/40 text-muted-foreground'
              )}
            >
              <Mic size={16} className="mt-1.5" />
              <span className="font-mono-console text-[7px] uppercase">{hostMic.muted ? 'MUTED' : 'HOST'}</span>
            </button>
          )}
          {guestMic && (
            <button
              onClick={() => !disabled && onToggleMute(guestMic.id)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-0.5 w-14 h-12 rounded-xl border transition-all active:scale-95',
                guestMic.muted
                  ? 'border-red-500/60 bg-red-500/15 text-red-400'
                  : 'border-border bg-secondary/40 text-muted-foreground'
              )}
            >
              <Mic2 size={16} className="mt-1.5" />
              <span className="font-mono-console text-[7px] uppercase">{guestMic.muted ? 'MUTED' : 'GUEST'}</span>
            </button>
          )}
        </div>

        {/* Status */}
        <div className="flex-1 flex flex-col items-center">
          {streamStatus.streaming ? (
            <>
              <span className="font-mono-console text-[10px] text-[hsl(var(--live-red))] font-semibold pulse-red">● LIVE</span>
              <span className="font-mono-console text-[9px] text-muted-foreground tabular-nums">{streamStatus.duration}</span>
            </>
          ) : (
            <span className="font-mono-console text-[10px] text-muted-foreground">● OFF AIR</span>
          )}
        </div>

        {/* Record + Stream buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => !disabled && onToggleRecord()}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center gap-0.5 w-14 h-12 rounded-xl border transition-all active:scale-95',
              streamStatus.recording
                ? 'border-amber-500/60 bg-amber-500/15 text-amber-400'
                : 'border-border bg-secondary/40 text-muted-foreground'
            )}
          >
            <Circle size={16} className={cn('mt-1.5', streamStatus.recording && 'fill-amber-400 text-amber-400')} />
            <span className="font-mono-console text-[7px] uppercase">{streamStatus.recording ? 'STOP' : 'REC'}</span>
          </button>

          <button
            onClick={() => !disabled && onToggleStream()}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center gap-0.5 w-16 h-12 rounded-xl border transition-all active:scale-95',
              streamStatus.streaming
                ? 'border-[hsl(var(--live-red))]/60 bg-[hsl(var(--live-red))]/20 text-[hsl(var(--live-red))]'
                : 'border-emerald-500/60 bg-emerald-600/20 text-emerald-400'
            )}
          >
            <Square size={16} className={cn('mt-1.5', streamStatus.streaming && 'fill-[hsl(var(--live-red))]')} />
            <span className="font-mono-console text-[7px] uppercase font-semibold">{streamStatus.streaming ? 'STOP' : 'GO LIVE'}</span>
          </button>
        </div>
      </div>

      {/* Safe area spacer */}
      <div className="h-safe-bottom" />
    </div>
  );
}
