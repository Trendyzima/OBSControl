import { useState, useRef } from 'react';
import { useStudioEngine } from '@/hooks/useStudioEngine';
import ProgramMonitor from '@/components/studio/ProgramMonitor';
import SceneSwitcher from '@/components/studio/SceneSwitcher';
import StudioMixer from '@/components/studio/StudioMixer';
import OutputPanel from '@/components/studio/OutputPanel';
import CameraSetup from '@/components/studio/CameraSetup';
import TickerEditor from '@/components/studio/TickerEditor';
import OverlayEditor from '@/components/studio/OverlayEditor';
import RundownPanel from '@/components/studio/RundownPanel';
import AdManager from '@/components/studio/AdManager';
import TransitionControl from '@/components/studio/TransitionControl';
import ChromaKeyPanel from '@/components/studio/ChromaKeyPanel';
import CaptionsOverlay from '@/components/studio/CaptionsOverlay';
import GuestCallPanel from '@/components/studio/GuestCallPanel';
import AnalyticsDashboard from '@/components/studio/AnalyticsDashboard';
import {
  Radio, ArrowLeft, Monitor, Layers, Mic2, Settings, Clock,
  Tv, Zap, Scissors, Captions, Users, BarChart2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AdSlot } from '@/types/studio';

type Panel =
  | 'monitor' | 'scenes' | 'audio' | 'rundown' | 'ads'
  | 'overlays' | 'output' | 'chroma' | 'captions' | 'guests' | 'analytics';

const PANELS: { id: Panel; label: string; icon: React.ElementType }[] = [
  { id: 'monitor',   label: 'Monitors',  icon: Monitor },
  { id: 'scenes',    label: 'Scenes',    icon: Layers },
  { id: 'audio',     label: 'Audio',     icon: Mic2 },
  { id: 'rundown',   label: 'Rundown',   icon: Clock },
  { id: 'ads',       label: 'Ads',       icon: Tv },
  { id: 'overlays',  label: 'Graphics',  icon: Zap },
  { id: 'chroma',    label: 'Chroma',    icon: Scissors },
  { id: 'captions',  label: 'Captions',  icon: Captions },
  { id: 'guests',    label: 'Guests',    icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'output',    label: 'Output',    icon: Settings },
];

