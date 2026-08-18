import { useState, useEffect } from 'react';
import { OBSScene } from '@/types/obs';
import { Grid3x3, RefreshCw, Camera, Users, Newspaper, Video, Image, Megaphone, Play, LogOut, Clock } from 'lucide-react';
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
  'LIVE CAMERA': 'ring-emerald-400',
  'GUEST CAMERA': 'ring-blue-400',
  'NEWS CLIP': 'ring-amber-400',
  'FULL VIDEO': 'ring-purple-400',
  'PHOTO SLIDE': 'ring-cyan-400',
  'ADVERTISEMENT': 'ring-orange-400',
  'INTRO': 'ring-green-400',
  'OUTRO': 'ring-red-400',
  'BRB': 'ring-yellow-400',
};

interface MultiViewMonitorProps {
  scenes: OBSScene[];
  currentScene: string;
  disabled: boolean;
  onSwitchScene: (name: string) => void;
}

export default function MultiViewMonitor({ scenes, currentScene, disabled, onSwitchScene }: MultiViewMonitorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setRefreshing(false), 600);
  }

  // Auto-refresh every 10s
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey(k => k + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 h-11 border-b border-border cursor-pointer hover:bg-secondary/10 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        <Grid3x3 size={12} className="text-muted-foreground shrink-0" />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          Multi-View Monitor
        </span>
        <span className="font-mono-console text-[9px] text-muted-foreground/50 shrink-0">
          Click thumbnail to switch
        </span>
        <button
          onClick={e => { e.stopPropagation(); handleRefresh(); }}
          className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          title="Refresh all thumbnails"
        >
          <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-3">
          {/* 3x3 grid */}
          <div className="grid grid-cols-3 gap-2">
            {scenes.slice(0, 9).map(scene => {
              const isActive = scene.sceneName === currentScene;
              const Icon = SCENE_ICONS[scene.sceneName] || Camera;
              const ringColor = SCENE_ACCENTS[scene.sceneName] || 'ring-primary';

              return (
                <button
                  key={`${scene.sceneName}-${refreshKey}`}
                  onClick={() => !disabled && onSwitchScene(scene.sceneName)}
                  disabled={disabled}
                  title={scene.sceneName}
                  className={cn(
                    'relative group rounded-lg overflow-hidden border-2 transition-all duration-150',
                    'focus:outline-none focus:ring-1 focus:ring-primary/50',
                    isActive
                      ? cn('border-transparent ring-2', ringColor)
                      : 'border-border hover:border-border/80',
                    disabled && 'cursor-not-allowed opacity-40'
                  )}
                >
                  {/* Preview thumbnail */}
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    {scene.previewUrl ? (
                      <img
                        src={`${scene.previewUrl}&t=${refreshKey}`}
                        alt={scene.sceneName}
                        className={cn(
                          'w-full h-full object-cover transition-all duration-300',
                          isActive ? 'brightness-100' : 'brightness-55 group-hover:brightness-75'
                        )}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                        <Icon size={20} className="text-muted-foreground/20" />
                      </div>
                    )}

                    {/* Switch overlay */}
                    {!isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="px-2 py-1 rounded bg-white/10 backdrop-blur-sm font-mono-console text-[9px] text-white">
                          Switch
                        </div>
                      </div>
                    )}

                    {/* Live badge */}
                    {isActive && (
                      <div className="absolute top-1 left-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-[hsl(var(--live-red))]/90 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white pulse-red" />
                        <span className="font-mono-console text-[7px] font-bold text-white leading-none">LIVE</span>
                      </div>
                    )}
                  </div>

                  {/* Scene label */}
                  <div className={cn(
                    'px-1.5 py-1 flex items-center gap-1',
                    isActive ? 'bg-secondary/60' : 'bg-secondary/20'
                  )}>
                    <Icon size={8} className={isActive ? 'text-foreground shrink-0' : 'text-muted-foreground/50 shrink-0'} />
                    <span className={cn(
                      'font-mono-console text-[7px] uppercase tracking-wide truncate leading-tight',
                      isActive ? 'text-foreground font-semibold' : 'text-muted-foreground/60'
                    )}>
                      {scene.sceneName}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Padding for fewer than 9 scenes */}
            {Array.from({ length: Math.max(0, 9 - scenes.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-video rounded-lg border border-border/20 bg-secondary/5" />
            ))}
          </div>

          <p className="font-mono-console text-[8px] text-muted-foreground/30 text-center mt-2">
            Auto-refreshes every 10s · {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
