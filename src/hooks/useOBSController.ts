import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ConnectionStatus, OBSProfile, OBSScene, AudioSource,
  StreamStatus, MediaItem, TransitionType, BitratePoint,
  OBSEventEntry, OBSEventSeverity, RecordingFile
} from '@/types/obs';
import {
  MOCK_SCENES, MOCK_AUDIO_SOURCES, INITIAL_STREAM_STATUS,
  simulateConnect, formatDuration, loadUploadedMedia
} from '@/lib/obs-mock';
import { toast } from 'sonner';

// ─── OBS WebSocket real integration ──────────────────────────────────────────
type OBSWSClient = {
  connect(url: string, password?: string): Promise<void>;
  disconnect(): void;
  call(requestType: string, requestData?: Record<string, unknown>): Promise<unknown>;
  on(event: string, cb: (data: unknown) => void): void;
  off(event: string, cb: (data: unknown) => void): void;
};

let OBSWebSocket: (new () => OBSWSClient) | null = null;

async function loadOBSWebSocket() {
  if (OBSWebSocket) return OBSWebSocket;
  try {
    const mod = await import('obs-websocket-js');
    OBSWebSocket = mod.default as unknown as new () => OBSWSClient;
  } catch {
    OBSWebSocket = null;
  }
  return OBSWebSocket;
}

