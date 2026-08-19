import { ChromaKeySettings } from '@/types/studio';
import { Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChromaKeyPanelProps {
  settings: ChromaKeySettings;
  onChange: (patch: Partial<ChromaKeySettings>) => void;
}

const PRESET_COLORS = [
  { label: 'Green', value: '#00b140' },
  { label: 'Blue', value: '#0047ab' },
  { label: 'Red', value: '#cc0000' },
  { label: 'Cyan', value: '#00ffff' },
  { label: 'Magenta', value: '#ff00ff' },
];

export default function ChromaKeyPanel({ settings, onChange }: ChromaKeyPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Scissors size={11} /> Chroma Key
        </h3>
        <button
          onClick={() => onChange({ enabled: !settings.enabled })}
          className={cn(
            'px-3 py-1 rounded-lg border font-mono-console text-[9px] transition-colors',
            settings.enabled
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
              : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          {settings.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {settings.enabled && (
        <div className="space-y-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          {/* Key color */}
          <div>
            <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-2">Key Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(p => (
                <button
                  key={p.value}
                  onClick={() => onChange({ color: p.value })}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border font-mono-console text-[9px] transition-all',
                    settings.color === p.value
                      ? 'border-white/50 scale-105'
                      : 'border-border/50 hover:border-white/30'
                  )}
                >
                  <div className="w-3 h-3 rounded-full border border-white/20" style={{ background: p.value }} />
                  {p.label}
                </button>
              ))}
              <div className="flex items-center gap-1.5">
                <label className="font-mono-console text-[9px] text-muted-foreground">Custom:</label>
                <input
                  type="color"
                  value={settings.color}
                  onChange={e => onChange({ color: e.target.value })}
                  className="w-8 h-7 rounded cursor-pointer border border-border bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Tolerance */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase">Tolerance</label>
              <span className="font-mono-console text-[10px] text-muted-foreground">{settings.tolerance}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={settings.tolerance}
              onChange={e => onChange({ tolerance: Number(e.target.value) })}
              className="w-full accent-emerald-500 h-1"
            />
            <div className="flex justify-between mt-0.5">
              <span className="font-mono-console text-[7px] text-muted-foreground/40">Tight</span>
              <span className="font-mono-console text-[7px] text-muted-foreground/40">Wide</span>
            </div>
          </div>

          {/* Softness / Edge feather */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase">Edge Softness</label>
              <span className="font-mono-console text-[10px] text-muted-foreground">{settings.softness}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={settings.softness}
              onChange={e => onChange({ softness: Number(e.target.value) })}
              className="w-full accent-emerald-500 h-1"
            />
          </div>

          <p className="font-mono-console text-[9px] text-muted-foreground/50 leading-relaxed">
            Removes the selected color from your camera feed in real-time. Stand in front of a green or blue screen for best results.
          </p>
        </div>
      )}
    </div>
  );
}
