import { useState, useEffect, useRef } from 'react';
import { Keyboard, RotateCcw, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface HotkeyConfig {
  id: string;
  label: string;
  description: string;
  defaultKey: string;
  currentKey: string;
  category: 'scene' | 'audio' | 'broadcast';
}

const STORAGE_KEY = 'obs-hotkeys-v1';

export const DEFAULT_HOTKEYS: HotkeyConfig[] = [
  { id: 'scene_1', label: 'Scene 1', description: 'Switch to scene 1', defaultKey: '1', currentKey: '1', category: 'scene' },
  { id: 'scene_2', label: 'Scene 2', description: 'Switch to scene 2', defaultKey: '2', currentKey: '2', category: 'scene' },
  { id: 'scene_3', label: 'Scene 3', description: 'Switch to scene 3', defaultKey: '3', currentKey: '3', category: 'scene' },
  { id: 'scene_4', label: 'Scene 4', description: 'Switch to scene 4', defaultKey: '4', currentKey: '4', category: 'scene' },
  { id: 'scene_5', label: 'Scene 5', description: 'Switch to scene 5', defaultKey: '5', currentKey: '5', category: 'scene' },
  { id: 'scene_6', label: 'Scene 6', description: 'Switch to scene 6', defaultKey: '6', currentKey: '6', category: 'scene' },
  { id: 'scene_7', label: 'Scene 7', description: 'Switch to scene 7', defaultKey: '7', currentKey: '7', category: 'scene' },
  { id: 'scene_8', label: 'Scene 8', description: 'Switch to scene 8', defaultKey: '8', currentKey: '8', category: 'scene' },
  { id: 'scene_9', label: 'Scene 9', description: 'Switch to scene 9', defaultKey: '9', currentKey: '9', category: 'scene' },
  { id: 'mute_host', label: 'Mute Host', description: 'Toggle host microphone mute', defaultKey: 'M', currentKey: 'M', category: 'audio' },
  { id: 'mute_guest', label: 'Mute Guest', description: 'Toggle guest microphone mute', defaultKey: 'G', currentKey: 'G', category: 'audio' },
  { id: 'toggle_stream', label: 'Toggle Stream', description: 'Start / stop streaming', defaultKey: 'Space', currentKey: 'Space', category: 'broadcast' },
  { id: 'toggle_record', label: 'Toggle Record', description: 'Start / stop OBS recording', defaultKey: 'R', currentKey: 'R', category: 'broadcast' },
  { id: 'screen_record', label: 'Screen Record', description: 'Start / stop screen recording', defaultKey: 'S', currentKey: 'S', category: 'broadcast' },
];

export function loadHotkeys(): HotkeyConfig[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, string>;
    return DEFAULT_HOTKEYS.map(h => ({ ...h, currentKey: saved[h.id] ?? h.defaultKey }));
  } catch {
    return DEFAULT_HOTKEYS;
  }
}

export function saveHotkeys(hotkeys: HotkeyConfig[]) {
  const map: Record<string, string> = {};
  hotkeys.forEach(h => { map[h.id] = h.currentKey; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

interface HotkeyRemapperProps {
  open: boolean;
  onClose: () => void;
  onHotkeysChange: (hotkeys: HotkeyConfig[]) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  scene: 'Scene Control',
  audio: 'Audio',
  broadcast: 'Broadcast',
};

export default function HotkeyRemapper({ open, onClose, onHotkeysChange }: HotkeyRemapperProps) {
  const [hotkeys, setHotkeys] = useState<HotkeyConfig[]>(loadHotkeys);
  const [recording, setRecording] = useState<string | null>(null); // id being remapped
  const recordingRef = useRef(recording);
  useEffect(() => { recordingRef.current = recording; }, [recording]);

  // Listen for keydown during recording
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (!recordingRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      let key = e.key;
      // Normalize
      if (key === ' ') key = 'Space';
      if (key.length === 1) key = key.toUpperCase();

      const id = recordingRef.current;
      setHotkeys(prev => prev.map(h => h.id === id ? { ...h, currentKey: key } : h));
      setRecording(null);
    };

    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, [open]);

  function handleSave() {
    saveHotkeys(hotkeys);
    onHotkeysChange(hotkeys);
    toast.success('Hotkeys saved');
    onClose();
  }

  function handleReset() {
    const defaults = DEFAULT_HOTKEYS;
    setHotkeys(defaults);
    saveHotkeys(defaults);
    onHotkeysChange(defaults);
    toast('Hotkeys reset to defaults');
  }

  if (!open) return null;

  const categories = Array.from(new Set(hotkeys.map(h => h.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setRecording(null); onClose(); }} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-[hsl(var(--card))] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Keyboard size={16} className="text-muted-foreground" />
          <h2 className="font-mono-console text-sm uppercase tracking-widest text-foreground flex-1">Hotkey Remapping</h2>
          <button onClick={handleReset} title="Reset all to defaults" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono-console text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <RotateCcw size={11} />
            Reset
          </button>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Hint */}
        {recording && (
          <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 font-mono-console text-[10px] text-amber-400 animate-pulse">
            Press any key to assign...  (Esc to cancel)
          </div>
        )}

        {/* Hotkey list */}
        <div className="max-h-[65vh] overflow-y-auto divide-y divide-border">
          {categories.map(cat => (
            <div key={cat}>
              <div className="px-5 py-2 bg-secondary/30">
                <p className="font-mono-console text-[9px] uppercase tracking-widest text-muted-foreground">{CATEGORY_LABELS[cat] || cat}</p>
              </div>
              {hotkeys.filter(h => h.category === cat).map(h => {
                const isRecording = recording === h.id;
                const isModified = h.currentKey !== h.defaultKey;
                return (
                  <div key={h.id} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono-console text-xs text-foreground">{h.label}</p>
                      <p className="font-mono-console text-[9px] text-muted-foreground mt-0.5">{h.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isModified && (
                        <span className="font-mono-console text-[9px] text-muted-foreground/50 line-through">{h.defaultKey}</span>
                      )}
                      <button
                        onClick={() => setRecording(isRecording ? null : h.id)}
                        className={cn(
                          'min-w-[52px] h-8 px-2.5 rounded-lg border font-mono-console text-xs font-semibold transition-all',
                          isRecording
                            ? 'border-amber-400 bg-amber-400/10 text-amber-400 animate-pulse'
                            : isModified
                              ? 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20'
                              : 'border-border bg-secondary text-foreground hover:bg-secondary/80'
                        )}
                      >
                        {isRecording ? '···' : h.currentKey}
                      </button>
                      {isModified && (
                        <button
                          onClick={() => setHotkeys(prev => prev.map(k => k.id === h.id ? { ...k, currentKey: k.defaultKey } : k))}
                          className="w-6 h-6 flex items-center justify-center text-muted-foreground/40 hover:text-foreground transition-colors rounded"
                          title="Reset this key"
                        >
                          <RotateCcw size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border font-mono-console text-xs text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[hsl(var(--live-red))] hover:bg-red-700 text-white font-mono-console text-xs transition-colors">
            <Check size={12} />
            Save Hotkeys
          </button>
        </div>
      </div>
    </div>
  );
}
