import { useRef, useEffect, useState } from 'react';
import { Grid, Camera, Monitor, Users } from 'lucide-react';
import { StudioScene } from '@/types/studio';
import { cn } from '@/lib/utils';

interface MultiCameraGridProps {
  scenes: StudioScene[];
  currentSceneId: string;
  previewSceneId: string;
  cameraStream: MediaStream | null;
  pipStream: MediaStream | null;
  guestStream: MediaStream | null;
  onSwitch: (id: string) => void;
  onPreview: (id: string) => void;
}

interface FeedTile {
  id: string;
  label: string;
  type: 'canvas' | 'stream' | 'scene';
  stream?: MediaStream | null;
  sceneId?: string;
  icon: React.ElementType;
  color: string;
}

export default function MultiCameraGrid({
  scenes, currentSceneId, previewSceneId,
  cameraStream, pipStream, guestStream,
  onSwitch, onPreview
}: MultiCameraGridProps) {
  const [cols, setCols] = useState<2 | 3>(3);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const [activeFeedId, setActiveFeedId] = useState<string | null>(null);

  // Build feed tiles from live streams + key scenes
  const feeds: FeedTile[] = [];

  if (cameraStream) {
    feeds.push({ id: 'main-cam', label: 'Main Camera', type: 'stream', stream: cameraStream, icon: Camera, color: 'emerald' });
  }
  if (pipStream) {
    feeds.push({ id: 'pip-cam', label: 'PiP Camera', type: 'stream', stream: pipStream, icon: Camera, color: 'blue' });
  }
  if (guestStream) {
    feeds.push({ id: 'guest-feed', label: 'Guest', type: 'stream', stream: guestStream, icon: Users, color: 'purple' });
  }

  // Add key scenes (camera + first video)
  scenes.filter(s => s.sourceType === 'camera' || s.sourceType === 'video' || s.sourceType === 'color').slice(0, 6).forEach(scene => {
    feeds.push({
      id: `scene-${scene.id}`,
      label: scene.name,
      type: 'scene',
      sceneId: scene.id,
      icon: Monitor,
      color: scene.id === currentSceneId ? 'red' : 'gray',
    });
  });

  // Attach streams to video elements
  useEffect(() => {
    feeds.forEach(feed => {
      const el = videoRefs.current[feed.id];
      if (!el || feed.type !== 'stream' || !feed.stream) return;
      if (el.srcObject !== feed.stream) {
        el.srcObject = feed.stream;
        el.play().catch(() => {});
      }
    });
  });

  const COLORS: Record<string, { border: string; badge: string; label: string }> = {
    emerald: { border: 'border-emerald-500', badge: 'bg-emerald-600/90', label: 'text-emerald-400' },
    blue:    { border: 'border-blue-500', badge: 'bg-blue-600/90', label: 'text-blue-400' },
    purple:  { border: 'border-purple-500', badge: 'bg-purple-600/90', label: 'text-purple-400' },
    red:     { border: 'border-red-500', badge: 'bg-red-600/90', label: 'text-red-400' },
    gray:    { border: 'border-border', badge: 'bg-black/60', label: 'text-muted-foreground' },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Grid size={11} /> Multi-Camera Monitor
        </h3>
        <div className="flex gap-1">
          {([2, 3] as const).map(n => (
            <button key={n} onClick={() => setCols(n)}
              className={cn('w-7 h-7 flex items-center justify-center rounded-lg border font-mono-console text-[9px] transition-colors',
                cols === n ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
              {n}×
            </button>
          ))}
        </div>
      </div>

      {feeds.length === 0 && (
        <div className="text-center py-8 font-mono-console text-[10px] text-muted-foreground/40 space-y-1">
          <Grid size={24} className="mx-auto mb-2 opacity-30" />
          <p>No live feeds</p>
          <p className="text-[9px]">Start your camera to see feeds here</p>
        </div>
      )}

      {feeds.length > 0 && (
        <div className={cn('grid gap-2', cols === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
          {feeds.map(feed => {
            const isPgm = feed.sceneId === currentSceneId;
            const isPvw = feed.sceneId === previewSceneId;
            const colorKey = isPgm ? 'red' : feed.color;
            const c = COLORS[colorKey] || COLORS.gray;
            const Icon = feed.icon;

            return (
              <div
                key={feed.id}
                className={cn('relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all active:scale-[0.96]',
                  isPgm ? 'border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.4)]' :
                  isPvw ? 'border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                  activeFeedId === feed.id ? c.border : 'border-border hover:border-border/80'
                )}
                onClick={() => {
                  setActiveFeedId(feed.id);
                  if (feed.sceneId) onPreview(feed.sceneId);
                }}
                onDoubleClick={() => {
                  if (feed.sceneId) onSwitch(feed.sceneId);
                }}
                title="Tap → Preview  ·  Double-tap → Program"
              >
                {/* Video or scene preview */}
                <div className="aspect-video bg-black/80 relative">
                  {feed.type === 'stream' && feed.stream ? (
                    <video
                      ref={el => { videoRefs.current[feed.id] = el; }}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                  ) : feed.type === 'scene' ? (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                      {(() => {
                        const scene = scenes.find(s => s.id === feed.sceneId);
                        if (scene?.thumbnail) {
                          return <img src={scene.thumbnail} className="w-full h-full object-cover" alt={scene.name} />;
                        }
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">{scenes.find(s => s.id === feed.sceneId)?.icon || '🎬'}</span>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon size={18} className="text-muted-foreground/40" />
                    </div>
                  )}

                  {/* Source badge */}
                  <div className={cn('absolute top-1 left-1 px-1.5 py-0.5 rounded font-mono-console text-[7px] font-bold text-white', c.badge)}>
                    {isPgm ? 'PGM' : isPvw ? 'PVW' : feed.type === 'stream' ? 'LIVE' : 'SCN'}
                  </div>

                  {/* Live pulse */}
                  {feed.type === 'stream' && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>

                {/* Label */}
                <div className="px-1.5 py-1 bg-black/40">
                  <p className={cn('font-mono-console text-[8px] font-semibold uppercase tracking-wide truncate', c.label)}>
                    {feed.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="font-mono-console text-[8px] text-muted-foreground/30 text-center">
        Tap → Preview  ·  Double-tap → Program immediately
      </p>
    </div>
  );
}
