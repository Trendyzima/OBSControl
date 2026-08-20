import { useState } from 'react';
import { useStudioEngine } from '@/hooks/useStudioEngine';
import { useAuth } from '@/hooks/useAuth';
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
import AutoDJPanel from '@/components/studio/AutoDJPanel';
import MultiCameraGrid from '@/components/studio/MultiCameraGrid';
import SceneHotkeys from '@/components/studio/SceneHotkeys';
import RadioPanel from '@/components/studio/RadioPanel';
import GuestLayoutPicker from '@/components/studio/GuestLayoutPicker';
import MultiGuestGrid from '@/components/studio/MultiGuestGrid';
import AutoDJScheduler, { ScheduledSlot } from '@/components/studio/AutoDJScheduler';
import StreamDestinationManager, { StreamDestination } from '@/components/studio/StreamDestinationManager';
import LowerThirdLibrary from '@/components/studio/LowerThirdLibrary';
import ViewerChatPanel, { ChatMessage } from '@/components/studio/ViewerChatPanel';
import CloudMediaLibrary from '@/components/studio/CloudMediaLibrary';
import {
  Radio, ArrowLeft, Monitor, Layers, Mic2, Settings, Clock,
  Tv, Zap, Scissors, Captions, Users, BarChart2, Music, Grid,
  RadioTower, Cloud, MessageSquare, Layout
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AdSlot } from '@/types/studio';

type Panel =
  | 'monitor' | 'scenes' | 'audio' | 'rundown' | 'ads'
  | 'overlays' | 'output' | 'chroma' | 'captions' | 'guests'
  | 'analytics' | 'autodj' | 'grid' | 'radio' | 'cloud' | 'chat' | 'graphics';

const PANELS: { id: Panel; label: string; icon: React.ElementType }[] = [
  { id: 'monitor',  label: 'Monitor',  icon: Monitor },
  { id: 'grid',     label: 'Grid',     icon: Grid },
  { id: 'scenes',   label: 'Scenes',   icon: Layers },
  { id: 'audio',    label: 'Audio',    icon: Mic2 },
  { id: 'autodj',   label: 'AutoDJ',   icon: Music },
  { id: 'radio',    label: 'Radio',    icon: RadioTower },
  { id: 'rundown',  label: 'Rundown',  icon: Clock },
  { id: 'ads',      label: 'Ads',      icon: Tv },
  { id: 'graphics', label: 'Graphics', icon: Layout },
  { id: 'overlays', label: 'Overlay',  icon: Zap },
  { id: 'chroma',   label: 'Chroma',   icon: Scissors },
  { id: 'captions', label: 'Caption',  icon: Captions },
  { id: 'guests',   label: 'Guests',   icon: Users },
  { id: 'chat',     label: 'Chat',     icon: MessageSquare },
  { id: 'cloud',    label: 'Cloud',    icon: Cloud },
  { id: 'analytics',label: 'Analytics',icon: BarChart2 },
  { id: 'output',   label: 'Output',   icon: Settings },
];