// ─── Event log helpers ───────────────────────────────────────────────────────
let _eventCounter = 0;
function makeEvent(
  severity: OBSEventSeverity,
  category: OBSEventEntry['category'],
  message: string,
  detail?: string
): OBSEventEntry {
  _eventCounter += 1;
  return {
    id: `evt-${_eventCounter}`,
    timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    severity,
    category,
    message,
    detail,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export function useOBSController() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [activeProfile, setActiveProfile] = useState<OBSProfile | null>(null);
  const [currentScene, setCurrentScene] = useState<string>('LIVE CAMERA');
  const [scenes, setScenes] = useState<OBSScene[]>(MOCK_SCENES);
  const [audioSources, setAudioSources] = useState<AudioSource[]>(MOCK_AUDIO_SOURCES);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>(INITIAL_STREAM_STATUS);
  const [transition, setTransition] = useState<TransitionType>('Cut');
  const [streamSeconds, setStreamSeconds] = useState(0);
  const [bitrateHistory, setBitrateHistory] = useState<BitratePoint[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);
  const [isRealOBS, setIsRealOBS] = useState(false);

  // Event log
  const [events, setEvents] = useState<OBSEventEntry[]>([]);

  // Recording files (screen recordings captured in browser)
  const [recordings, setRecordings] = useState<RecordingFile[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const obsRef = useRef<OBSWSClient | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const screenChunksRef = useRef<Blob[]>([]);
  const screenStartRef = useRef<number>(0);

  // ── Event log ──────────────────────────────────────────────────────────────
  const addEvent = useCallback((
    severity: OBSEventSeverity,
    category: OBSEventEntry['category'],
    message: string,
    detail?: string
  ) => {
    setEvents(prev => [...prev.slice(-199), makeEvent(severity, category, message, detail)]);
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);

  // Convenience helper exposed to child components
  const logFromChild = useCallback((msg: string, category?: string) => {
    addEvent('info', (category as OBSEventEntry['category']) || 'system', msg);
  }, [addEvent]);

  // Load uploads from IndexedDB on mount
  useEffect(() => {
    loadUploadedMedia().then(items => setUploadedMedia(items)).catch(() => {});
  }, []);

  // ── Timers ──────────────────────────────────────────────────────────────────
  const startStreamTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setStreamSeconds(s => {
        const next = s + 1;
        const bitrate = 4800 + Math.floor(Math.random() * 800);
        const fps = 28 + Math.floor(Math.random() * 4);
        const cpu = 20 + Math.floor(Math.random() * 30);
        const dropped = Math.random() > 0.95 ? 1 : 0;
        const timeLabel = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setBitrateHistory(prev => [...prev.slice(-29), { time: timeLabel, bitrate }]);
        setStreamStatus(prev => ({
          ...prev,
          duration: formatDuration(next),
          fps,
          bitrate,
          cpuUsage: cpu,
          droppedFrames: (prev.droppedFrames ?? 0) + dropped,
        }));
        return next;
      });
    }, 1000);
  }, []);

  const stopStreamTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStreamSeconds(0);
    setBitrateHistory([]);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Real OBS WebSocket helpers ──────────────────────────────────────────────
  const obsCall = useCallback(async (type: string, data?: Record<string, unknown>) => {
    if (!obsRef.current || !isRealOBS) return null;
    try {
      return await obsRef.current.call(type, data);
    } catch (err) {
      console.warn('[OBS WS] call failed:', type, err);
      return null;
    }
  }, [isRealOBS]);

  // Screenshot polling for scene previews (real OBS only)
  useEffect(() => {
    if (!isRealOBS || status !== 'connected') return;
    let cancelled = false;
    const poll = async () => {
      for (const scene of scenes) {
        if (cancelled) break;
        const res = await obsCall('GetSourceScreenshot', {
          sourceName: scene.sceneName,
          imageFormat: 'jpg',
          imageWidth: 320,
          imageHeight: 180,
          imageCompressionQuality: 60,
        }) as { imageData?: string } | null;
        if (res?.imageData) {
          setScenes(prev =>
            prev.map(s => s.sceneName === scene.sceneName ? { ...s, previewUrl: res.imageData } : s)
          );
        }
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isRealOBS, status, scenes, obsCall]);

  // ── Connect ─────────────────────────────────────────────────────────────────
  const connect = useCallback(async (profile: OBSProfile) => {
    setStatus('connecting');
    setActiveProfile(profile);
    addEvent('info', 'connection', `Connecting to ${profile.host}:${profile.port}`, profile.name);

    const OBSClass = await loadOBSWebSocket();

    if (OBSClass) {
      const obs = new OBSClass();
      obsRef.current = obs;
      try {
        await obs.connect(`ws://${profile.host}:${profile.port}`, profile.password || undefined);
        setIsRealOBS(true);
        setStatus('connected');
        addEvent('success', 'connection', `Connected via WebSocket`, `${profile.host}:${profile.port}`);

        const sceneData = await obs.call('GetSceneList') as { scenes: { sceneName: string; sceneIndex: number }[]; currentProgramSceneName: string };
        if (sceneData?.scenes) {
          setScenes(sceneData.scenes.map((s, i) => ({ sceneName: s.sceneName, sceneIndex: i })));
        }
        if (sceneData?.currentProgramSceneName) {
          setCurrentScene(sceneData.currentProgramSceneName);
        }

        obs.on('CurrentProgramSceneChanged', (d: unknown) => {
          const data = d as { sceneName: string };
          setCurrentScene(data.sceneName);
          addEvent('info', 'scene', `Scene changed → ${data.sceneName}`);
        });

        obs.on('StreamStateChanged', (d: unknown) => {
          const data = d as { outputActive: boolean };
          setStreamStatus(prev => ({ ...prev, streaming: data.outputActive }));
          if (data.outputActive) {
            startStreamTimer();
            addEvent('success', 'stream', 'Stream started');
          } else {
            stopStreamTimer();
            setStreamStatus(prev => ({ ...prev, bitrate: 0, fps: 30 }));
            addEvent('info', 'stream', 'Stream stopped');
          }
        });

        obs.on('RecordStateChanged', (d: unknown) => {
          const data = d as { outputActive: boolean };
          setStreamStatus(prev => ({ ...prev, recording: data.outputActive }));
          addEvent('info', 'record', data.outputActive ? 'OBS recording started' : 'OBS recording stopped');
        });

        const profiles = loadProfiles();
        const updated = profiles.map(p =>
          p.id === profile.id ? { ...p, lastConnected: new Date().toISOString() } : p
        );
        saveProfiles(updated);
        toast.success(`Connected to OBS (real WebSocket): ${profile.name}`);
      } catch (err: unknown) {
        setStatus('error');
        setActiveProfile(null);
        obsRef.current = null;
        setIsRealOBS(false);
        addEvent('error', 'connection', 'Connection failed', (err as Error).message);
        toast.error((err as Error).message || 'OBS WebSocket connection failed');
      }
    } else {
      setIsRealOBS(false);
      try {
        await simulateConnect();
        setStatus('connected');
        setScenes(MOCK_SCENES);
        setCurrentScene('LIVE CAMERA');
        addEvent('success', 'connection', `Connected (demo mode)`, profile.name);
        const profiles = loadProfiles();
        const updated = profiles.map(p =>
          p.id === profile.id ? { ...p, lastConnected: new Date().toISOString() } : p
        );
        saveProfiles(updated);
        toast.success(`Connected (demo mode): ${profile.name}`);
      } catch (err: unknown) {
        setStatus('error');
        setActiveProfile(null);
        addEvent('error', 'connection', 'Demo connection failed', (err as Error).message);
        toast.error((err as Error).message || 'Connection failed');
      }
    }
  }, [addEvent, startStreamTimer, stopStreamTimer]);

  // ── Disconnect ───────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (obsRef.current && isRealOBS) {
      obsRef.current.disconnect();
      obsRef.current = null;
    }
    setIsRealOBS(false);
    setStatus('disconnected');
    setActiveProfile(null);
    stopStreamTimer();
    setStreamStatus(INITIAL_STREAM_STATUS);
    addEvent('info', 'connection', 'Disconnected from OBS');
    toast.info('Disconnected from OBS');
  }, [isRealOBS, stopStreamTimer, addEvent]);

  // ── Scene switch ─────────────────────────────────────────────────────────────
  const switchScene = useCallback(async (sceneName: string) => {
    if (status !== 'connected') return;
    setCurrentScene(sceneName);
    addEvent('info', 'scene', `Switched scene → ${sceneName}`, `transition: ${transition}`);
    if (isRealOBS) {
      await obsCall('SetCurrentProgramScene', { sceneName });
    }
    console.log(`[OBS] SetCurrentProgramScene → ${sceneName} (transition: ${transition})`);
  }, [status, isRealOBS, obsCall, transition, addEvent]);

  // ── Audio ────────────────────────────────────────────────────────────────────
  const setVolume = useCallback(async (id: string, volume: number) => {
    setAudioSources(prev => prev.map(s => s.id === id ? { ...s, volume } : s));
    if (isRealOBS) {
      await obsCall('SetInputVolume', { inputName: id, inputVolumeDb: (volume / 100) * 26 - 26 });
    }
    console.log(`[OBS] SetInputVolume → ${id}: ${volume}%`);
  }, [isRealOBS, obsCall]);

  const toggleMute = useCallback(async (id: string) => {
    setAudioSources(prev => prev.map(s => {
      if (s.id !== id) return s;
      const next = { ...s, muted: !s.muted };
      addEvent('info', 'audio', `${next.muted ? 'Muted' : 'Unmuted'}: ${next.name}`);
      toast(next.muted ? `Muted: ${next.name}` : `Unmuted: ${next.name}`);
      return next;
    }));
    if (isRealOBS) {
      await obsCall('ToggleInputMute', { inputName: id });
    }
    console.log(`[OBS] ToggleMute → ${id}`);
  }, [isRealOBS, obsCall, addEvent]);

  // ── Stream / Record ──────────────────────────────────────────────────────────
  const toggleStream = useCallback(async () => {
    if (status !== 'connected') return;
    if (isRealOBS) {
      await obsCall('ToggleStream');
    } else {
      if (streamStatus.streaming) {
        setStreamStatus(prev => ({ ...prev, streaming: false, bitrate: 0, fps: 30 }));
        stopStreamTimer();
        addEvent('info', 'stream', 'Stream stopped');
        toast.success('Stream stopped');
      } else {
        setStreamStatus(prev => ({ ...prev, streaming: true }));
        setStreamSeconds(0);
        startStreamTimer();
        addEvent('success', 'stream', 'Stream started');
        toast.success('Stream started');
      }
    }
  }, [status, isRealOBS, obsCall, streamStatus.streaming, startStreamTimer, stopStreamTimer, addEvent]);

  const toggleRecord = useCallback(async () => {
    if (status !== 'connected') return;
    if (isRealOBS) {
      await obsCall('ToggleRecord');
    } else {
      setStreamStatus(prev => {
        const next = !prev.recording;
        addEvent('info', 'record', next ? 'OBS recording started' : 'OBS recording stopped');
        toast(next ? 'Recording started' : 'Recording stopped');
        return { ...prev, recording: next };
      });
    }
  }, [status, isRealOBS, obsCall, addEvent]);

  // ── Screen recording ──────────────────────────────────────────────────────────
  const startScreenRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
      screenChunksRef.current = [];
      screenStartRef.current = Date.now();

      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
        ? 'video/webm; codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = e => { if (e.data.size > 0) screenChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(screenChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const durationSeconds = Math.floor((Date.now() - screenStartRef.current) / 1000);
        const name = `screen-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;

        // Auto-download
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();

        // Add to recordings list
        const rec: RecordingFile = {
          id: `rec-${Date.now()}`,
          name,
          startedAt: new Date(screenStartRef.current).toISOString(),
          durationSeconds,
          sizeBytes: blob.size,
          blobUrl: url,
          type: 'screen',
        };
        setRecordings(prev => [rec, ...prev]);
        addEvent('success', 'record', `Screen recording saved`, `${formatDuration(durationSeconds)} · ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
        screenChunksRef.current = [];
        setStreamStatus(prev => ({ ...prev, screenRecording: false }));
        toast.success('Screen recording saved');
      };

      stream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') recorder.stop();
      };

      recorder.start(1000);
      screenRecorderRef.current = recorder;
      setStreamStatus(prev => ({ ...prev, screenRecording: true }));
      addEvent('info', 'record', 'Screen recording started');
      toast.success('Screen recording started');
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (!msg?.includes('Permission denied') && !msg?.includes('NotAllowedError')) {
        addEvent('error', 'record', 'Screen recording failed', msg);
        toast.error('Screen recording failed: ' + msg);
      }
    }
  }, [addEvent]);

  const stopScreenRecording = useCallback(() => {
    if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
      screenRecorderRef.current.stop();
      screenRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
      screenRecorderRef.current = null;
    }
  }, []);

  const toggleScreenRecording = useCallback(() => {
    if (streamStatus.screenRecording) {
      stopScreenRecording();
    } else {
      startScreenRecording();
    }
  }, [streamStatus.screenRecording, startScreenRecording, stopScreenRecording]);

  // ── Media ─────────────────────────────────────────────────────────────────────
  const playMedia = useCallback(async (item: MediaItem) => {
    if (status !== 'connected') return;
    addEvent('info', 'media', `Playing: ${item.name}`, item.category);
    toast.success(`Playing: ${item.name}`);
    const sceneMap: Record<string, string> = {
      news: 'NEWS CLIP',
      ads: 'ADVERTISEMENT',
      podcast: currentScene,
      photos: 'PHOTO SLIDE',
    };
    const targetScene = sceneMap[item.category];
    if (targetScene) {
      setCurrentScene(targetScene);
      if (isRealOBS) {
        await obsCall('SetCurrentProgramScene', { sceneName: targetScene });
      }
    }
    console.log(`[OBS] TriggerMediaInputAction → ${item.name}`);
  }, [status, currentScene, isRealOBS, obsCall, addEvent]);

  const addUploadedMedia = useCallback((item: MediaItem) => {
    setUploadedMedia(prev => [item, ...prev]);
    addEvent('success', 'media', `Uploaded: ${item.name}`, item.type);
  }, [addEvent]);

  const removeUploadedMedia = useCallback((id: string) => {
    setUploadedMedia(prev => prev.filter(m => m.id !== id));
  }, []);

  const deleteRecording = useCallback((id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
    addEvent('info', 'record', 'Recording deleted');
  }, [addEvent]);

  return {
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
  };
}

// Profile storage helpers
export function loadProfiles(): OBSProfile[] {
  try {
    return JSON.parse(localStorage.getItem('obs-profiles') || '[]');
  } catch { return []; }
}

export function saveProfiles(profiles: OBSProfile[]): void {
  localStorage.setItem('obs-profiles', JSON.stringify(profiles));
}
