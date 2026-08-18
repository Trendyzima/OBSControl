import { useState, useCallback } from 'react';
import { Type, Send, Eye, EyeOff, ChevronRight, Plus, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TextOverlay {
  id: string;
  label: string;
  text: string;
  fontSize: number;
  color: string;
  bgColor: string;
  bold: boolean;
  italic: boolean;
  position: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'top-left' | 'top-center' | 'top-right' | 'center';
  visible: boolean;
  sourceName: string; // OBS Text source name
}

const FONT_SIZES = [16, 20, 24, 28, 32, 40, 48, 64];
const POSITIONS: TextOverlay['position'][] = [
  'top-left', 'top-center', 'top-right',
  'center',
  'bottom-left', 'bottom-center', 'bottom-right',
];

function genId() { return `overlay-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }

const DEFAULT_OVERLAYS: TextOverlay[] = [
  {
    id: genId(), label: 'Host Name', text: 'John Smith — Host', fontSize: 24, color: '#ffffff',
    bgColor: '#cc0000', bold: true, italic: false, position: 'bottom-left', visible: false, sourceName: 'LowerThird_Host'
  },
  {
    id: genId(), label: 'Guest Name', text: 'Dr. Jane Lee — Expert', fontSize: 24, color: '#ffffff',
    bgColor: '#1a1a2e', bold: true, italic: false, position: 'bottom-right', visible: false, sourceName: 'LowerThird_Guest'
  },
  {
    id: genId(), label: 'Breaking Banner', text: 'BREAKING NEWS', fontSize: 32, color: '#ffffff',
    bgColor: '#cc0000', bold: true, italic: false, position: 'top-center', visible: false, sourceName: 'Text_Banner'
  },
];

const POSITION_GRID: Record<TextOverlay['position'], { gridCol: number; gridRow: number; label: string }> = {
  'top-left':      { gridCol: 1, gridRow: 1, label: 'TL' },
  'top-center':    { gridCol: 2, gridRow: 1, label: 'TC' },
  'top-right':     { gridCol: 3, gridRow: 1, label: 'TR' },
  'center':        { gridCol: 2, gridRow: 2, label: 'C' },
  'bottom-left':   { gridCol: 1, gridRow: 3, label: 'BL' },
  'bottom-center': { gridCol: 2, gridRow: 3, label: 'BC' },
  'bottom-right':  { gridCol: 3, gridRow: 3, label: 'BR' },
};

const POSITION_STYLE: Record<TextOverlay['position'], string> = {
  'top-left':      'top-2 left-2',
  'top-center':    'top-2 left-1/2 -translate-x-1/2',
  'top-right':     'top-2 right-2',
  'center':        'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'bottom-left':   'bottom-2 left-2',
  'bottom-center': 'bottom-2 left-1/2 -translate-x-1/2',
  'bottom-right':  'bottom-2 right-2',
};

interface OBSTextOverlayEditorProps {
  disabled: boolean;
  isRealOBS: boolean;
  onLogEvent?: (msg: string, category?: string) => void;
}

export default function OBSTextOverlayEditor({ disabled, isRealOBS, onLogEvent }: OBSTextOverlayEditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [overlays, setOverlays] = useState<TextOverlay[]>(DEFAULT_OVERLAYS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_OVERLAYS[0].id);
  const [pushing, setPushing] = useState<string | null>(null);

  const selected = overlays.find(o => o.id === selectedId) ?? overlays[0];

  function updateSelected(patch: Partial<TextOverlay>) {
    setOverlays(prev => prev.map(o => o.id === selectedId ? { ...o, ...patch } : o));
  }

  const pushToOBS = useCallback(async (overlay: TextOverlay) => {
    setPushing(overlay.id);
    // In real OBS this would call SetInputSettings for a Text (GDI+) source
    console.log('[OBS] SetInputSettings →', overlay.sourceName, {
      text: overlay.text,
      font: { size: overlay.fontSize, flags: (overlay.bold ? 1 : 0) | (overlay.italic ? 2 : 0) },
      color: parseInt(overlay.color.replace('#', 'FF'), 16),
    });
    await new Promise(r => setTimeout(r, 400));
    setPushing(null);
    onLogEvent?.(`Text overlay pushed: "${overlay.label}" → ${overlay.sourceName}`, 'scene');
    toast.success(`Pushed to OBS: ${overlay.sourceName}`);
  }, [onLogEvent]);

  function toggleVisible(id: string) {
    setOverlays(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next = { ...o, visible: !o.visible };
      onLogEvent?.(`Text overlay ${next.visible ? 'shown' : 'hidden'}: ${next.label}`, 'scene');
      toast(`${next.label}: ${next.visible ? 'visible' : 'hidden'}`, { duration: 1200 });
      return next;
    }));
  }

  function addOverlay() {
    const o: TextOverlay = {
      id: genId(), label: 'New Overlay', text: 'Enter text here', fontSize: 24,
      color: '#ffffff', bgColor: '#000000cc', bold: false, italic: false,
      position: 'bottom-center', visible: false, sourceName: 'Text_New',
    };
    setOverlays(prev => [...prev, o]);
    setSelectedId(o.id);
  }

  function deleteOverlay(id: string) {
    setOverlays(prev => {
      const next = prev.filter(o => o.id !== id);
      if (selectedId === id && next.length > 0) setSelectedId(next[0].id);
      return next;
    });
  }

  const visibleOverlays = overlays.filter(o => o.visible);

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 h-11 border-b border-border cursor-pointer hover:bg-secondary/10 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        <ChevronRight size={13} className={cn('text-muted-foreground transition-transform shrink-0', !collapsed && 'rotate-90')} />
        <Type size={12} className={cn('shrink-0', visibleOverlays.length > 0 ? 'text-cyan-400' : 'text-muted-foreground')} />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
          Text Overlay Editor
        </span>
        {visibleOverlays.length > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 font-mono-console text-[9px] text-cyan-400 shrink-0">
            {visibleOverlays.length} LIVE
          </span>
        )}
        <span className="font-mono-console text-[9px] text-muted-foreground shrink-0">{overlays.length} overlay{overlays.length !== 1 ? 's' : ''}</span>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* Preview canvas */}
          <div className="relative rounded-lg overflow-hidden bg-[hsl(220,18%,8%)] aspect-video border border-border">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono-console text-[9px] text-muted-foreground/20 uppercase tracking-widest">Preview Canvas</span>
            </div>
            {overlays.filter(o => o.visible).map(o => (
              <div
                key={o.id}
                className={cn('absolute px-3 py-1.5 rounded', POSITION_STYLE[o.position])}
                style={{
                  background: o.bgColor,
                  color: o.color,
                  fontSize: Math.max(8, o.fontSize * 0.3),
                  fontWeight: o.bold ? 700 : 400,
                  fontStyle: o.italic ? 'italic' : 'normal',
                  fontFamily: 'JetBrains Mono, monospace',
                  whiteSpace: 'nowrap',
                  maxWidth: '80%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {o.text}
              </div>
            ))}
          </div>

          {/* Overlay list */}
          <div className="space-y-1">
            {overlays.map(o => (
              <div
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-all',
                  selectedId === o.id
                    ? 'border-primary/50 bg-primary/8'
                    : 'border-border bg-secondary/10 hover:bg-secondary/20'
                )}
              >
                <div className="w-3 h-3 rounded shrink-0" style={{ background: o.bgColor, border: '1px solid rgba(255,255,255,0.2)' }} />
                <span className="flex-1 font-mono-console text-[10px] text-foreground truncate">{o.label}</span>
                <span className="font-mono-console text-[9px] text-muted-foreground/50 shrink-0 hidden sm:block">{o.sourceName}</span>

                <button
                  onClick={e => { e.stopPropagation(); toggleVisible(o.id); }}
                  disabled={disabled}
                  className={cn('w-6 h-6 flex items-center justify-center rounded shrink-0 transition-colors',
                    o.visible ? 'text-cyan-400 hover:text-cyan-300' : 'text-muted-foreground/40 hover:text-foreground'
                  )}
                >
                  {o.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                </button>

                <button
                  onClick={async e => { e.stopPropagation(); await pushToOBS(o); }}
                  disabled={disabled || pushing === o.id}
                  className="w-6 h-6 flex items-center justify-center rounded shrink-0 text-muted-foreground/40 hover:text-emerald-400 transition-colors disabled:opacity-30"
                  title="Push to OBS"
                >
                  {pushing === o.id
                    ? <RefreshCw size={10} className="animate-spin" />
                    : <Send size={10} />
                  }
                </button>

                <button
                  onClick={e => { e.stopPropagation(); deleteOverlay(o.id); }}
                  className="w-6 h-6 flex items-center justify-center rounded shrink-0 text-muted-foreground/20 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={9} />
                </button>
              </div>
            ))}
          </div>

          {/* Editor for selected overlay */}
          {selected && (
            <div className="p-3 rounded-xl border border-border bg-secondary/15 space-y-3">
              <p className="font-mono-console text-[9px] uppercase tracking-wider text-muted-foreground">Edit: {selected.label}</p>

              {/* Label + Source name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground block mb-1">Label</label>
                  <input
                    type="text"
                    value={selected.label}
                    onChange={e => updateSelected({ label: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg px-2 py-1.5 font-mono-console text-[10px] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground block mb-1">OBS Source Name</label>
                  <input
                    type="text"
                    value={selected.sourceName}
                    onChange={e => updateSelected({ sourceName: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg px-2 py-1.5 font-mono-console text-[10px] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Text content */}
              <div>
                <label className="font-mono-console text-[9px] text-muted-foreground block mb-1">Text Content</label>
                <textarea
                  value={selected.text}
                  onChange={e => updateSelected({ text: e.target.value })}
                  rows={2}
                  className="w-full bg-input border border-border rounded-lg px-2 py-1.5 font-mono-console text-[10px] text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Font size + colors */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground block mb-1">Font Size</label>
                  <select
                    value={selected.fontSize}
                    onChange={e => updateSelected({ fontSize: Number(e.target.value) })}
                    className="w-full bg-input border border-border rounded-lg px-2 py-1.5 font-mono-console text-[10px] text-foreground focus:outline-none"
                  >
                    {FONT_SIZES.map(s => <option key={s} value={s} className="bg-[hsl(220,18%,11%)]">{s}px</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground block mb-1">Text Color</label>
                  <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-border bg-secondary/20">
                    <input type="color" value={selected.color} onChange={e => updateSelected({ color: e.target.value })} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" />
                    <span className="font-mono-console text-[9px] text-muted-foreground">{selected.color}</span>
                  </div>
                </div>
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground block mb-1">Background</label>
                  <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-border bg-secondary/20">
                    <input type="color" value={selected.bgColor.slice(0, 7)} onChange={e => updateSelected({ bgColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" />
                    <span className="font-mono-console text-[9px] text-muted-foreground">{selected.bgColor.slice(0, 7)}</span>
                  </div>
                </div>
              </div>

              {/* Style + Position */}
              <div className="grid grid-cols-2 gap-3">
                {/* Bold/Italic */}
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground block mb-1">Style</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateSelected({ bold: !selected.bold })}
                      className={cn('flex-1 py-1 rounded font-mono-console text-[10px] font-bold transition-colors',
                        selected.bold ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                      )}
                    >
                      B
                    </button>
                    <button
                      onClick={() => updateSelected({ italic: !selected.italic })}
                      className={cn('flex-1 py-1 rounded font-mono-console text-[10px] italic transition-colors',
                        selected.italic ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                      )}
                    >
                      I
                    </button>
                  </div>
                </div>

                {/* Position picker (3x3 grid) */}
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground block mb-1">Position</label>
                  <div className="grid grid-cols-3 gap-0.5">
                    {POSITIONS.map(p => {
                      const info = POSITION_GRID[p];
                      return (
                        <button
                          key={p}
                          onClick={() => updateSelected({ position: p })}
                          title={p}
                          style={{ gridColumn: info.gridCol, gridRow: info.gridRow }}
                          className={cn(
                            'h-6 rounded font-mono-console text-[8px] transition-colors',
                            selected.position === p
                              ? 'bg-primary text-white'
                              : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                          )}
                        >
                          {info.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Push button */}
              <button
                onClick={() => pushToOBS(selected)}
                disabled={disabled || pushing === selected.id}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-mono-console text-xs font-semibold transition-colors disabled:opacity-40"
              >
                {pushing === selected.id
                  ? <RefreshCw size={12} className="animate-spin" />
                  : <Send size={12} />
                }
                Push to OBS: {selected.sourceName}
              </button>

              {!isRealOBS && (
                <p className="font-mono-console text-[8px] text-muted-foreground/40 text-center">
                  Demo mode — connect to real OBS to push text to sources
                </p>
              )}
            </div>
          )}

          <button
            onClick={addOverlay}
            className="w-full py-2 rounded-lg border border-dashed border-border/50 font-mono-console text-[10px] text-muted-foreground hover:text-foreground hover:border-border transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={10} />
            Add Overlay
          </button>
        </div>
      )}
    </div>
  );
}
