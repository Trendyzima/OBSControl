import { useEffect, useState, useCallback } from 'react';
import { Keyboard, X, Plus } from 'lucide-react';
import { StudioScene, SceneHotkey } from '@/types/studio';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SceneHotkeysProps {
  scenes: StudioScene[];
  hotkeys: SceneHotkey[];
  onSwitch: (id: string) => void;
  onTakeToProgram: () => void;
  onUpdateHotkeys: (hotkeys: SceneHotkey[]) => void;
}

const DEFAULT_BINDINGS = [
  { display: 'F1–F9', desc: 'Scenes 1–9', type: 'system' },
  { display: '1–9', desc: 'Scenes 1–9 (numpad)', type: 'system' },
  { display: 'Space', desc: 'CUT to Program', type: 'system' },
  { display: 'M', desc: 'Toggle mic mute', type: 'system' },
];

export default function SceneHotkeys({
  scenes, hotkeys, onSwitch, onTakeToProgram, onUpdateHotkeys
}: SceneHotkeysProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [remapping, setRemapping] = useState<string | null>(null); // sceneId being remapped
  const [listeningKey, setListeningKey] = useState('');

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('studio-hotkeys');
      if (saved) onUpdateHotkeys(JSON.parse(saved));
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('studio-hotkeys', JSON.stringify(hotkeys));
  }, [hotkeys]);

  // Global keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

    // Remapping mode
    if (remapping) {
      e.preventDefault();
      const key = e.key.toLowerCase();
      if (key === 'escape') { setRemapping(null); setListeningKey(''); return; }
      const newHotkeys = hotkeys.filter(h => h.key !== key);
      newHotkeys.push({ key, sceneId: remapping });
      onUpdateHotkeys(newHotkeys);
      setRemapping(null);
      setListeningKey('');
      toast.success(`Hotkey "${e.key}" assigned`);
      return;
    }

    // Space = CUT to program
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      onTakeToProgram();
      return;
    }

    // F1–F9 = scenes 1–9
    const fMatch = e.key.match(/^F(\d)$/);
    if (fMatch) {
      const idx = parseInt(fMatch[1], 10) - 1;
      if (idx >= 0 && idx < scenes.length) {
        e.preventDefault();
        onSwitch(scenes[idx].id);
      }
      return;
    }

    // Number keys 1–9
    const numMatch = e.key.match(/^([1-9])$/);
    if (numMatch && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const idx = parseInt(numMatch[1], 10) - 1;
      if (idx >= 0 && idx < scenes.length) {
        e.preventDefault();
        onSwitch(scenes[idx].id);
      }
      return;
    }

    // Custom hotkeys
    const custom = hotkeys.find(h => h.key === e.key.toLowerCase());
    if (custom) {
      e.preventDefault();
      onSwitch(custom.sceneId);
    }
  }, [scenes, hotkeys, onSwitch, onTakeToProgram, remapping]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function startRemap(sceneId: string) {
    setRemapping(sceneId);
    setListeningKey('');
    toast('Press any key to assign…', { duration: 3000 });
  }

  function removeHotkey(sceneId: string) {
    onUpdateHotkeys(hotkeys.filter(h => h.sceneId !== sceneId));
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setShowPanel(v => !v)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono-console text-[9px] transition-colors',
          showPanel ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
        )}
      >
        <Keyboard size={11} /> Hotkeys
      </button>

      {showPanel && (
        <div className="space-y-3 p-3 rounded-xl border border-border bg-secondary/10">
          <div className="flex items-center justify-between">
            <h4 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Keyboard size={11} /> Keyboard Shortcuts
            </h4>
            <button onClick={() => setShowPanel(false)} className="text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          </div>

          {/* System shortcuts */}
          <div className="space-y-1.5">
            <p className="font-mono-console text-[8px] text-muted-foreground/50 uppercase tracking-wider">System Shortcuts</p>
            {DEFAULT_BINDINGS.map(b => (
              <div key={b.display} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/20">
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary font-mono-console text-[9px] text-foreground shrink-0">
                  {b.display}
                </kbd>
                <span className="font-mono-console text-[9px] text-muted-foreground">{b.desc}</span>
              </div>
            ))}
          </div>

          {/* Scene assignments */}
          <div className="space-y-1.5">
            <p className="font-mono-console text-[8px] text-muted-foreground/50 uppercase tracking-wider">Scene Shortcuts</p>
            {scenes.slice(0, 12).map((scene, idx) => {
              const auto = idx < 9 ? String(idx + 1) : null;
              const custom = hotkeys.find(h => h.sceneId === scene.id);
              const isRemapping = remapping === scene.id;

              return (
                <div key={scene.id} className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors',
                  isRemapping ? 'border-primary/50 bg-primary/5 animate-pulse' : 'border-border/50 bg-secondary/10'
                )}>
                  <span className="font-mono-console text-[10px] flex-1 truncate">{scene.icon} {scene.name}</span>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Auto binding */}
                    {auto && (
                      <kbd className="px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 font-mono-console text-[8px] text-emerald-400">
                        {auto}
                      </kbd>
                    )}

                    {/* Custom binding */}
                    {custom && (
                      <div className="flex items-center gap-0.5">
                        <kbd className="px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 font-mono-console text-[8px] text-primary">
                          {custom.key}
                        </kbd>
                        <button onClick={() => removeHotkey(scene.id)} className="w-4 h-4 flex items-center justify-center text-muted-foreground/40 hover:text-red-400">
                          <X size={9} />
                        </button>
                      </div>
                    )}

                    {/* Remap button */}
                    {!isRemapping ? (
                      <button onClick={() => startRemap(scene.id)}
                        className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                        <Plus size={9} />
                      </button>
                    ) : (
                      <span className="font-mono-console text-[8px] text-primary animate-pulse">Listening...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
