import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import SceneGrid from '@/components/features/SceneGrid';
import AudioMixer from '@/components/features/AudioMixer';
import MediaLibrary from '@/components/features/MediaLibrary';
import ConnectionModal from '@/components/features/ConnectionModal';
import DisconnectedOverlay from '@/components/features/DisconnectedOverlay';
import StreamDashboard from '@/components/features/StreamDashboard';
import HotkeyHandler from '@/components/features/HotkeyHandler';
import EventLog from '@/components/features/EventLog';
import SceneSequencer from '@/components/features/SceneSequencer';
import StreamDestinations from '@/components/features/StreamDestinations';
import ChatOverlay from '@/components/features/ChatOverlay';
import RecordingManager from '@/components/features/RecordingManager';
import AudioAutoSwitcher from '@/components/features/AudioAutoSwitcher';
import BroadcastTimer from '@/components/features/BroadcastTimer';
import HotkeyRemapper, { loadHotkeys, HotkeyConfig } from '@/components/features/HotkeyRemapper';
import MobileQuickDock from '@/components/features/MobileQuickDock';
import OBSSourceEditor from '@/components/features/OBSSourceEditor';
import StreamSchedulePlanner from '@/components/features/StreamSchedulePlanner';
import LowerThirdTicker from '@/components/features/LowerThirdTicker';
import MultiViewMonitor from '@/components/features/MultiViewMonitor';
import GuestManager from '@/components/features/GuestManager';
import OBSTextOverlayEditor from '@/components/features/OBSTextOverlayEditor';
import RecordingAutoSplitter from '@/components/features/RecordingAutoSplitter';
import BroadcastRundownExport from '@/components/features/BroadcastRundownExport';
import OBSPluginMarketplace from '@/components/features/OBSPluginMarketplace';
import { useOBSController } from '@/hooks/useOBSController';

// ── Tab definitions ──────────────────────────────────────────────────────────
type Tab = 'control' | 'media' | 'tools' | 'plugins';

const TABS: { id: Tab; label: string }[] = [
  { id: 'control', label: 'Control' },
  { id: 'media', label: 'Media' },
  { id: 'tools', label: 'Tools' },
  { id: 'plugins', label: 'Plugins' },
];

// ── Schedule segment shim (for rundown export) ──────────────────────────────
interface ScheduleSeg {
  label: string;
  startTime: string;
  durationMinutes: number;
  scene?: string;
  color: string;
}

