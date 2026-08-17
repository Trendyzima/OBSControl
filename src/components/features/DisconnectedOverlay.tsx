import heroBg from '@/assets/hero-bg.jpg';
import { Radio, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectionStatus } from '@/types/obs';

interface DisconnectedOverlayProps {
  status: ConnectionStatus;
  onConnect: () => void;
}

export default function DisconnectedOverlay({ status, onConnect }: DisconnectedOverlayProps) {
  return (
    <div className="relative flex-1 flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-[hsl(220,18%,11%)] border border-border flex items-center justify-center mx-auto mb-5">
          <Radio size={28} className="text-[hsl(var(--live-red))]" />
        </div>
        <h1 className="font-mono-console text-xl font-semibold text-foreground tracking-widest uppercase mb-2">
          OBS Control Panel
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Connect to your OBS Studio instance over WebSocket to control scenes, audio, streaming, and media.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-6 text-left">
          {['Scene switching', 'Audio mixer', 'Media library', 'Stream control'].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground font-mono-console">
              <span className="w-1 h-1 rounded-full bg-[hsl(var(--live-red))]" />
              {f}
            </div>
          ))}
        </div>

        <Button
          onClick={onConnect}
          disabled={status === 'connecting'}
          className="w-full bg-[hsl(var(--live-red))] hover:bg-red-700 text-white font-mono-console text-sm gap-2 h-11"
        >
          <Wifi size={16} />
          {status === 'connecting' ? 'Connecting...' : 'Connect to OBS'}
        </Button>
        <p className="text-xs text-muted-foreground/60 mt-3 font-mono-console">
          OBS WebSocket · Default port 4455
        </p>
      </div>
    </div>
  );
}
