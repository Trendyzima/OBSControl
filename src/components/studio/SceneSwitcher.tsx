import { useState } from 'react';
import { StudioScene, SceneSourceType } from '@/types/studio';
import { Plus, Trash2, Camera, Video, Image, Square, Type, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SceneSwitcherProps {
  scenes: StudioScene[];
  currentSceneId: string;
  onSwitch: (id: string) => void;
  onAdd: (scene: Omit<StudioScene, 'id'>) => string;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<StudioScene>) => void;
}

const SOURCE_ICONS: Record<SceneSourceType, React.ElementType> = {
  camera: Camera,
  video: Video,
  image: Image,
  color: Square,
  text: Type,
};

const SCENE_COLORS: Record<string, string> = {
  'CAMERA': 'border-emerald-500/70 shadow-[0_0_14px_rgba(16,185,129,0.35)]',
  'VIDEO': 'border-purple-500/70 shadow-[0_0_14px_rgba(168,85,247,0.35)]',
  'PHOTO': 'border-cyan-500/70 shadow-[0_0_14px_rgba(6,182,212,0.35)]',
  'INTRO': 'border-blue-500/70 shadow-[0_0_14px_rgba(59,130,246,0.35)]',
  'BRB': 'border-amber-500/70 shadow-[0_0_14px_rgba(245,158,11,0.35)]',
  'AD BREAK': 'border-orange-500/70 shadow-[0_0_14px_rgba(249,115,22,0.35)]',
  'OUTRO': 'border-teal-500/70 shadow-[0_0_14px_rgba(20,184,166,0.35)]',
};

const SCENE_BG: Record<string, string> = {
  'CAMERA': 'bg-emerald-500/10',
  'VIDEO': 'bg-purple-500/10',
  'PHOTO': 'bg-cyan-500/10',
  'INTRO': 'bg-blue-500/10',
  'BRB': 'bg-amber-500/10',
  'AD BREAK': 'bg-orange-500/10',
  'OUTRO': 'bg-teal-500/10',
};

const SOURCE_TYPES: { type: SceneSourceType; label: string; icon: React.ElementType }[] = [
  { type: 'camera', label: 'Camera', icon: Camera },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'color', label: 'Color Bg', icon: Square },
];

export default function SceneSwitcher({
  scenes, currentSceneId, onSwitch, onAdd, onDelete, onUpdate
}: SceneSwitcherProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<SceneSourceType>('camera');

  function handleAdd() {
    if (!newName.trim()) return;
    onAdd({
      name: newName.trim().toUpperCase(),
      sourceType: newType,
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
      {/* Scene grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
        {scenes.map((scene) => {
          const Icon = SOURCE_ICONS[scene.sourceType];
          const isActive = scene.id === currentSceneId;
          const activeBorder = SCENE_COLORS[scene.name] || 'border-primary/60 shadow-[0_0_14px_rgba(220,38,38,0.35)]';
          const activeBg = SCENE_BG[scene.name] || 'bg-primary/10';

          return (
            <div key={scene.id} className="relative group">
              <button
                onClick={() => onSwitch(scene.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border-2 transition-all duration-150 active:scale-[0.97]',
                  isActive
                    ? cn('border-2', activeBorder, activeBg)
                    : 'border-border bg-secondary/20 hover:bg-secondary/40 hover:border-border/70'
                )}
              >
                {/* Thumbnail or color preview */}
                <div className="aspect-video rounded-lg mb-2 overflow-hidden flex items-center justify-center bg-black/40">
                  {scene.thumbnail ? (
                    <img src={scene.thumbnail} className="w-full h-full object-cover" alt={scene.name} />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: scene.bgColor || '#0d0d1a' }}
                    >
                      <span className="text-2xl">{scene.icon}</span>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-black" />
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Icon size={10} className={cn('shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground')} />
                  <span className={cn(
                    'font-mono-console text-[10px] uppercase tracking-wide font-semibold truncate',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {scene.name}
                  </span>
                </div>
              </button>

              {/* Delete button (not on first 3 default scenes) */}
              {scenes.indexOf(scene) >= 3 && (
                <button
                  onClick={e => { e.stopPropagation(); onDelete(scene.id); }}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded flex items-center justify-center bg-black/60 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <Trash2 size={9} />
                </button>
              )}
            </div>
          );
        })}

        {/* Add scene button */}
        <button
          onClick={() => setAdding(true)}
          className="aspect-video flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus size={18} />
          <span className="font-mono-console text-[9px] mt-1 uppercase tracking-wider">Add Scene</span>
        </button>
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
          <div className="grid grid-cols-4 gap-1.5">
            {SOURCE_TYPES.map(t => (
              <button
                key={t.type}
                onClick={() => setNewType(t.type)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 rounded-lg border text-[9px] font-mono-console transition-colors',
                  newType === t.type ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <t.icon size={12} />
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-1.5 rounded-lg border border-border font-mono-console text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleAdd} className="flex-1 py-1.5 rounded-lg bg-primary text-white font-mono-console text-xs font-semibold">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}
