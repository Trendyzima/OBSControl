import { useState } from 'react';
import { Clock, Plus, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Playlist } from '@/types/studio';
import { toast } from 'sonner';

export interface ScheduledSlot {
  id: string;
  dayOfWeek: number; // 0=Sun, 1=Mon...6=Sat
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  playlistId: string;
  label: string;
}

interface AutoDJSchedulerProps {
  slots: ScheduledSlot[];
  playlists: Playlist[];
  onAdd: (slot: Omit<ScheduledSlot, 'id'>) => void;
  onRemove: (id: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

function formatTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function isCurrentlyActive(slot: ScheduledSlot): boolean {
  const now = new Date();
  if (now.getDay() !== slot.dayOfWeek) return false;
  const h = now.getHours(), m = now.getMinutes();
  const start = slot.startHour * 60 + slot.startMinute;
  const end = slot.endHour * 60 + slot.endMinute;
  const cur = h * 60 + m;
  return cur >= start && cur < end;
}

export default function AutoDJScheduler({ slots, playlists, onAdd, onRemove }: AutoDJSchedulerProps) {
  const [adding, setAdding] = useState(false);
  const [day, setDay] = useState(0);
  const [startH, setStartH] = useState(6);
  const [startM, setStartM] = useState(0);
  const [endH, setEndH] = useState(9);
  const [endM, setEndM] = useState(0);
  const [playlistId, setPlaylistId] = useState('');
  const [label, setLabel] = useState('');

  function handleAdd() {
    if (!playlistId) { toast.error('Select a playlist'); return; }
    onAdd({ dayOfWeek: day, startHour: startH, startMinute: startM, endHour: endH, endMinute: endM, playlistId, label: label || `${DAYS[day]} ${formatTime(startH, startM)}` });
    setAdding(false);
    setLabel('');
    toast.success('Schedule added');
  }

  const grouped = DAYS.map((d, i) => ({
    day: d,
    dayIndex: i,
    slots: slots.filter(s => s.dayOfWeek === i),
  })).filter(g => g.slots.length > 0 || adding);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono-console text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Clock size={11} /> AutoDJ Scheduler
        </h3>
      </div>

      {slots.length === 0 && !adding && (
        <div className="text-center py-6 font-mono-console text-[10px] text-muted-foreground/40">
          No scheduled slots — add below to automate playlists by time of day
        </div>
      )}

      {/* Weekly view */}
      {slots.length > 0 && (
        <div className="space-y-2">
          {DAYS.map((dayLabel, dayIndex) => {
            const daySlots = slots.filter(s => s.dayOfWeek === dayIndex);
            if (daySlots.length === 0) return null;
            return (
              <div key={dayIndex} className="rounded-xl border border-border overflow-hidden">
                <div className="px-3 py-1.5 bg-secondary/30">
                  <span className="font-mono-console text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">{dayLabel}</span>
                </div>
                {daySlots.map(slot => {
                  const active = isCurrentlyActive(slot);
                  const pl = playlists.find(p => p.id === slot.playlistId);
                  return (
                    <div key={slot.id} className={cn(
                      'flex items-center gap-2 px-3 py-2 border-t border-border/50 transition-colors',
                      active ? 'bg-emerald-500/8' : 'hover:bg-secondary/20'
                    )}>
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-console text-[10px] font-semibold text-foreground">
                            {formatTime(slot.startHour, slot.startMinute)} – {formatTime(slot.endHour, slot.endMinute)}
                          </span>
                          {active && <span className="font-mono-console text-[8px] text-emerald-400">NOW</span>}
                        </div>
                        <span className="font-mono-console text-[9px] text-muted-foreground">
                          {pl?.icon} {pl?.name || 'Unknown playlist'} · {slot.label}
                        </span>
                      </div>
                      <button onClick={() => onRemove(slot.id)}
                        className="w-6 h-6 flex items-center justify-center text-muted-foreground/30 hover:text-red-400 transition-colors shrink-0">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Add form */}
      {adding ? (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
          <p className="font-mono-console text-[10px] text-muted-foreground uppercase tracking-wider">New Schedule</p>

          {/* Day selector */}
          <div>
            <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Day</label>
            <div className="flex gap-1">
              {DAYS.map((d, i) => (
                <button key={d} onClick={() => setDay(i)}
                  className={cn('flex-1 py-1.5 rounded-lg border font-mono-console text-[9px] transition-colors',
                    day === i ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Start Time</label>
              <div className="flex gap-1">
                <select value={startH} onChange={e => setStartH(Number(e.target.value))}
                  className="flex-1 bg-input border border-border rounded px-2 py-1.5 font-mono-console text-xs text-foreground focus:outline-none">
                  {HOUR_OPTIONS.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
                </select>
                <select value={startM} onChange={e => setStartM(Number(e.target.value))}
                  className="w-16 bg-input border border-border rounded px-1 py-1.5 font-mono-console text-xs text-foreground focus:outline-none">
                  {[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">End Time</label>
              <div className="flex gap-1">
                <select value={endH} onChange={e => setEndH(Number(e.target.value))}
                  className="flex-1 bg-input border border-border rounded px-2 py-1.5 font-mono-console text-xs text-foreground focus:outline-none">
                  {HOUR_OPTIONS.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
                </select>
                <select value={endM} onChange={e => setEndM(Number(e.target.value))}
                  className="w-16 bg-input border border-border rounded px-1 py-1.5 font-mono-console text-xs text-foreground focus:outline-none">
                  {[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Playlist */}
          <div>
            <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Playlist</label>
            <select value={playlistId} onChange={e => setPlaylistId(e.target.value)}
              className="w-full bg-input border border-border rounded-xl px-3 py-2 font-mono-console text-xs text-foreground focus:outline-none focus:border-primary">
              <option value="">— Select playlist —</option>
              {playlists.map(pl => <option key={pl.id} value={pl.id}>{pl.icon} {pl.name}</option>)}
            </select>
          </div>

          {/* Label */}
          <input type="text" placeholder="Label (e.g. Morning Show)..." value={label} onChange={e => setLabel(e.target.value)}
            className="w-full bg-input border border-border rounded-xl px-3 py-2 font-mono-console text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary" />

          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-1.5 rounded-lg border border-border font-mono-console text-xs text-muted-foreground">Cancel</button>
            <button onClick={handleAdd} disabled={!playlistId}
              className="flex-1 py-1.5 rounded-lg bg-primary text-white font-mono-console text-xs font-semibold disabled:opacity-40 flex items-center justify-center gap-1">
              <Check size={11} /> Add Slot
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 font-mono-console text-xs transition-colors">
          <Plus size={13} /> Add Schedule Slot
        </button>
      )}
    </div>
  );
}
