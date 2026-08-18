import { useState, useEffect, useCallback } from 'react';
import { Layers, Eye, EyeOff, Volume2, VolumeX, RefreshCw, ChevronRight, Camera, Film, Image, Music, Monitor, Globe, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface SceneSource {
  id: number;
  name: string;
  kind: string;
  visible: boolean;
  locked: boolean;
  volume?: number; // 0–100, only for audio sources
}

interface OBSSourceEditorProps {
  currentScene: string;
  disabled: boolean;
  isRealOBS: boolean;
  onLogEvent?: (msg: string, category?: string) => void;
}

// Mock sources for demo mode
function getMockSources(scene: string): SceneSource[] {
  const base: SceneSource[] = [
    { id: 1, name: 'Main Camera', kind: 'dshow_input', visible: true, locked: false, volume: 80 },
    { id: 2, name: 'Podcast Logo', kind: 'image_source', visible: true, locked: true },
    { id: 3, name: 'Lower Third', kind: 'browser_source', visible: false, locked: false },
    { id: 4, name: 'Background Music', kind: 'wasapi_output_capture', visible: true, locked: false, volume: 30 },
  ];
  const extras: Record<string, SceneSource[]> = {
    'NEWS CLIP': [{ id: 5, name: 'NewsVideo.mp4', kind: 'ffmpeg_source', visible: true, locked: false }],
    'GUEST CAMERA': [{ id: 5, name: 'Guest Cam', kind: 'dshow_input', visible: true, locked: false, volume: 75 }],
    'ADVERTISEMENT': [{ id: 5, name: 'AdVideo.mp4', kind: 'ffmpeg_source', visible: true, locked: false }],
    'PHOTO SLIDE': [{ id: 5, name: 'SlideImage.png', kind: 'image_source', visible: true, locked: false }],
  };
  return [...base, ...(extras[scene] || [])];
}

const KIND_ICONS: Record<string, React.ElementType> = {
  dshow_input: Camera,
  ffmpeg_source: Film,
  image_source: Image,
  wasapi_output_capture: Volume2,
  wasapi_input_capture: Music,
  browser_source: Globe,
  screen_capture: Monitor,
  text_gdiplus: Type,
  text_ft2_source: Type,
};

const KIND_LABELS: Record<string, string> = {
  dshow_input: 'Video Capture',
  ffmpeg_source: 'Media Source',
  image_source: 'Image',
  wasapi_output_capture: 'Audio Output',
  wasapi_input_capture: 'Audio Input',
  browser_source: 'Browser',
  screen_capture: 'Screen Capture',
  text_gdiplus: 'Text (GDI+)',
  text_ft2_source: 'Text (FT2)',
};

export default function OBSSourceEditor({ currentScene, disabled, isRealOBS, onLogEvent }: OBSSourceEditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [sources, setSources] = useState<SceneSource[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSources = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setSources(getMockSources(currentScene));
      setLoading(false);
    }, 300);
  }, [currentScene]);

  useEffect(() => { loadSources(); }, [loadSources]);

  const toggleVisibility = (id: number) => {
    setSources(prev => prev.map(s => {
      if (s.id !== id) return s;
      const next = { ...s, visible: !s.visible };
      onLogEvent?.(`Source ${next.visible ? 'shown' : 'hidden'}: ${next.name}`, 'scene');
      toast(`${next.name}: ${next.visible ? 'visible' : 'hidden'}`, { duration: 1200 });
      return next;
    }));
  };

  const setSourceVolume = (id: number, volume: number) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, volume } : s));
  };

  const isAudioKind = (kind: string) =>
    kind.includes('wasapi') || kind.includes('audio') || kind.includes('alsa') || kind.includes('pulse');

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 h-11 border-b border-border cursor-pointer hover:bg-secondary/10 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        <ChevronRight size={13} className={cn('text-muted-foreground transition-transform shrink-0', !collapsed && 'rotate-90')} />
        <Layers size={12} className="text-muted-foreground shrink-0" />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          Source Editor
        </span>
        <span className="font-mono-console text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
          {currentScene}
        </span>
        <button
          onClick={e => { e.stopPropagation(); loadSources(); }}
          disabled={loading}
          className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          title="Refresh sources"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {!collapsed && (
        <div className="divide-y divide-border/50">
          {sources.length === 0 && (
            <div className="flex items-center justify-center py-6 text-muted-foreground/40 font-mono-console text-xs">
              No sources found
            </div>
          )}

          {sources.map(src => {
            const Icon = KIND_ICONS[src.kind] || Layers;
            const isAudio = isAudioKind(src.kind) || typeof src.volume === 'number';
            return (
              <div
                key={src.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 transition-colors',
                  !src.visible ? 'opacity-40' : 'hover:bg-secondary/10'
                )}
              >
                {/* Icon + kind */}
                <div className="w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-muted-foreground" />
                </div>

                {/* Name + type */}
                <div className="flex-1 min-w-0">
                  <p className="font-mono-console text-[10px] text-foreground truncate">{src.name}</p>
                  <p className="font-mono-console text-[8px] text-muted-foreground/50 uppercase tracking-wider mt-0.5">
                    {KIND_LABELS[src.kind] || src.kind}
                  </p>
                </div>

                {/* Volume slider for audio sources */}
                {isAudio && typeof src.volume === 'number' && (
                  <div className="flex items-center gap-1.5 w-20 shrink-0">
                    <Volume2 size={9} className="text-muted-foreground/40 shrink-0" />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={src.volume}
                      disabled={disabled}
                      onChange={e => setSourceVolume(src.id, Number(e.target.value))}
                      className="w-full h-1 accent-emerald-400"
                    />
                  </div>
                )}

                {/* Visibility toggle */}
                <button
                  onClick={() => !disabled && !src.locked && toggleVisibility(src.id)}
                  disabled={disabled || src.locked}
                  title={src.locked ? 'Source is locked' : src.visible ? 'Hide source' : 'Show source'}
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-lg transition-colors shrink-0',
                    src.locked
                      ? 'opacity-30 cursor-not-allowed'
                      : src.visible
                        ? 'text-emerald-400 hover:bg-emerald-400/10'
                        : 'text-muted-foreground/40 hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {src.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
              </div>
            );
          })}

          {/* Demo mode notice */}
          {!isRealOBS && (
            <div className="px-3 py-2 flex items-center gap-2">
              <span className="font-mono-console text-[8px] text-muted-foreground/40 uppercase tracking-wider">
                Demo mode — connect to OBS for live sources
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