export default function Studio() {
  const [activePanel, setActivePanel] = useState<Panel>('monitor');
  const [adPlayingId, setAdPlayingId] = useState<string | null>(null);

  const engine = useStudioEngine();
  const {
    state, cameras, cameraStream, pipStream, facingMode, ticker, tickerVisible,
    rundown, adSlots, analytics,
    canvasRef, previewCanvasRef, videoElemRef, mediaVideoRef, mediaImageRef, pipVideoRef, guestVideoRef,
    startCamera, stopCamera, flipCamera, startPip, stopPip,
    switchScene, setPreviewScene, takeToProgram,
    addScene, updateScene, deleteScene, captureSceneThumbnail,
    setTrackVolume, toggleTrackMute,
    loadMedia,
    startOutput, stopOutput, setOutput,
    setTransition, setTransitionDuration,
    setPip,
    addOverlay, updateOverlay, removeOverlay,
    showTicker, hideTicker,
    addRundownSegment, removeRundownSegment, updateRundownSegment,
    addAdSlot, removeAdSlot,
    updateChromaKey,
    handleGuestStream,
    updateCaption, enableCaptions, disableCaptions,
  } = engine;

  const {
    isLive, isRecording, duration, scenes, currentSceneId, previewSceneId,
    audioTracks, output, pip, transition, transitionDuration, chromaKey,
    captionsEnabled, health,
  } = state;

  const currentScene = scenes.find(s => s.id === currentSceneId);
  const isActive = isLive || isRecording;

  // Scene names map for analytics
  const sceneNames: Record<string, string> = {};
  scenes.forEach(s => { sceneNames[s.id] = s.name; });

  function handlePlayAd(ad: AdSlot) {
    setAdPlayingId(ad.id);
    const adScene = scenes.find(s => s.category === 'ad');
    if (adScene) switchScene(adScene.id);
    if (ad.mediaUrl !== '__text__' && mediaVideoRef.current) {
      mediaVideoRef.current.src = ad.mediaUrl;
      mediaVideoRef.current.loop = false;
      mediaVideoRef.current.play().catch(() => {});
      mediaVideoRef.current.onended = () => setAdPlayingId(null);
    }
  }

  function handleStopAd() {
    setAdPlayingId(null);
    if (mediaVideoRef.current) { mediaVideoRef.current.pause(); mediaVideoRef.current.onended = null; }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(220,25%,3%)] overflow-x-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="h-12 flex items-center px-3 border-b border-border/50 bg-[hsl(220,22%,5%)] shrink-0 gap-3">
        <Link to="/" className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors shrink-0">
          <ArrowLeft size={15} />
        </Link>
        <div className="w-7 h-7 rounded-xl bg-emerald-600 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)] shrink-0">
          <Radio size={13} className="text-white" />
        </div>
        <div className="hidden sm:block">
          <span className="font-mono-console text-xs font-bold tracking-widest text-foreground uppercase">Live Studio</span>
          <span className="font-mono-console text-[8px] text-muted-foreground block leading-none mt-0.5 tracking-wider">INDEPENDENT BROADCAST</span>
        </div>

        {/* Tally lights */}
        <div className="flex-1 flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar">
          {scenes.slice(0, 8).map(scene => (
            <div key={scene.id} className="flex flex-col items-center gap-0.5 shrink-0">
              <div className={cn('w-2.5 h-2.5 rounded-full border transition-all',
                scene.id === currentSceneId
                  ? 'bg-red-500 border-red-400 shadow-[0_0_6px_rgba(220,38,38,0.8)]'
                  : scene.id === previewSceneId
                  ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.6)]'
                  : 'bg-muted-foreground/15 border-muted-foreground/20'
              )} />
              <span className="font-mono-console text-[6px] text-muted-foreground/40 hidden sm:block truncate max-w-[28px]">
                {scene.name.slice(0, 4)}
              </span>
            </div>
          ))}
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2 shrink-0">
          {chromaKey.enabled && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 font-mono-console text-[8px] text-emerald-400">
              CK
            </span>
          )}
          {captionsEnabled && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 font-mono-console text-[8px] text-blue-400">
              CC
            </span>
          )}
          {cameraStream && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 font-mono-console text-[8px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />CAM
            </span>
          )}
          {isLive && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 font-mono-console text-[9px] text-red-400 font-bold animate-pulse">
              🔴 LIVE
            </span>
          )}
          {isRecording && !isLive && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 font-mono-console text-[9px] text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />REC
            </span>
          )}
          {adPlayingId && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-600/20 border border-amber-500/40 font-mono-console text-[9px] text-amber-300">
              AD
            </span>
          )}
        </div>
      </header>

      {/* ── Main layout ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ── Left: Program + Preview + quick scene row ───────────── */}
        <div className="lg:flex-1 flex flex-col overflow-hidden">

          <div className="p-2.5 lg:p-3 space-y-2.5 shrink-0">
            {/* Dual monitors */}
            <ProgramMonitor
              state={state}
              canvasRef={canvasRef}
              previewCanvasRef={previewCanvasRef}
              videoElemRef={videoElemRef}
              mediaVideoRef={mediaVideoRef}
              mediaImageRef={mediaImageRef}
              pipVideoRef={pipVideoRef}
              guestVideoRef={guestVideoRef}
              duration={duration}
              onTakeToProgram={takeToProgram}
            />

            {/* Quick scene rail */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {scenes.map(scene => (
                <button
                  key={scene.id}
                  onDoubleClick={() => switchScene(scene.id)}
                  onClick={() => setPreviewScene(scene.id)}
                  className={cn(
                    'flex-shrink-0 px-2.5 py-1.5 rounded-xl border-2 font-mono-console text-[9px] uppercase tracking-wide transition-all active:scale-95',
                    scene.id === currentSceneId
                      ? 'border-red-500 bg-red-500/15 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      : scene.id === previewSceneId
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-border/50 bg-secondary/10 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="mr-1">{scene.icon}</span>
                  {scene.name}
                </button>
              ))}
            </div>
            <p className="font-mono-console text-[7px] text-muted-foreground/30 text-center">
              Tap → Preview bus  ·  Double-tap → Program immediately
            </p>
          </div>

          {/* Desktop left panel content */}
          <div className="flex-1 overflow-y-auto px-2.5 lg:px-3 pb-3 lg:block hidden">
            {activePanel === 'audio' && (
              <StudioMixer tracks={audioTracks} onVolume={setTrackVolume} onMute={toggleTrackMute} />
            )}
            {activePanel === 'overlays' && (
              <div className="space-y-4">
                <OverlayEditor scene={currentScene} onAdd={addOverlay} onUpdate={updateOverlay} onRemove={removeOverlay} />
                <div className="border-t border-border pt-4">
                  <TickerEditor ticker={ticker} tickerVisible={tickerVisible} onShow={showTicker} onHide={hideTicker} />
                </div>
              </div>
            )}
            {activePanel === 'rundown' && (
              <RundownPanel
                rundown={rundown} scenes={scenes} currentSceneId={currentSceneId} isLive={isActive}
                onAdd={addRundownSegment} onRemove={removeRundownSegment} onUpdate={updateRundownSegment}
                onSwitchToScene={switchScene}
              />
            )}
            {activePanel === 'analytics' && (
              <AnalyticsDashboard analytics={analytics} sceneNames={sceneNames} isLive={isActive} />
            )}
          </div>
        </div>

        {/* ── Right: Control panel ─────────────────────────────────── */}
        <div className="lg:w-[380px] xl:w-[420px] flex flex-col border-t lg:border-t-0 lg:border-l border-border/50 bg-[hsl(220,20%,6%)] shrink-0">

          {/* Panel tabs — scrollable */}
          <div className="flex border-b border-border/50 bg-[hsl(220,22%,5%)] overflow-x-auto no-scrollbar shrink-0">
            {PANELS.map(panel => {
              const Icon = panel.icon;
              return (
                <button
                  key={panel.id}
                  onClick={() => setActivePanel(panel.id)}
                  className={cn(
                    'flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-2.5 border-b-2 transition-colors',
                    activePanel === panel.id
                      ? 'border-primary text-foreground bg-secondary/20'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon size={13} />
                  <span className="font-mono-console text-[7px] uppercase tracking-wider">{panel.label}</span>
                </button>
              );
            })}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">

            {activePanel === 'monitor' && (
              <div className="space-y-4">
                <CameraSetup
                  cameras={cameras} scenes={scenes} currentSceneId={currentSceneId}
                  cameraStream={cameraStream} facingMode={facingMode}
                  onStartCamera={startCamera} onStopCamera={stopCamera} onFlipCamera={flipCamera}
                  onLoadMedia={loadMedia} onUpdateScene={updateScene}
                />
                <div className="border-t border-border/50 pt-4">
                  <TransitionControl
                    transition={transition} transitionDuration={transitionDuration}
                    onTransition={setTransition} onDuration={setTransitionDuration}
                  />
                </div>
              </div>
            )}

            {activePanel === 'scenes' && (
              <SceneSwitcher
                scenes={scenes} currentSceneId={currentSceneId} previewSceneId={previewSceneId}
                onSwitch={switchScene} onPreview={setPreviewScene}
                onAdd={addScene} onDelete={deleteScene} onUpdate={updateScene}
                onCaptureThumbnail={captureSceneThumbnail}
                pip={pip} onPipChange={setPip} onStartPip={startPip} onStopPip={stopPip} pipActive={!!pipStream}
              />
            )}

            {activePanel === 'audio' && (
              <StudioMixer tracks={audioTracks} onVolume={setTrackVolume} onMute={toggleTrackMute} />
            )}

            {activePanel === 'rundown' && (
              <RundownPanel
                rundown={rundown} scenes={scenes} currentSceneId={currentSceneId} isLive={isActive}
                onAdd={addRundownSegment} onRemove={removeRundownSegment} onUpdate={updateRundownSegment}
                onSwitchToScene={switchScene}
              />
            )}

            {activePanel === 'ads' && (
              <AdManager
                adSlots={adSlots} onAdd={addAdSlot} onRemove={removeAdSlot}
                onPlayAd={handlePlayAd} isPlaying={!!adPlayingId} playingId={adPlayingId} onStopAd={handleStopAd}
              />
            )}

            {activePanel === 'overlays' && (
              <div className="space-y-4">
                <OverlayEditor
                  scene={currentScene} onAdd={addOverlay} onUpdate={updateOverlay} onRemove={removeOverlay}
                />
                <div className="border-t border-border/50 pt-4">
                  <TickerEditor ticker={ticker} tickerVisible={tickerVisible} onShow={showTicker} onHide={hideTicker} />
                </div>
              </div>
            )}

            {activePanel === 'chroma' && (
              <div className="space-y-4">
                <ChromaKeyPanel settings={chromaKey} onChange={updateChromaKey} />
                <div className="p-3 rounded-xl border border-border/40 bg-secondary/5">
                  <p className="font-mono-console text-[9px] text-muted-foreground/60 leading-relaxed">
                    For best results: use a solid green or blue backdrop, ensure even lighting with no shadows, and keep your distance from the screen. Tolerance 30–50% works for most setups.
                  </p>
                </div>
              </div>
            )}

            {activePanel === 'captions' && (
              <div className="space-y-4">
                <CaptionsOverlay
                  enabled={captionsEnabled}
                  onEnable={enableCaptions}
                  onDisable={disableCaptions}
                  onCaptionUpdate={updateCaption}
                />
                <div className="p-3 rounded-xl border border-border/40 bg-secondary/5">
                  <p className="font-mono-console text-[9px] text-muted-foreground/60 leading-relaxed">
                    Captions use Web Speech API and render directly onto your program canvas. Works best in Chrome or Edge with a good microphone.
                  </p>
                </div>
              </div>
            )}

            {activePanel === 'guests' && (
              <GuestCallPanel onGuestStream={handleGuestStream} />
            )}

            {activePanel === 'analytics' && (
              <AnalyticsDashboard analytics={analytics} sceneNames={sceneNames} isLive={isActive} />
            )}

            {activePanel === 'output' && (
              <OutputPanel
                state={state} output={output} onOutputChange={setOutput}
                onStart={startOutput} onStop={stopOutput} duration={duration}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