export default function Index() {
  const [connModalOpen, setConnModalOpen] = useState(false);
  const [hotkeyRemapperOpen, setHotkeyRemapperOpen] = useState(false);
  const [hotkeys, setHotkeys] = useState<HotkeyConfig[]>(loadHotkeys);
  const [activeTab, setActiveTab] = useState<Tab>('control');
  const [scheduleSegments] = useState<ScheduleSeg[]>([
    { label: 'Pre-Show', startTime: '20:00', durationMinutes: 5, scene: 'INTRO', color: 'bg-emerald-500' },
    { label: 'Opening', startTime: '20:05', durationMinutes: 10, scene: 'LIVE CAMERA', color: 'bg-blue-500' },
    { label: 'Main Segment', startTime: '20:15', durationMinutes: 30, scene: 'LIVE CAMERA', color: 'bg-amber-500' },
    { label: 'Ad Break', startTime: '20:45', durationMinutes: 5, scene: 'ADVERTISEMENT', color: 'bg-rose-500' },
    { label: 'Closing', startTime: '20:50', durationMinutes: 10, scene: 'OUTRO', color: 'bg-purple-500' },
  ]);

  const {
    status,
    activeProfile,
    currentScene,
    scenes,
    audioSources,
    streamStatus,
    transition,
    bitrateHistory,
    uploadedMedia,
    isRealOBS,
    events,
    recordings,
    connect,
    disconnect,
    switchScene,
    setVolume,
    toggleMute,
    toggleStream,
    toggleRecord,
    toggleScreenRecording,
    setTransition,
    playMedia,
    addUploadedMedia,
    removeUploadedMedia,
    clearEvents,
    logFromChild,
    deleteRecording,
  } = useOBSController();

  const isConnected = status === 'connected';
  const disabled = !isConnected;
  const sceneNames = scenes.map(s => s.sceneName);
  const sessionEvents = events.map(e => ({ timestamp: e.timestamp, message: e.message }));
  // Read guests list for rundown export — only used in tools tab, safe to read on render
  const guests = (() => {
    try { return JSON.parse(localStorage.getItem('obs-guests-v1') || '[]') as { name: string; role: string; platform: string }[]; }
    catch { return []; }
  })();

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <TopBar
        status={status}
        activeProfile={activeProfile}
        streamStatus={streamStatus}
        isRealOBS={isRealOBS}
        hotkeys={hotkeys}
        onOpenConnection={() => setConnModalOpen(true)}
        onDisconnect={disconnect}
        onToggleStream={toggleStream}
        onToggleRecord={toggleRecord}
        onToggleScreenRecording={toggleScreenRecording}
        onOpenHotkeyRemapper={() => setHotkeyRemapperOpen(true)}
      />

      {/* Hotkey handler */}
      <HotkeyHandler
        scenes={scenes}
        audioSources={audioSources}
        currentScene={currentScene}
        disabled={disabled}
        hotkeys={hotkeys}
        onSwitchScene={switchScene}
        onToggleMute={toggleMute}
        onToggleStream={toggleStream}
        onToggleRecord={toggleRecord}
        onToggleScreenRecording={toggleScreenRecording}
      />

      {!isConnected && status !== 'connecting' ? (
        <DisconnectedOverlay status={status} onConnect={() => setConnModalOpen(true)} />
      ) : (
        <>
          {/* ── Tab bar ── */}
          <div className="border-b border-border bg-[hsl(220,22%,6%)] px-4 shrink-0">
            <div className="flex items-center gap-1 max-w-[1800px] mx-auto">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 font-mono-console text-[11px] uppercase tracking-widest border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <main className="flex-1 overflow-auto pb-32 lg:pb-4">
            <div className="max-w-[1800px] mx-auto p-3 lg:p-4">

              {/* ═══════════ CONTROL TAB ═══════════ */}
              {activeTab === 'control' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

                  {/* ── Left column (4 cols) ── */}
                  <div className="lg:col-span-4 space-y-3">
                    {/* Scene switcher */}
                    <div className="p-4 rounded-xl border border-border bg-[hsl(var(--card))]">
                      <SceneGrid
                        scenes={scenes}
                        currentScene={currentScene}
                        transition={transition}
                        onSwitchScene={switchScene}
                        onSetTransition={setTransition}
                        disabled={disabled}
                        enableTransitionPreview={true}
                      />
                    </div>

                    {/* Multi-view monitor */}
                    <MultiViewMonitor
                      scenes={scenes}
                      currentScene={currentScene}
                      disabled={disabled}
                      onSwitchScene={switchScene}
                    />

                    {/* OBS Source editor */}
                    <OBSSourceEditor
                      currentScene={currentScene}
                      disabled={disabled}
                      isRealOBS={isRealOBS}
                      onLogEvent={logFromChild}
                    />

                    {/* OBS Text Overlay Editor */}
                    <OBSTextOverlayEditor
                      disabled={disabled}
                      isRealOBS={isRealOBS}
                      onLogEvent={logFromChild}
                    />

                    {/* Audio mixer */}
                    <div className="p-4 rounded-xl border border-border bg-[hsl(var(--card))]">
                      <AudioMixer
                        sources={audioSources}
                        onVolumeChange={setVolume}
                        onToggleMute={toggleMute}
                        disabled={disabled}
                      />
                    </div>

                    {/* Guest Manager */}
                    <GuestManager
                      disabled={disabled}
                      onLogEvent={logFromChild}
                    />

                    {/* Broadcast Timer */}
                    <BroadcastTimer streamDuration={streamStatus.duration} />

                    {/* Lower-Third Ticker */}
                    <LowerThirdTicker
                      disabled={disabled}
                      isRealOBS={isRealOBS}
                      onLogEvent={logFromChild}
                    />
                  </div>

                  {/* ── Right column (8 cols) ── */}
                  <div className="lg:col-span-8 space-y-3">
                    {/* Stream dashboard */}
                    <div className="p-4 rounded-xl border border-border bg-[hsl(var(--card))]">
                      <StreamDashboard
                        streamStatus={streamStatus}
                        bitrateHistory={bitrateHistory}
                        sessionEvents={sessionEvents}
                      />
                    </div>

                    {/* Show Schedule Planner */}
                    <StreamSchedulePlanner
                      scenes={sceneNames}
                      disabled={disabled}
                      onSwitchScene={switchScene}
                    />

                    {/* Audio auto-switcher */}
                    <AudioAutoSwitcher
                      scenes={sceneNames}
                      audioSources={audioSources}
                      currentScene={currentScene}
                      onSwitchScene={switchScene}
                      onLogEvent={logFromChild}
                      disabled={disabled}
                    />

                    {/* Scene auto-sequencer */}
                    <SceneSequencer
                      scenes={sceneNames}
                      onSwitchScene={switchScene}
                      onLogEvent={logFromChild}
                      disabled={disabled}
                    />

                    {/* Multi-stream destinations */}
                    <StreamDestinations
                      isStreaming={streamStatus.streaming}
                      onLogEvent={logFromChild}
                    />

                    {/* Recording Auto-Splitter */}
                    <RecordingAutoSplitter
                      isRecording={streamStatus.recording}
                      disabled={disabled}
                      onStartRecord={toggleRecord}
                      onStopRecord={toggleRecord}
                      onLogEvent={logFromChild}
                    />

                    {/* Chat + Recording row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <ChatOverlay disabled={disabled} />
                      <RecordingManager
                        recordings={recordings}
                        onDelete={deleteRecording}
                      />
                    </div>

                    {/* Event log */}
                    <EventLog
                      events={events}
                      onClear={clearEvents}
                    />
                  </div>
                </div>
              )}

              {/* ═══════════ MEDIA TAB ═══════════ */}
              {activeTab === 'media' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-border bg-[hsl(var(--card))]">
                    <MediaLibrary
                      uploadedMedia={uploadedMedia}
                      onPlay={playMedia}
                      onAddUpload={addUploadedMedia}
                      onRemoveUpload={removeUploadedMedia}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-3">
                    <RecordingManager recordings={recordings} onDelete={deleteRecording} />
                    <RecordingAutoSplitter
                      isRecording={streamStatus.recording}
                      disabled={disabled}
                      onStartRecord={toggleRecord}
                      onStopRecord={toggleRecord}
                      onLogEvent={logFromChild}
                    />
                  </div>
                </div>
              )}

              {/* ═══════════ TOOLS TAB ═══════════ */}
              {activeTab === 'tools' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="space-y-3">
                    <BroadcastRundownExport
                      segments={scheduleSegments}
                      guests={guests}
                      disabled={disabled}
                      onLogEvent={logFromChild}
                    />
                    <OBSTextOverlayEditor
                      disabled={disabled}
                      isRealOBS={isRealOBS}
                      onLogEvent={logFromChild}
                    />
                  </div>
                  <div className="space-y-3">
                    <StreamSchedulePlanner
                      scenes={sceneNames}
                      disabled={disabled}
                      onSwitchScene={switchScene}
                    />
                    <EventLog events={events} onClear={clearEvents} />
                  </div>
                </div>
              )}

              {/* ═══════════ PLUGINS TAB ═══════════ */}
              {activeTab === 'plugins' && (
                <div className="max-w-4xl">
                  <OBSPluginMarketplace />
                </div>
              )}

            </div>
          </main>
        </>
      )}

      {/* Connecting spinner */}
      {status === 'connecting' && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-[hsl(var(--live-red))] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono-console text-sm text-muted-foreground">Connecting to OBS...</p>
          </div>
        </div>
      )}

      {/* Mobile quick dock — only when connected */}
      {isConnected && (
        <MobileQuickDock
          scenes={scenes}
          currentScene={currentScene}
          streamStatus={streamStatus}
          audioSources={audioSources}
          disabled={disabled}
          onSwitchScene={switchScene}
          onToggleStream={toggleStream}
          onToggleRecord={toggleRecord}
          onToggleMute={toggleMute}
        />
      )}

      <ConnectionModal
        open={connModalOpen}
        onClose={() => setConnModalOpen(false)}
        onConnect={connect}
      />

      <HotkeyRemapper
        open={hotkeyRemapperOpen}
        onClose={() => setHotkeyRemapperOpen(false)}
        onHotkeysChange={setHotkeys}
      />
    </div>
  );
}
