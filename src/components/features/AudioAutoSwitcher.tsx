import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioSource } from '@/types/obs';
import { Mic, Zap, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AudioAutoSwitcherProps {
  scenes: string[];
  audioSources: AudioSource[];
  currentScene: string;
  onSwitchScene: (name: string) => void;
  onLogEvent?: (msg: string, category?: string) => void;
  disabled: boolean;
}

interface SwitcherRule {
  id: string;
  label: string;
  sourceId: string;
  threshold: number;       // 0–100 simulated volume
  holdSeconds: number;     // seconds above threshold before switching
  targetScene: string;
  silenceScene: string;    // scene when source goes below threshold
  silenceSeconds: number;  // silence hold before switching back
  enabled: boolean;
}

function genId() { return `asr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

const DEFAULT_RULES: SwitcherRule[] = [
  {
    id: genId(),
    label: 'Host mic → LIVE CAMERA',
    sourceId: 'host-mic',
    threshold: 50,
    holdSeconds: 2,
    targetScene: 'LIVE CAMERA',
    silenceScene: 'BRB',
    silenceSeconds: 5,
    enabled: true,
  },
];

// Simulated VU meter levels (random walk to simulate live audio)
function useSimulatedVU(sources: AudioSource[], active: boolean) {
  const [levels, setLevels] = useState<Record<string, number>>({});
  const animRef = useRef<number>();

  useEffect(() => {
    if (!active) {
      setLevels({});
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    const vals: Record<string, number> = {};
    sources.forEach(s => { vals[s.id] = 0; });

    let lastTime = 0;
    function tick(now: number) {
      if (now - lastTime > 80) {
        lastTime = now;
        setLevels(prev => {
          const next = { ...prev };
          sources.forEach(s => {
            if (s.muted) { next[s.id] = 0; return; }
            const base = s.volume;
            const delta = (Math.random() - 0.46) * 18;
            next[s.id] = Math.max(0, Math.min(100, (prev[s.id] ?? base) + delta));
          });
          return next;
        });
        Object.assign(vals, levels);
      }
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [active, sources]);

  return levels;
}

export default function AudioAutoSwitcher({
  scenes, audioSources, currentScene, onSwitchScene, onLogEvent, disabled,
}: AudioAutoSwitcherProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [rules, setRules] = useState<SwitcherRule[]>(DEFAULT_RULES);
  const [active, setActive] = useState(false);
  const levels = useSimulatedVU(audioSources, active);

  // Hold timers: above threshold → target; below → silence
  const holdAbove = useRef<Record<string, number>>({});
  const holdBelow = useRef<Record<string, number>>({});
  const lastSwitch = useRef<Record<string, number>>({});
  const currentSceneRef = useRef(currentScene);
  useEffect(() => { currentSceneRef.current = currentScene; }, [currentScene]);

  // Tick every 200 ms to evaluate rules
  useEffect(() => {
    if (!active) { holdAbove.current = {}; holdBelow.current = {}; return; }
    const interval = setInterval(() => {
      const now = Date.now();
      rules.forEach(rule => {
        if (!rule.enabled) return;
        const lvl = levels[rule.sourceId] ?? 0;
        const lastSwitchTime = lastSwitch.current[rule.id] ?? 0;
        const cooldown = 3000; // ms between switches for same rule

        if (lvl >= rule.threshold) {
          holdBelow.current[rule.id] = 0;
          holdAbove.current[rule.id] = (holdAbove.current[rule.id] ?? 0) + 0.2;
          if (
            holdAbove.current[rule.id] >= rule.holdSeconds &&
            currentSceneRef.current !== rule.targetScene &&
            now - lastSwitchTime > cooldown
          ) {
            holdAbove.current[rule.id] = 0;
            lastSwitch.current[rule.id] = now;
            onSwitchScene(rule.targetScene);
            onLogEvent?.(`Auto-switch → ${rule.targetScene} (${rule.label})`, 'scene');
            toast(`Auto: ${rule.targetScene}`, { duration: 1500 });
          }
        } else {
          holdAbove.current[rule.id] = 0;
          holdBelow.current[rule.id] = (holdBelow.current[rule.id] ?? 0) + 0.2;
          if (
            holdBelow.current[rule.id] >= rule.silenceSeconds &&
            currentSceneRef.current !== rule.silenceScene &&
            now - lastSwitchTime > cooldown
          ) {
            holdBelow.current[rule.id] = 0;
            lastSwitch.current[rule.id] = now;
            onSwitchScene(rule.silenceScene);
            onLogEvent?.(`Auto-switch → ${rule.silenceScene} (silence, ${rule.label})`, 'scene');
            toast(`Auto: ${rule.silenceScene}`, { duration: 1500 });
          }
        }
      });
    }, 200);
    return () => clearInterval(interval);
  }, [active, rules, levels, onSwitchScene, onLogEvent]);

  function toggleEnabled(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  function updateRule(id: string, patch: Partial<SwitcherRule>) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  function deleteRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id));
  }

  function addRule() {
    setRules(prev => [...prev, {
      id: genId(),
      label: 'New Rule',
      sourceId: audioSources[0]?.id || 'host-mic',
      threshold: 50,
      holdSeconds: 2,
      targetScene: scenes[0] || 'LIVE CAMERA',
      silenceScene: 'BRB',
      silenceSeconds: 5,
      enabled: true,
    }]);
  }

  const enabledCount = rules.filter(r => r.enabled).length;

  return (
    <div className="border border-border rounded-xl bg-[hsl(var(--card))] overflow-hidden">
      <div className="flex items-center gap-2 px-3 h-11 border-b border-border cursor-pointer" onClick={() => setCollapsed(v => !v)}>
        <ChevronRight size={13} className={cn('text-muted-foreground transition-transform shrink-0', !collapsed && 'rotate-90')} />
        <Zap size={12} className={cn('shrink-0', active ? 'text-amber-400' : 'text-muted-foreground')} />
        <span className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex-1 min-w-0">
          Audio Auto-Switcher
        </span>
        <span className="font-mono-console text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
          {enabledCount} rule{enabledCount !== 1 ? 's' : ''}
        </span>
        <button
          onClick={e => {
            e.stopPropagation();
            if (disabled) { toast.error('Connect to OBS first'); return; }
            const next = !active;
            setActive(next);
            onLogEvent?.(next ? 'Audio auto-switcher activated' : 'Audio auto-switcher deactivated', 'scene');
            toast(next ? 'Auto-switcher ON' : 'Auto-switcher OFF', { duration: 1200 });
          }}
          disabled={disabled}
          className={cn(
            'relative w-10 h-5 rounded-full transition-colors shrink-0 disabled:opacity-40',
            active ? 'bg-amber-500' : 'bg-secondary'
          )}
        >
          <span className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
            active ? 'translate-x-5' : 'translate-x-0.5'
          )} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* VU meters */}
          {active && audioSources.length > 0 && (
            <div className="rounded-lg border border-border bg-secondary/20 p-2.5 space-y-2">
              <p className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider">Live VU Meters</p>
              {audioSources.map(src => {
                const lvl = levels[src.id] ?? 0;
                return (
                  <div key={src.id} className="flex items-center gap-2">
                    <Mic size={10} className={cn('shrink-0', src.muted ? 'text-muted-foreground/30' : 'text-muted-foreground')} />
                    <span className="font-mono-console text-[9px] text-muted-foreground w-20 truncate shrink-0">{src.name}</span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-75',
                          lvl > 80 ? 'bg-red-500' : lvl > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                        )}
                        style={{ width: `${src.muted ? 0 : lvl}%` }}
                      />
                    </div>
                    <span className="font-mono-console text-[9px] text-muted-foreground w-8 text-right shrink-0 tabular-nums">
                      {src.muted ? 'MUTE' : `${Math.round(lvl)}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info */}
          {!active && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/20 border border-border">
              <Info size={12} className="text-muted-foreground/50 shrink-0 mt-0.5" />
              <p className="font-mono-console text-[9px] text-muted-foreground leading-relaxed">
                When active, monitors audio levels and switches scenes automatically based on configured rules.
              </p>
            </div>
          )}

          {/* Rules */}
          {rules.map(rule => (
            <div key={rule.id} className={cn(
              'rounded-lg border p-3 space-y-2.5 transition-opacity',
              rule.enabled ? 'border-border bg-secondary/10' : 'border-border/30 bg-secondary/5 opacity-50'
            )}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={rule.label}
                  onChange={e => updateRule(rule.id, { label: e.target.value })}
                  className="flex-1 min-w-0 bg-transparent font-mono-console text-[10px] text-foreground focus:outline-none border-b border-transparent focus:border-border"
                />
                <button
                  onClick={() => toggleEnabled(rule.id)}
                  className={cn(
                    'relative w-9 h-5 rounded-full transition-colors shrink-0',
                    rule.enabled ? 'bg-emerald-500' : 'bg-secondary'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                    rule.enabled ? 'translate-x-4' : 'translate-x-0.5'
                  )} />
                </button>
                <button onClick={() => deleteRule(rule.id)} className="text-muted-foreground/40 hover:text-red-400 transition-colors w-5 h-5 flex items-center justify-center">
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground">Audio Source</label>
                  <select
                    value={rule.sourceId}
                    onChange={e => updateRule(rule.id, { sourceId: e.target.value })}
                    className="w-full mt-1 bg-input border border-border rounded px-1.5 py-1 font-mono-console text-[10px] text-foreground focus:outline-none"
                  >
                    {audioSources.map(s => (
                      <option key={s.id} value={s.id} className="bg-[hsl(220,18%,11%)]">{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground">Threshold {rule.threshold}%</label>
                  <input
                    type="range" min={10} max={90} value={rule.threshold}
                    onChange={e => updateRule(rule.id, { threshold: Number(e.target.value) })}
                    className="w-full mt-1.5 h-1.5 accent-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground">Active Scene</label>
                  <select
                    value={rule.targetScene}
                    onChange={e => updateRule(rule.id, { targetScene: e.target.value })}
                    className="w-full mt-1 bg-input border border-border rounded px-1.5 py-1 font-mono-console text-[10px] text-foreground focus:outline-none"
                  >
                    {scenes.map(s => <option key={s} value={s} className="bg-[hsl(220,18%,11%)]">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground">Hold {rule.holdSeconds}s</label>
                  <input
                    type="range" min={1} max={10} value={rule.holdSeconds}
                    onChange={e => updateRule(rule.id, { holdSeconds: Number(e.target.value) })}
                    className="w-full mt-1.5 h-1.5 accent-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground">Silence Scene</label>
                  <select
                    value={rule.silenceScene}
                    onChange={e => updateRule(rule.id, { silenceScene: e.target.value })}
                    className="w-full mt-1 bg-input border border-border rounded px-1.5 py-1 font-mono-console text-[10px] text-foreground focus:outline-none"
                  >
                    {scenes.map(s => <option key={s} value={s} className="bg-[hsl(220,18%,11%)]">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-mono-console text-[9px] text-muted-foreground">Silence hold {rule.silenceSeconds}s</label>
                  <input
                    type="range" min={2} max={30} value={rule.silenceSeconds}
                    onChange={e => updateRule(rule.id, { silenceSeconds: Number(e.target.value) })}
                    className="w-full mt-1.5 h-1.5 accent-blue-400"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addRule}
            className="w-full py-2 rounded-lg border border-dashed border-border text-[10px] font-mono-console text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
          >
            + Add Rule
          </button>
        </div>
      )}
    </div>
  );
}
