import { useRef, useEffect } from 'react';
import { StudioState } from '@/types/studio';
import { Wifi, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgramMonitorProps {
  state: StudioState;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  previewCanvasRef: React.RefObject<HTMLCanvasElement>;
  videoElemRef: React.RefObject<HTMLVideoElement>;
  mediaVideoRef: React.RefObject<HTMLVideoElement>;
  mediaImageRef: React.RefObject<HTMLImageElement>;
  pipVideoRef: React.RefObject<HTMLVideoElement>;
  duration: number;
  onTakeToProgram?: () => void;
  onPreviewScene?: (id: string) => void;
}

function formatDur(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

export default function ProgramMonitor({
  state, canvasRef, previewCanvasRef, videoElemRef, mediaVideoRef, mediaImageRef, pipVideoRef,
  duration, onTakeToProgram
}: ProgramMonitorProps) {
  const { isLive, isRecording, currentSceneId, previewSceneId, scenes } = state;
  const currentScene = scenes.find(s => s.id === currentSceneId);
  const previewScene = scenes.find(s => s.id === previewSceneId);

  return (
    <div className="space-y-2">
      {/* Hidden media elements */}
      <video ref={videoElemRef} className="hidden" playsInline muted autoPlay />
      <video ref={mediaVideoRef} className="hidden" playsInline muted loop />
      <img ref={mediaImageRef} className="hidden" alt="" />
      <video ref={pipVideoRef} className="hidden" playsInline muted autoPlay />

      {/* Dual monitor row */}
      <div className="grid grid-cols-2 gap-2">
        {/* PREVIEW bus */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono-console text-[9px] uppercase tracking-widest text-emerald-400 font-bold">Preview</span>
            {previewScene && <span className="font-mono-console text-[9px] text-muted-foreground truncate max-w-[80px]">{previewScene.name}</span>}
          </div>
          <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
            <canvas
              ref={previewCanvasRef}
              width={640}
              height={360}
              className="w-full block"
              style={{ aspectRatio: '16/9', background: '#050510' }}
            />
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-600/90 font-mono-console text-[8px] text-white font-bold tracking-widest">
              PVW
            </div>
          </div>
        </div>

        {/* PROGRAM bus */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono-console text-[9px] uppercase tracking-widest text-red-400 font-bold">Program</span>
            <span className="font-mono-console text-[9px] text-muted-foreground tabular-nums">{formatDur(duration)}</span>
          </div>
          <div className={cn(
            'relative rounded-xl overflow-hidden border-2 transition-all duration-300',
            isLive ? 'border-red-500 shadow-[0_0_16px_rgba(220,38,38,0.5)]' :
            isRecording ? 'border-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.4)]' :
            'border-red-500/40'
          )}>
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full block"
              style={{ aspectRatio: '16/9', background: '#0d0d1a' }}
            />
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-red-600/90 font-mono-console text-[8px] text-white font-bold tracking-widest">
              {isLive ? '🔴 LIVE' : isRecording ? '⏺ REC' : 'PGM'}
            </div>
            {currentScene && (
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                <span className="font-mono-console text-[8px] text-white/70">{currentScene.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* T-bar / CUT button */}
      {onTakeToProgram && (
        <button
          onClick={onTakeToProgram}
          className="w-full py-2.5 rounded-xl bg-red-600/20 border-2 border-red-500/60 hover:bg-red-600/40 hover:border-red-500 text-red-400 font-mono-console text-xs font-bold tracking-widest uppercase transition-all active:scale-[0.98] shadow-[0_0_12px_rgba(220,38,38,0.2)]"
        >
          ⚡ CUT — TAKE TO PROGRAM
        </button>
      )}

      {/* Status bar */}
      <div className="flex items-center gap-2 px-1">
        <div className={cn('w-2 h-2 rounded-full shrink-0', isLive ? 'bg-red-500 animate-pulse' : isRecording ? 'bg-amber-500 animate-pulse' : 'bg-muted-foreground/20')} />
        <span className="font-mono-console text-[9px] text-muted-foreground flex-1">
          {isLive ? 'STREAMING LIVE' : isRecording ? 'RECORDING' : 'PREVIEW MODE'}
        </span>
        <span className="font-mono-console text-[9px] text-muted-foreground tabular-nums">{formatDur(duration)}</span>
      </div>
    </div>
  );
}
