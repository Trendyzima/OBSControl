import { useState } from 'react';
import { StudioScene, SceneSourceType, PiPSource } from '@/types/studio';
import { Plus, Trash2, Camera, Video, Image, Square, Type, Aperture, FlipHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SceneSwitcherProps {
  scenes: StudioScene[];
  currentSceneId: string;
  previewSceneId: string;
  onSwitch: (id: string) => void;
  onPreview: (id: string) => void;
  onAdd: (scene: Omit<StudioScene, 'id'>) => string;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<StudioScene>) => void;
  onCaptureThumbnail: (id: string) => void;
  pip: PiPSource;
  onPipChange: (p: Partial<PiPSource>) => void;
  onStartPip: () => void;
  onStopPip: () => void;
  pipActive: boolean;
}

const SOURCE_ICONS: Record<SceneSourceType, React.ElementType> = {
  camera: Camera, video: Video, image: Image, color: Square, text: Type,
};

const CATEGORY_COLORS: Record<string, { border: string; bg: string; badge: string }> = {
  main:       { border: 'border-emerald-500', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500/20 text-emerald-400' },
  ad:         { border: 'border-amber-500', bg: 'bg-amber-500/10', badge: 'bg-amber-500/20 text-amber-400' },
  transition: { border: 'border-blue-500', bg: 'bg-blue-500/10', badge: 'bg-blue-500/20 text-blue-400' },
  graphics:   { border: 'border-purple-500', bg: 'bg-purple-500/10', badge: 'bg-purple-500/20 text-purple-400' },
};

const PGM_GLOW = 'border-red-500 shadow-[0_0_14px_rgba(220,38,38,0.5)] bg-red-500/15';
const PVW_GLOW = 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] bg-emerald-500/10';

const SOURCE_TYPES: { type: SceneSourceType; label: string; icon: React.ElementType }[] = [
  { type: 'camera', label: 'Camera', icon: Camera },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'color', label: 'Color', icon: Square },
];

const CATEGORY_TABS = ['all', 'main', 'ad', 'graphics', 'transition'] as const;

