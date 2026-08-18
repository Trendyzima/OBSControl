import { useState } from 'react';
import { useStudioEngine } from '@/hooks/useStudioEngine';
import ProgramMonitor from '@/components/studio/ProgramMonitor';
import SceneSwitcher from '@/components/studio/SceneSwitcher';
import StudioMixer from '@/components/studio/StudioMixer';
import OutputPanel from '@/components/studio/OutputPanel';
import CameraSetup from '@/components/studio/CameraSetup';
import TickerEditor from '@/components/studio/TickerEditor';
import OverlayEditor from '@/components/studio/OverlayEditor';
import { Radio, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Panel = 'scenes' | 'camera' | 'audio' | 'overlays' | 'output';

const PANELS: { id: Panel; label: string; icon: string }[] = [
  { id: 'scenes', label: 'Scenes', icon: '🎬' },
  { id: 'camera', label: 'Camera', icon: '📷' },
  { id: 'audio', label: 'Audio', icon: '🎚' },
  { id: 'overlays', label: 'Overlays', icon: '✍️' },
  { id: 'output', label: 'Output', icon: '📡' },
];

export default function Studio() {
  const [activePanel, setActivePanel] = useState<Panel>('scenes');

  const engine = useStudioEngine();
  const {
    state, cameras, cameraStream, ticker, tickerVisible,
    canvasRef, videoElemRef, mediaVideoRef, mediaImageRef,
    startCamera, stopCamera,
    switchScene, addScene, updateScene, deleteScene,
    setTrackVolume, toggleTrackMute,
    loadMedia,
    startOutput, stopOutput, setOutput,
    addOverlay, updateOverlay, removeOverlay,
    showTicker, hideTicker,
  } = engine;

  const { isLive, isRecording, duration, scenes, currentSceneId, audioTracks, output } = state;
  const currentScene = scenes.find(s => s.id === currentSceneId);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">

      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-[hsl(220,22%,5%)] shrink-0 gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.5)]">
            <Radio size={15} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-mono-console text-sm font-bold tracking-widest text-foreground uppercase">Mobile Studio</span>
            <span className="font-mono-console text-[9px] text-muted-foreground block leading-none mt-0.5 tracking-wider">INDEPENDENT BROADCAST</span>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2">
          {cameraStream && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono-console text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CAM ON
            </span>
          )}
          {isLive && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 font-mono-console text-[10px] text-red-400 animate-pulse">
              🔴 LIVE
            </span>
          )}
          {isRecording && !isLive && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 font-mono-console text-[10px] text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              REC
            </span>
          )}
        </div>
      </header>

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ── Left: Program monitor ──────────────────────────────────────── */}
        <div className="lg:flex-1 p-3 lg:p-4 space-y-3 lg:overflow-y-auto">
          <ProgramMonitor
            state={state}
            canvasRef={canvasRef}
            videoElemRef={videoElemRef}
            mediaVideoRef={mediaVideoRef}
            mediaImageRef={mediaImageRef}
            duration={duration}
          />

          {/* Quick scene switcher row — always visible */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {scenes.map(scene => (
              <button
                key={scene.id}
                onClick={() => switchScene(scene.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-2 rounded-xl border-2 font-mono-console text-[10px] uppercase tracking-wide transition-all active:scale-95',
                  scene.id === currentSceneId
                    ? 'border-red-500 bg-red-500/15 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    : 'border-border bg-secondary/20 text-muted-foreground hover:text-foreground hover:border-border/70'
                )}
              >
                <span className="mr-1">{scene.icon}</span>
                {scene.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: Control panels ──────────────────────────────────────── */}
        <div className="lg:w-[380px] xl:w-[420px] flex flex-col border-t lg:border-t-0 lg:border-l border-border bg-[hsl(220,20%,7%)] shrink-0">

          {/* Panel tabs */}
          <div className="flex border-b border-border bg-[hsl(220,22%,6%)] overflow-x-auto no-scrollbar shrink-0">
            {PANELS.map(panel => (
              <button
                key={panel.id}
                onClick={() => setActivePanel(panel.id)}
                className={cn(
                  'flex-1 min-w-0 flex flex-col items-center gap-0.5 px-2 py-2.5 border-b-2 transition-colors shrink-0',
                  activePanel === panel.id
                    ? 'border-primary text-foreground bg-secondary/20'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="text-base leading-none">{panel.icon}</span>
                <span className="font-mono-console text-[8px] uppercase tracking-wider">{panel.label}</span>
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">

            {activePanel === 'scenes' && (
              <SceneSwitcher
                scenes={scenes}
                currentSceneId={currentSceneId}
                onSwitch={switchScene}
                onAdd={addScene}
                onDelete={deleteScene}
                onUpdate={updateScene}
              />
            )}

            {activePanel === 'camera' && (
              <CameraSetup
                cameras={cameras}
                scenes={scenes}
                currentSceneId={currentSceneId}
                cameraStream={cameraStream}
                onStartCamera={startCamera}
                onStopCamera={stopCamera}
                onLoadMedia={loadMedia}
                onUpdateScene={updateScene}
              />
            )}

            {activePanel === 'audio' && (
              <StudioMixer
                tracks={audioTracks}
                onVolume={setTrackVolume}
                onMute={toggleTrackMute}
              />
            )}

            {activePanel === 'overlays' && (
              <div className="space-y-4">
                <OverlayEditor
                  scene={currentScene}
                  onAdd={addOverlay}
                  onUpdate={updateOverlay}
                  onRemove={removeOverlay}
                />
                <div className="border-t border-border pt-4">
                  <TickerEditor
                    ticker={ticker}
                    tickerVisible={tickerVisible}
                    onShow={showTicker}
                    onHide={hideTicker}
                  />
                </div>
              </div>
            )}

            {activePanel === 'output' && (
              <OutputPanel
                state={state}
                output={output}
                onOutputChange={setOutput}
                onStart={startOutput}
                onStop={stopOutput}
                duration={duration}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
