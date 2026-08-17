import { useState, useEffect } from 'react';
import { OBSProfile } from '@/types/obs';
import { loadProfiles, saveProfiles } from '@/hooks/useOBSController';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Plug, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';


interface ConnectionModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: (profile: OBSProfile) => void;
}

const DEFAULT_FORM: Omit<OBSProfile, 'id'> = {
  name: '',
  host: '192.168.1.100',
  port: 4455,
  password: '',
};

export default function ConnectionModal({ open, onClose, onConnect }: ConnectionModalProps) {
  const [profiles, setProfiles] = useState<OBSProfile[]>([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    const saved = loadProfiles();
    setProfiles(saved);
    if (saved.length === 0) setShowNew(true);
  }, [open]);

  function handleSaveAndConnect() {
    if (!form.name.trim() || !form.host.trim()) return;
    const profile: OBSProfile = { ...form, id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` };
    const updated = [...profiles, profile];
    setProfiles(updated);
    saveProfiles(updated);
    setShowNew(false);
    onConnect(profile);
    onClose();
  }

  function handleConnectExisting(profile: OBSProfile) {
    onConnect(profile);
    onClose();
  }

  function handleDelete(id: string) {
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    saveProfiles(updated);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[hsl(var(--card))] border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono-console text-sm tracking-widest text-foreground uppercase">
            OBS WebSocket Connection
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Saved profiles */}
          {profiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-mono-console uppercase tracking-wider">Saved Profiles</p>
              {profiles.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded border border-border bg-secondary/40 hover:bg-secondary/70 transition-colors group"
                >
                  <button
                    className="flex-1 text-left"
                    onClick={() => handleConnectExisting(p)}
                  >
                    <div className="text-sm font-medium text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground font-mono-console mt-0.5">
                      {p.host}:{p.port}
                    </div>
                    {p.lastConnected && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground/60 mt-0.5">
                        <Clock size={10} />
                        {new Date(p.lastConnected).toLocaleDateString()}
                      </div>
                    )}
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(p.id)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleConnectExisting(p)}
                    className="h-8 bg-[hsl(var(--live-red))] hover:bg-red-700 text-white font-mono-console text-xs gap-1"
                  >
                    <Plug size={12} />
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* New profile form */}
          {showNew ? (
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground font-mono-console uppercase tracking-wider">New Profile</p>
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono-console text-muted-foreground uppercase">Profile Name</Label>
                  <Input
                    placeholder="Home Studio"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="bg-input border-border text-foreground font-mono-console text-sm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-mono-console text-muted-foreground uppercase">Host / IP</Label>
                    <Input
                      placeholder="192.168.1.100"
                      value={form.host}
                      onChange={e => setForm(f => ({ ...f, host: e.target.value }))}
                      className="bg-input border-border text-foreground font-mono-console text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono-console text-muted-foreground uppercase">Port</Label>
                    <Input
                      type="number"
                      value={form.port}
                      onChange={e => setForm(f => ({ ...f, port: Number(e.target.value) }))}
                      className="bg-input border-border text-foreground font-mono-console text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono-console text-muted-foreground uppercase">Password</Label>
                  <Input
                    type="password"
                    placeholder="OBS WebSocket password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="bg-input border-border text-foreground font-mono-console text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                {profiles.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowNew(false)} className="text-xs border-border">
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSaveAndConnect}
                  disabled={!form.name.trim() || !form.host.trim()}
                  className="flex-1 bg-[hsl(var(--live-red))] hover:bg-red-700 text-white font-mono-console text-xs gap-1"
                >
                  <Plug size={12} />
                  Save & Connect
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-border text-muted-foreground hover:text-foreground font-mono-console text-xs gap-1.5"
              onClick={() => { setForm(DEFAULT_FORM); setShowNew(true); }}
            >
              <Plus size={12} />
              Add New Profile
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