export default function SceneSwitcher({
  scenes, currentSceneId, previewSceneId, onSwitch, onPreview, onAdd, onDelete, onUpdate,
  onCaptureThumbnail, pip, onPipChange, onStartPip, onStopPip, pipActive
}: SceneSwitcherProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<SceneSourceType>('camera');
  const [newCategory, setNewCategory] = useState<StudioScene['category']>('main');
  const [filterCat, setFilterCat] = useState<typeof CATEGORY_TABS[number]>('all');

  const filtered = filterCat === 'all' ? scenes : scenes.filter(s => (s.category || 'main') === filterCat);

  function handleAdd() {
    if (!newName.trim()) return;
    onAdd({
      name: newName.trim().toUpperCase(),
      sourceType: newType,
      category: newCategory,
      icon: newType === 'camera' ? '🎥' : newType === 'video' ? '🎬' : newType === 'image' ? '🖼' : '⬛',
      bgColor: '#0d0d1a',
      overlays: [],
    });
    setNewName('');
    setAdding(false);
    toast.success('Scene added');
  }

  return (
    <div className="space-y-2">
      {/* Category filter tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {CATEGORY_TABS.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={cn(
              'flex-shrink-0 px-2.5 py-1 rounded-lg border font-mono-console text-[9px] uppercase tracking-wide transition-colors',
              filterCat === cat ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Scene grid */}
      <div className="grid grid-cols-3 gap-2">
        {filtered.map(scene => {
          const Icon = SOURCE_ICONS[scene.sourceType];
          const isPgm = scene.id === currentSceneId;
          const isPvw = scene.id === previewSceneId;
          const catColors = CATEGORY_COLORS[scene.category || 'main'];
          const sceneIdx = scenes.indexOf(scene);

          return (
            <div key={scene.id} className="relative group">
              {/* Long-press to preview, tap to send to PGM */}
              <button
                onClick={() => onPreview(scene.id)}
                onDoubleClick={() => onSwitch(scene.id)}
                className={cn(
                  'w-full text-left p-2 rounded-xl border-2 transition-all duration-100 active:scale-[0.96]',
                  isPgm ? PGM_GLOW : isPvw ? PVW_GLOW : 'border-border bg-secondary/20 hover:bg-secondary/40'
                )}
              >
                {/* Thumbnail */}
                <div className="aspect-video rounded-lg mb-1.5 overflow-hidden relative bg-black/40">
                  {scene.thumbnail ? (
                    <img src={scene.thumbnail} className="w-full h-full object-cover" alt={scene.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: scene.bgColor || '#0d0d1a' }}>
                      <span className="text-xl">{scene.icon}</span>
                    </div>
                  )}
                  {isPgm && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse border border-black" />}
                  {isPvw && !isPgm && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 border border-black" />}
                  {/* Status badges */}
                  {isPgm && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-600/80 py-0.5">
                      <span className="font-mono-console text-[7px] text-white font-bold tracking-widest text-center block">PGM</span>
                    </div>
                  )}
                  {isPvw && !isPgm && (
                    <div className="absolute bottom-0 left-0 right-0 bg-emerald-600/80 py-0.5">
                      <span className="font-mono-console text-[7px] text-white font-bold tracking-widest text-center block">PVW</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Icon size={9} className={cn('shrink-0', isPgm ? 'text-red-400' : 'text-muted-foreground')} />
                  <span className={cn(
                    'font-mono-console text-[9px] uppercase tracking-wide font-semibold truncate',
                    isPgm ? 'text-red-400' : isPvw ? 'text-emerald-400' : 'text-muted-foreground'
                  )}>
                    {scene.name}
                  </span>
                </div>
              </button>

              {/* Actions overlay */}
              <div className="absolute top-1.5 left-1.5 hidden group-hover:flex gap-0.5 z-10">
                <button
                  onClick={e => { e.stopPropagation(); onCaptureThumbnail(scene.id); }}
                  className="w-5 h-5 rounded flex items-center justify-center bg-black/70 text-muted-foreground hover:text-amber-400 transition-colors"
                  title="Capture thumbnail"
                >
                  <Aperture size={9} />
                </button>
                {sceneIdx >= 4 && (
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(scene.id); }}
                    className="w-5 h-5 rounded flex items-center justify-center bg-black/70 text-muted-foreground hover:text-red-400 transition-colors"
                    title="Delete scene"
                  >
                    <Trash2 size={9} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add scene */}
        <button
          onClick={() => setAdding(true)}
          className="aspect-[4/3] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus size={16} />
          <span className="font-mono-console text-[8px] mt-1 uppercase">Add</span>
        </button>
      </div>

      {/* Hint */}
      <p className="font-mono-console text-[8px] text-muted-foreground/40 text-center">Tap → Preview  ·  Double-tap → Program  ·  Hover → Capture</p>

      {/* PiP controls */}
      <div className="p-2.5 rounded-xl border border-border bg-secondary/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono-console text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FlipHorizontal size={11} />
            Picture-in-Picture
          </span>
          <button
            onClick={pip.enabled ? onStopPip : onStartPip}
            className={cn(
              'px-2.5 py-1 rounded-lg border font-mono-console text-[9px] transition-colors',
              pip.enabled ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {pip.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
        {pip.enabled && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-mono-console text-[8px] text-muted-foreground uppercase block mb-1">Position</label>
              <select
                value={pip.position}
                onChange={e => onPipChange({ position: e.target.value as PiPSource['position'] })}
                className="w-full bg-input border border-border rounded px-2 py-1.5 font-mono-console text-[10px] text-foreground focus:outline-none"
              >
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>
            <div>
              <label className="font-mono-console text-[8px] text-muted-foreground uppercase block mb-1">Size: {pip.size}%</label>
              <input type="range" min={15} max={40} value={pip.size} onChange={e => onPipChange({ size: Number(e.target.value) })} className="w-full accent-primary h-1 mt-2" />
            </div>
          </div>
        )}
      </div>

      {/* Add scene form */}
      {adding && (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
          <p className="font-mono-console text-[10px] text-muted-foreground uppercase tracking-wider">New Scene</p>
          <input
            autoFocus
            type="text"
            placeholder="Scene name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
          />
          <div className="grid grid-cols-4 gap-1">
            {SOURCE_TYPES.map(t => (
              <button key={t.type} onClick={() => setNewType(t.type)}
                className={cn('flex flex-col items-center gap-1 py-2 rounded-lg border text-[9px] font-mono-console transition-colors',
                  newType === t.type ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                )}>
                <t.icon size={11} />{t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {(['main', 'ad', 'graphics', 'transition'] as const).map(cat => (
              <button key={cat} onClick={() => setNewCategory(cat)}
                className={cn('py-1 rounded-lg border font-mono-console text-[9px] transition-colors capitalize',
                  newCategory === cat ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                )}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-1.5 rounded-lg border border-border font-mono-console text-xs text-muted-foreground">Cancel</button>
            <button onClick={handleAdd} disabled={!newName.trim()} className="flex-1 py-1.5 rounded-lg bg-primary text-white font-mono-console text-xs font-semibold disabled:opacity-40">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}