export default function Studio() {
  const [activePanel, setActivePanel] = useState<Panel>('monitor');
  const [adPlayingId, setAdPlayingId] = useState<string | null>(null);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduledSlot[]>([]);
  const [destinations, setDestinations] = useState<StreamDestination[]>([]);
  const [guestLink, setGuestLink] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const engine = useStudioEngine();
  const {
    state, cameras, cameraStream, pipStream, guestStream, facingMode, ticker, tickerVisible,
    rundown, adSlots, analytics, autoDJ, playlists, hotkeys, guestLayout, listenerCount, stationName,
    analyser,
    canvasRef, previewCanvasRef, videoElemRef, mediaVideoRef, mediaImageRef, pipVideoRef, guestVideoRef,
    startCamera, stopCamera, flipCamera, startPip, stopPip,
    switchScene, setPreviewScene, takeToProgram,
    addScene, updateScene, deleteScene, captureSceneThumbnail,
    setTrackVolume, toggleTrackMute,
    loadMedia, startOutput, stopOutput, setOutput,
    setTransition, setTransitionDuration,
    setPip, addOverlay, updateOverlay, removeOverlay, replaceOverlays, clearOverlays,
    showTicker, hideTicker,
    addRundownSegment, removeRundownSegment, updateRundownSegment,
    addAdSlot, removeAdSlot,
    updateChromaKey, handleGuestStream,
    updateCaption, enableCaptions, disableCaptions,
    pinChatMessage, unpinChatMessage, toggleChatOverlay,
    autoDJPlay, autoDJPause, autoDJSkip, autoDJSetMode, autoDJSetPlaylist,
    autoDJSetCrossfade, autoDJSetAdInterval, autoDJToggleAutoSwitch,
    addPlaylist, removePlaylist, addMediaToPlaylist, removeMediaFromPlaylist,
    setHotkeys, setGuestLayout, setListenerCount, setStationName,
    replaceOverlays: replaceOverlaysEngine,
  } = engine;

  const {
    isLive, isRecording, duration, scenes, currentSceneId, previewSceneId,
    audioTracks, output, pip, transition, transitionDuration, chromaKey, captionsEnabled, health,
    chatOverlayEnabled, pinnedChatMessage,
  } = state;

  const currentScene = scenes.find(s => s.id === currentSceneId);
  const isActive = isLive || isRecording;

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

  function handleLoadCloudMedia(url: string, type: 'video' | 'image' | 'audio', name: string) {
    if (type === 'video') {
      const videoScene = scenes.find(s => s.sourceType === 'video');
      loadMedia(videoScene?.id || currentSceneId, url, 'video');
    } else if (type === 'image') {
      const imageScene = scenes.find(s => s.sourceType === 'image');
      loadMedia(imageScene?.id || currentSceneId, url, 'image');
    }
  }

  function handleApplyLowerThird(overlays: Parameters<typeof addOverlay>[1][]) {
    if (currentScene) {
      replaceOverlays(currentScene.id, overlays);
    }
  }

  function handlePinChatMessage(msg: ChatMessage) {
    pinChatMessage({ author: msg.author, text: msg.text });
  }

  // Guest management
  const [guestList, setGuestList] = useState<{
    id: string; name: string; stream: MediaStream | null; connected: boolean; muted: boolean; onAir: boolean;
  }[]>([]);

  function handleCreateGuestLink() {
    const guestId = `g-${Math.random().toString(36).slice(2, 9)}`;
    const link = `${window.location.origin}/guest?id=${guestId}&ch=studio-guest-signal`;
    setGuestLink(link);
    navigator.clipboard?.writeText(link).then(() => {}).catch(() => {});
    return guestId;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(220,25%,3%)] overflow-x-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="h-12 flex items-center px-3 border-b border-border/50 bg-[hsl(220,22%,5%)] shrink-0 gap-3">
        <Link to="/" className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors shrink-0">
          <ArrowLeft size={15} />
        </Link>
        <div className="w-7 h-7 rounded-xl bg-emerald-600 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)] shrink-0">
          <Radio size={13} className="text-white" />
        </div>
        <div className="hidden sm:block shrink-0">
          <span className="font-mono-console text-xs font-bold tracking-widest text-foreground uppercase">Live Studio</span>
          <span className="font-mono-console text-[8px] text-muted-foreground block leading-none mt-0.5 tracking-wider">INDEPENDENT BROADCAST</span>
        </div>

        {/* Tally lights */}
        <div className="flex-1 flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar">
          {scenes.slice(0, 12).map(scene => (
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

        {/* Right status zone */}
        <div className="flex items-center gap-1.5 shrink-0">
          <SceneHotkeys
            scenes={scenes}
            hotkeys={hotkeys}
            onSwitch={switchScene}
            onTakeToProgram={takeToProgram}
            onUpdateHotkeys={setHotkeys}
          />
          {chromaKey.enabled && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 font-mono-console text-[8px] text-emerald-400">CK</span>
          )}
          {captionsEnabled && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 font-mono-console text-[8px] text-blue-400">CC</span>
          )}
          {autoDJ.status === 'playing' && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 font-mono-console text-[8px] text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />DJ
            </span>
          )}
          {user && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 font-mono-console text-[8px] text-blue-400">
              <Cloud size={8} />
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
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-600/20 border border-amber-500/40 font-mono-console text-[9px] text-amber-300 animate-pulse">AD</span>
          )}
        </div>
      </header>

      {/* ── Main layout ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ── Left: Program/Preview + quick rail ───────────────────── */}
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
              {scenes.map((scene, idx) => (
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
                  {scene.name.length > 6 ? scene.name.slice(0, 6) : scene.name}
                  {idx < 9 && <span className="ml-1 font-mono-console text-[7px] opacity-30">{idx + 1}</span>}
                </button>
              ))}
            </div>
            <p className="font-mono-console text-[7px] text-muted-foreground/30 text-center">
              Tap → Preview  ·  Double-tap → Program  ·  Keys 1–9 = scenes  ·  Space = CUT
            </p>
          </div>

          {/* Desktop secondary panel */}
          <div className="flex-1 overflow-y-auto px-2.5 lg:px-3 pb-3 lg:block hidden">
            {activePanel === 'audio' && (
              <StudioMixer tracks={audioTracks} onVolume={setTrackVolume} onMute={toggleTrackMute} analyser={analyser} />
            )}
            {activePanel === 'overlays' && (
              <div className="space-y-4">
                <OverlayEditor scene={currentScene} onAdd={addOverlay} onUpdate={updateOverlay} onRemove={removeOverlay} />
                <div className="border-t border-border pt-4">
                  <TickerEditor ticker={ticker} tickerVisible={tickerVisible} onShow={showTicker} onHide={hideTicker} />
                </div>
              </div>
            )}
            {activePanel === 'analytics' && (
              <AnalyticsDashboard analytics={analytics} sceneNames={sceneNames} isLive={isActive} />
            )}
            {activePanel === 'autodj' && (
              <AutoDJPanel
                autoDJ={autoDJ} playlists={playlists}
                onPlay={autoDJPlay} onPause={autoDJPause} onSkip={autoDJSkip}
                onSetMode={autoDJSetMode} onSetPlaylist={autoDJSetPlaylist}
                onAddPlaylist={addPlaylist} onRemovePlaylist={removePlaylist}
                onAddMediaToPlaylist={addMediaToPlaylist} onRemoveMediaFromPlaylist={removeMediaFromPlaylist}
                onSetCrossfade={autoDJSetCrossfade} onSetAdInterval={autoDJSetAdInterval}
                onToggleAutoSwitchLive={autoDJToggleAutoSwitch}
              />
            )}
          </div>
        </div>

        {/* ── Right: Control panel ────────────────────────────────────── */}
        <div className="lg:w-[380px] xl:w-[420px] flex flex-col border-t lg:border-t-0 lg:border-l border-border/50 bg-[hsl(220,20%,6%)] shrink-0">

          {/* Panel tabs */}
          <div className="flex border-b border-border/50 bg-[hsl(220,22%,5%)] overflow-x-auto no-scrollbar shrink-0">
            {PANELS.map(panel => {
              const Icon = panel.icon;
              const hasIndicator =
                (panel.id === 'autodj' && autoDJ.status === 'playing') ||
                (panel.id === 'guests' && guestList.some(g => g.connected)) ||
                (panel.id === 'chat' && !!pinnedChatMessage) ||
                (panel.id === 'cloud' && !!user);
              return (
                <button
                  key={panel.id}
                  onClick={() => setActivePanel(panel.id)}
                  className={cn(
                    'flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-2.5 border-b-2 transition-colors relative',
                    activePanel === panel.id
                      ? 'border-primary text-foreground bg-secondary/20'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon size={13} />
                  <span className="font-mono-console text-[7px] uppercase tracking-wider">{panel.label}</span>
                  {hasIndicator && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
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

            {activePanel === 'grid' && (
              <MultiCameraGrid
                scenes={scenes} currentSceneId={currentSceneId} previewSceneId={previewSceneId}
                cameraStream={cameraStream} pipStream={pipStream} guestStream={guestStream}
                onSwitch={switchScene} onPreview={setPreviewScene}
              />
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
              <StudioMixer tracks={audioTracks} onVolume={setTrackVolume} onMute={toggleTrackMute} analyser={analyser} />
            )}

            {activePanel === 'autodj' && (
              <div className="space-y-4">
                <AutoDJPanel
                  autoDJ={autoDJ} playlists={playlists}
                  onPlay={autoDJPlay} onPause={autoDJPause} onSkip={autoDJSkip}
                  onSetMode={autoDJSetMode} onSetPlaylist={autoDJSetPlaylist}
                  onAddPlaylist={addPlaylist} onRemovePlaylist={removePlaylist}
                  onAddMediaToPlaylist={addMediaToPlaylist} onRemoveMediaFromPlaylist={removeMediaFromPlaylist}
                  onSetCrossfade={autoDJSetCrossfade} onSetAdInterval={autoDJSetAdInterval}
                  onToggleAutoSwitchLive={autoDJToggleAutoSwitch}
                />
                <div className="border-t border-border/50 pt-4">
                  <AutoDJScheduler
                    slots={scheduleSlots}
                    playlists={playlists}
                    onAdd={slot => setScheduleSlots(prev => [...prev, { ...slot, id: `sched-${Date.now()}` }])}
                    onRemove={id => setScheduleSlots(prev => prev.filter(s => s.id !== id))}
                  />
                </div>
              </div>
            )}

            {activePanel === 'radio' && (
              <RadioPanel
                autoDJ={autoDJ} health={health} isLive={isLive} isRecording={isRecording}
                duration={duration} listenerCount={listenerCount} onSetListenerCount={setListenerCount}
                stationName={stationName} onSetStationName={setStationName}
              />
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

            {activePanel === 'graphics' && (
              <LowerThirdLibrary
                currentScene={currentScene}
                onApply={handleApplyLowerThird}
                onClear={() => currentScene && clearOverlays(currentScene.id)}
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
                    Use a solid green or blue backdrop with even lighting. Tolerance 30–50% works for most setups.
                  </p>
                </div>
              </div>
            )}

            {activePanel === 'captions' && (
              <CaptionsOverlay
                enabled={captionsEnabled}
                onEnable={enableCaptions}
                onDisable={disableCaptions}
                onCaptionUpdate={updateCaption}
              />
            )}

            {activePanel === 'guests' && (
              <div className="space-y-4">
                <GuestCallPanel onGuestStream={handleGuestStream} />
                <div className="border-t border-border/50 pt-4">
                  <GuestLayoutPicker
                    layout={guestLayout}
                    onChange={setGuestLayout}
                    guestCount={guestStream ? 1 : 0}
                  />
                </div>
              </div>
            )}

            {activePanel === 'chat' && (
              <ViewerChatPanel
                onPinMessage={handlePinChatMessage}
                pinnedMessage={pinnedChatMessage}
                onUnpin={unpinChatMessage}
              />
            )}

            {activePanel === 'cloud' && (
              <CloudMediaLibrary
                user={user}
                onLoadToScene={handleLoadCloudMedia}
                onSignIn={() => navigate('/auth')}
              />
            )}

            {activePanel === 'analytics' && (
              <AnalyticsDashboard analytics={analytics} sceneNames={sceneNames} isLive={isActive} />
            )}

            {activePanel === 'output' && (
              <div className="space-y-4">
                <OutputPanel
                  state={state} output={output} onOutputChange={setOutput}
                  onStart={startOutput} onStop={stopOutput} duration={duration}
                />
                <div className="border-t border-border/50 pt-4">
                  <StreamDestinationManager
                    destinations={destinations}
                    isActive={isActive}
                    onAdd={dest => setDestinations(prev => [...prev, { ...dest, id: `dest-${Date.now()}`, status: 'idle' }])}
                    onRemove={id => setDestinations(prev => prev.filter(d => d.id !== id))}
                    onToggle={id => setDestinations(prev => prev.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d))}
                    onUpdateKey={(id, key) => setDestinations(prev => prev.map(d => d.id === id ? { ...d, streamKey: key } : d))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
