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
import { useOBSController } from '@/hooks/useOBSController';

export default function Index() {
  const [connModalOpen, setConnModalOpen] = useState(false);
  const [hotkeyRemapperOpen, setHotkeyRemapperOpen] = useState(false);
  const [hotkeys, setHotkeys] = useState<HotkeyConfig[]>(loadHotkeys);

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
        <main className="flex-1 overflow-auto pb-32 lg:pb-4">
          <div className="max-w-[1600px] mx-auto p-3 lg:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

              {/* ── Left column ── */}
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
                  />
                </div>

                {/* Audio mixer */}
                <div className="p-4 rounded-xl border border-border bg-[hsl(var(--card))]">
                  <AudioMixer
                    sources={audioSources}
                    onVolumeChange={setVolume}
                    onToggleMute={toggleMute}
                    disabled={disabled}
                  />
                </div>

                {/* Broadcast Timer */}
                <BroadcastTimer streamDuration={streamStatus.duration} />

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
              </div>

              {/* ── Right column ── */}
              <div className="lg:col-span-8 space-y-3">
                {/* Stream dashboard */}
                <div className="p-4 rounded-xl border border-border bg-[hsl(var(--card))]">
                  <StreamDashboard
                    streamStatus={streamStatus}
                    bitrateHistory={bitrateHistory}
                    sessionEvents={sessionEvents}
                  />
                </div>

                {/* Media library */}
                <div className="p-4 rounded-xl border border-border bg-[hsl(var(--card))]">
                  <MediaLibrary
                    uploadedMedia={uploadedMedia}
                    onPlay={playMedia}
                    onAddUpload={addUploadedMedia}
                    onRemoveUpload={removeUploadedMedia}
                    disabled={disabled}
                  />
                </div>

                {/* Two-column row: Chat + Recording Manager */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ChatOverlay disabled={disabled} />
                  <RecordingManager
                    recordings={recordings}
                    onDelete={deleteRecording}
                  />
                </div>

                {/* Event log — full width at bottom */}
                <EventLog
                  events={events}
                  onClear={clearEvents}
                />
              </div>
            </div>
          </div>
        </main>
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
