import { useRef, useEffect } from 'react';
import { StudioState } from '@/types/studio';
import { Wifi, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgramMonitorProps {
  state: StudioState;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoElemRef: React.RefObject<HTMLVideoElement>;
  mediaVideoRef: React.RefObject<HTMLVideoElement>;
  mediaImageRef: React.RefObject<HTMLImageElement>;
  duration: number;
}

function formatDur(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

export default function ProgramMonitor({
  state, canvasRef, videoElemRef, mediaVideoRef, mediaImageRef, duration
}: ProgramMonitorProps) {
  const { isLive, isRecording, currentSceneId, scenes } = state;
  const currentScene = scenes.find(s => s.id === currentSceneId);

  return (
    <div className="flex flex-col gap-0">
      {/* Monitor frame */}
      <div className={cn(
        'relative rounded-2xl overflow-hidden border-2 transition-all duration-300',
        isLive ? 'border-red-500 shadow-[0_0_24px_rgba(220,38,38,0.5)]' :
        isRecording ? 'border-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.4)]' :
        'border-border'
      )}>
        {/* Canvas — the actual program output */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full block"
          style={{ aspectRatio: '16/9', background: '#0d0d1a' }}
        />

        {/* Hidden video elements for rendering */}
        <video ref={videoElemRef} className="hidden" playsInline muted autoPlay />
        <video ref={mediaVideoRef} className="hidden" playsInline muted loop />
        <img ref={mediaImageRef} className="hidden" alt="" />

        {/* LIVE badge */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600 shadow-lg">
            <Wifi size={12} className="text-white" />
            <span className="font-mono-console text-xs font-bold text-white tracking-widest">LIVE</span>
            <span className="font-mono-console text-xs text-white/80">{formatDur(duration)}</span>
          </div>
        )}

        {/* REC badge */}
        {isRecording && !isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-600 shadow-lg">
            <Circle size={10} className="fill-white text-white animate-pulse" />
            <span className="font-mono-console text-xs font-bold text-white tracking-widest">REC</span>
            <span className="font-mono-console text-xs text-white/80">{formatDur(duration)}</span>
          </div>
        )}

        {/* Current scene label */}
        <div className="absolute bottom-3 right-3">
          <span className="font-mono-console text-[10px] text-white/60 bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
            {currentScene?.name}
          </span>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 px-1 pt-1.5">
        <div className={cn('w-2 h-2 rounded-full shrink-0', isLive ? 'bg-red-500 animate-pulse' : isRecording ? 'bg-amber-500 animate-pulse' : 'bg-muted-foreground/30')} />
        <span className="font-mono-console text-[10px] text-muted-foreground flex-1">
          {isLive ? 'STREAMING LIVE' : isRecording ? 'RECORDING' : 'PREVIEW'}
        </span>
        <span className="font-mono-console text-[10px] text-muted-foreground tabular-nums">{formatDur(duration)}</span>
      </div>
    </div>
  );
}
