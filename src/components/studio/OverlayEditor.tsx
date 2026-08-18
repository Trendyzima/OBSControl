import { useState } from 'react';
import { StudioScene, OverlayText } from '@/types/studio';
import { Plus, Trash2, Eye, EyeOff, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverlayEditorProps {
  scene: StudioScene | undefined;
  onAdd: (sceneId: string, ov: Omit<OverlayText, 'id'>) => void;
  onUpdate: (sceneId: string, ovId: string, patch: Partial<OverlayText>) => void;
  onRemove: (sceneId: string, ovId: string) => void;
}

export default function OverlayEditor({ scene, onAdd, onUpdate, onRemove }: OverlayEditorProps) {
  const [newText, setNewText] = useState('');

  if (!scene) return null;
  const overlays = scene.overlays || [];

  function handleAdd() {
    if (!newText.trim()) return;
    onAdd(scene!.id, {
      text: newText.trim(),
      x: 50, y: 50,
      fontSize: 32,
      color: '#ffffff',
      bgColor: 'transparent',
      bold: false,
      visible: true,
    });
    setNewText('');
  }

  return (
    <div className="space-y-2">
      <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground">Text Overlays — {scene.name}</h3>

      {/* Add new overlay */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Overlay text..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 bg-input border border-border rounded-lg px-3 py-2 font-mono-console text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleAdd}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Overlay list */}
      <div className="space-y-2 max-h-52 overflow-y-auto">
        {overlays.length === 0 && (
          <div className="flex items-center justify-center py-4 text-muted-foreground/40 font-mono-console text-xs gap-2">
            <Type size={14} />
            No overlays — add text above
          </div>
        )}
        {overlays.map(ov => (
          <div key={ov.id} className="p-2.5 rounded-xl border border-border bg-secondary/20 space-y-2">
            {/* Text + visibility + delete */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ov.text}
                onChange={e => onUpdate(scene.id, ov.id, { text: e.target.value })}
                className="flex-1 bg-transparent border border-border/50 rounded px-2 py-1 font-mono-console text-xs text-foreground focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => onUpdate(scene.id, ov.id, { visible: !ov.visible })}
                className={cn('w-7 h-7 flex items-center justify-center rounded transition-colors shrink-0',
                  ov.visible ? 'text-foreground hover:text-muted-foreground' : 'text-muted-foreground/40 hover:text-foreground'
                )}
              >
                {ov.visible ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
              <button
                onClick={() => onRemove(scene.id, ov.id)}
                className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground/40 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Controls row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Position */}
              <div>
                <label className="font-mono-console text-[8px] text-muted-foreground uppercase block mb-1">X Position</label>
                <input type="range" min={5} max={95} value={ov.x} onChange={e => onUpdate(scene.id, ov.id, { x: Number(e.target.value) })} className="w-full accent-primary h-1" />
              </div>
              <div>
                <label className="font-mono-console text-[8px] text-muted-foreground uppercase block mb-1">Y Position</label>
                <input type="range" min={5} max={95} value={ov.y} onChange={e => onUpdate(scene.id, ov.id, { y: Number(e.target.value) })} className="w-full accent-primary h-1" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Font size */}
              <div className="flex-1">
                <label className="font-mono-console text-[8px] text-muted-foreground uppercase block mb-1">Size: {ov.fontSize}px</label>
                <input type="range" min={12} max={120} value={ov.fontSize} onChange={e => onUpdate(scene.id, ov.id, { fontSize: Number(e.target.value) })} className="w-full accent-primary h-1" />
              </div>

              {/* Color pickers */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div>
                  <label className="font-mono-console text-[8px] text-muted-foreground block text-center mb-0.5">Text</label>
                  <input type="color" value={ov.color} onChange={e => onUpdate(scene.id, ov.id, { color: e.target.value })} className="w-8 h-7 rounded cursor-pointer border border-border bg-transparent" />
                </div>
                <div>
                  <label className="font-mono-console text-[8px] text-muted-foreground block text-center mb-0.5">BG</label>
                  <input type="color" value={ov.bgColor === 'transparent' ? '#000000' : ov.bgColor} onChange={e => onUpdate(scene.id, ov.id, { bgColor: e.target.value })} className="w-8 h-7 rounded cursor-pointer border border-border bg-transparent" />
                </div>
              </div>

              {/* Bold toggle */}
              <button
                onClick={() => onUpdate(scene.id, ov.id, { bold: !ov.bold })}
                className={cn('w-7 h-7 flex items-center justify-center rounded border font-bold text-xs transition-colors shrink-0',
                  ov.bold ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                B
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
