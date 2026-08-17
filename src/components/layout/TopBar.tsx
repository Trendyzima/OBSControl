import { useState } from 'react';
import { ConnectionStatus, StreamStatus } from '@/types/obs';
import { OBSProfile } from '@/types/obs';
import { Wifi, WifiOff, Radio, Square, Circle, Monitor, Keyboard, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HotkeyConfig } from '@/components/features/HotkeyRemapper';

interface TopBarProps {
  status: ConnectionStatus;
  activeProfile: OBSProfile | null;
  streamStatus: StreamStatus;
  isRealOBS: boolean;
  hotkeys: HotkeyConfig[];
  onOpenConnection: () => void;
  onDisconnect: () => void;
  onToggleStream: () => void;
  onToggleRecord: () => void;
  onToggleScreenRecording: () => void;
  onOpenHotkeyRemapper: () => void;
}

export default function TopBar({
  status,
  activeProfile,
  streamStatus,
  isRealOBS,
  hotkeys,
  onOpenConnection,
  onDisconnect,
  onToggleStream,
  onToggleRecord,
  onToggleScreenRecording,
  onOpenHotkeyRemapper,
}: TopBarProps) {
  const isConnected = status === 'connected';
  const [showHotkeys, setShowHotkeys] = useState(false);

  // Build display key for a given hotkey id
  function getKey(id: string) {
    return hotkeys.find(h => h.id === id)?.currentKey ?? '?';
  }

  const HOTKEY_DISPLAY = [
    { key: `${getKey('scene_1')}–${getKey('scene_9')}`, action: 'Switch scene' },
    { key: getKey('mute_host'), action: 'Mute host' },
    { key: getKey('mute_guest'), action: 'Mute guest' },
    { key: getKey('toggle_stream'), action: 'Toggle stream' },
    { key: getKey('toggle_record'), action: 'Toggle record' },
    { key: getKey('screen_record'), action: 'Screen record' },
  ];

  return (
    <>
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-[hsl(220,22%,5%)] shrink-0 gap-2">
        {/* Left: Logo + Connection */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-[hsl(var(--live-red))] flex items-center justify-center shadow-[0_0_12px_hsl(0,85%,55%,0.4)]">
              <Radio size={15} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-mono-console text-sm font-bold tracking-widest text-foreground uppercase">
                OBS Control
              </span>
              <span className="font-mono-console text-[9px] text-muted-foreground block leading-none mt-0.5 tracking-wider">
                BROADCAST STUDIO
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-border shrink-0" />

          {/* Connection badge */}
          <button
            onClick={isConnected ? onDisconnect : onOpenConnection}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono-console transition-colors hover:bg-secondary min-w-0"
          >
            {status === 'connecting' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="text-amber-400 truncate">CONNECTING...</span>
              </>
            )}
            {status === 'connected' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <Wifi size={12} className="text-emerald-400 shrink-0" />
                <span className="text-emerald-400 truncate max-w-[100px]">{activeProfile?.name}</span>
                {isRealOBS && (
                  <span className="hidden sm:flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-mono-console bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    WS
                  </span>
                )}
              </>
            )}
            {(status === 'disconnected' || status === 'error') && (
              <>
                <span className="w-2 h-2 rounded-full bg-muted-foreground shrink-0" />
                <WifiOff size={12} className="text-muted-foreground shrink-0" />
                <span className="text-muted-foreground hidden sm:block">DISCONNECTED</span>
              </>
            )}
          </button>
        </div>

        {/* Center: live status metrics */}
        {isConnected && (
          <div className="hidden lg:flex items-center gap-4 font-mono-console text-xs text-muted-foreground">
            {streamStatus.streaming && (
              <>
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[hsl(var(--live-red))]/10 border border-[hsl(var(--live-red))]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--live-red))] pulse-red" />
                  <span className="text-[hsl(var(--live-red))] font-bold tracking-widest">LIVE</span>
                </div>
                <span className="tabular-nums">{streamStatus.duration}</span>
                <span className="tabular-nums">{streamStatus.bitrate?.toLocaleString()} kbps</span>
                <span className={cn('tabular-nums', (streamStatus.fps ?? 0) < 25 ? 'text-amber-400' : '')}>{streamStatus.fps} fps</span>
                {(streamStatus.cpuUsage ?? 0) > 0 && (
                  <span className={cn('tabular-nums', (streamStatus.cpuUsage ?? 0) > 70 ? 'text-amber-400' : '')}>
                    CPU {streamStatus.cpuUsage}%
                  </span>
                )}
              </>
            )}
            {streamStatus.recording && !streamStatus.streaming && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-red" />
                <span className="text-amber-400 font-bold">REC {streamStatus.duration}</span>
              </div>
            )}
            {streamStatus.recording && streamStatus.streaming && (
              <span className="text-amber-400">● REC</span>
            )}
            {streamStatus.screenRecording && (
              <span className="text-purple-400 font-semibold pulse-red">● SCR</span>
            )}
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Hotkeys button */}
          <button
            onClick={() => setShowHotkeys(v => !v)}
            title="Keyboard shortcuts"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Keyboard size={14} />
          </button>

          {/* Hotkey remapper */}
          <button
            onClick={onOpenHotkeyRemapper}
            title="Remap hotkeys"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Settings size={14} />
          </button>

          {isConnected && (
            <>
              {/* Screen record */}
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleScreenRecording}
                title={`Screen Recording [${getKey('screen_record')}]`}
                className={cn(
                  'h-8 gap-1.5 font-mono-console text-xs border-border px-2',
                  streamStatus.screenRecording
                    ? 'border-purple-500 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Monitor size={11} />
                <span className="hidden sm:block">{streamStatus.screenRecording ? 'STOP SCR' : 'SCREEN'}</span>
              </Button>

              {/* Record */}
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleRecord}
                title={`Record [${getKey('toggle_record')}]`}
                className={cn(
                  'h-8 gap-1.5 font-mono-console text-xs border-border px-2',
                  streamStatus.recording
                    ? 'border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Circle size={10} className={streamStatus.recording ? 'fill-amber-400 text-amber-400' : ''} />
                <span className="hidden sm:block">{streamStatus.recording ? 'STOP REC' : 'RECORD'}</span>
              </Button>

              {/* Stream */}
              <Button
                size="sm"
                onClick={onToggleStream}
                title={`Toggle Stream [${getKey('toggle_stream')}]`}
                className={cn(
                  'h-8 gap-1.5 font-mono-console text-xs px-2 sm:px-3 font-bold',
                  streamStatus.streaming
                    ? 'bg-[hsl(var(--live-red))] hover:bg-red-700 text-white glow-red'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
              >
                <Square size={10} className={streamStatus.streaming ? 'fill-white' : ''} />
                <span className="hidden sm:block">{streamStatus.streaming ? 'STOP STREAM' : 'GO LIVE'}</span>
              </Button>
            </>
          )}

          {!isConnected && (
            <Button
              size="sm"
              onClick={onOpenConnection}
              disabled={status === 'connecting'}
              className="h-8 bg-[hsl(var(--live-red))] hover:bg-red-700 text-white font-mono-console text-xs font-bold"
            >
              {status === 'connecting' ? 'CONNECTING...' : 'CONNECT OBS'}
            </Button>
          )}
        </div>
      </header>

      {/* Hotkeys panel */}
      {showHotkeys && (
        <div className="bg-[hsl(220,20%,6%)] border-b border-border px-4 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono-console text-[10px] text-muted-foreground uppercase tracking-widest">Keyboard Shortcuts</p>
            <button onClick={() => setShowHotkeys(false)} className="text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            {HOTKEY_DISPLAY.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary font-mono-console text-[9px] text-foreground">{h.key}</kbd>
                <span className="font-mono-console text-[10px] text-muted-foreground">{h.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
