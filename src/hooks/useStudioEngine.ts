import { useState, useRef, useCallback, useEffect } from 'react';
import {
  StudioScene, AudioTrack, StudioState, StreamOutput, OverlayText,
  CameraDevice, TransitionType, PiPSource, StreamHealth, RundownSegment, AdSlot,
  ChromaKeySettings, BroadcastAnalytics, AutoDJState, MediaItem, Playlist, AutoDJMode,
  SceneHotkey, GuestLayout
} from '@/types/studio';
import { toast } from 'sonner';

function makeId() {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const DEFAULT_SCENES: StudioScene[] = [
  { id: makeId(), name: 'CAMERA', sourceType: 'camera', icon: '🎥', overlays: [], category: 'main' },
  { id: makeId(), name: 'CAM 2', sourceType: 'camera', icon: '📷', overlays: [], category: 'main' },
  { id: makeId(), name: 'VIDEO', sourceType: 'video', icon: '🎬', overlays: [], category: 'main' },
  { id: makeId(), name: 'PHOTO', sourceType: 'image', icon: '🖼', overlays: [], category: 'main' },
  {
    id: makeId(), name: 'INTRO', sourceType: 'color', bgColor: '#0d0d1a', icon: '▶', category: 'transition',
    overlays: [
      { id: 'ov1', text: 'STARTING SOON', x: 50, y: 40, fontSize: 56, color: '#ffffff', bgColor: 'transparent', bold: true, visible: true },
      { id: 'ov2', text: 'Live Broadcast', x: 50, y: 58, fontSize: 26, color: '#cc3333', bgColor: 'transparent', bold: false, visible: true },
    ]
  },
  {
    id: makeId(), name: 'BRB', sourceType: 'color', bgColor: '#0a0a0a', icon: '⏸', category: 'transition',
    overlays: [
      { id: 'ov3', text: 'BE RIGHT BACK', x: 50, y: 45, fontSize: 60, color: '#ff3333', bgColor: 'transparent', bold: true, visible: true },
      { id: 'ov4', text: 'Back in a moment...', x: 50, y: 60, fontSize: 24, color: '#aaaaaa', bgColor: 'transparent', bold: false, visible: true },
    ]
  },
  {
    id: makeId(), name: 'AD BREAK', sourceType: 'color', bgColor: '#1a0a00', icon: '📢', category: 'ad',
    overlays: [
      { id: 'ov5', text: 'AD BREAK', x: 50, y: 45, fontSize: 60, color: '#ff9900', bgColor: 'transparent', bold: true, visible: true },
      { id: 'ov6', text: "We'll be right back after these messages", x: 50, y: 62, fontSize: 22, color: '#ffcc66', bgColor: 'transparent', bold: false, visible: true },
    ]
  },
  {
    id: makeId(), name: 'WEATHER', sourceType: 'color', bgColor: '#001a2e', icon: '🌤', category: 'graphics',
    overlays: [
      { id: 'ov7', text: 'WEATHER UPDATE', x: 50, y: 30, fontSize: 44, color: '#66ccff', bgColor: 'transparent', bold: true, visible: true },
      { id: 'ov8', text: 'Live Forecast', x: 50, y: 52, fontSize: 28, color: '#ffffff', bgColor: 'transparent', bold: false, visible: true },
    ]
  },
  {
    id: makeId(), name: 'BREAKING', sourceType: 'color', bgColor: '#1a0000', icon: '🚨', category: 'graphics',
    overlays: [
      { id: 'ov9', text: '⚡ BREAKING NEWS', x: 50, y: 40, fontSize: 52, color: '#ff0000', bgColor: 'transparent', bold: true, visible: true },
      { id: 'ov10', text: 'Developing story — stay tuned', x: 50, y: 60, fontSize: 24, color: '#ffffff', bgColor: 'transparent', bold: false, visible: true },
    ]
  },
  {
    id: makeId(), name: 'SPONSOR', sourceType: 'color', bgColor: '#0a1a0a', icon: '🤝', category: 'ad',
    overlays: [
      { id: 'ov11', text: 'BROUGHT TO YOU BY', x: 50, y: 38, fontSize: 32, color: '#88cc88', bgColor: 'transparent', bold: false, visible: true },
      { id: 'ov12', text: 'Our Sponsor', x: 50, y: 56, fontSize: 52, color: '#ffffff', bgColor: 'transparent', bold: true, visible: true },
    ]
  },
  {
    id: makeId(), name: 'OUTRO', sourceType: 'color', bgColor: '#0d1a0d', icon: '🔚', category: 'transition',
    overlays: [
      { id: 'ov13', text: 'THANKS FOR WATCHING', x: 50, y: 40, fontSize: 44, color: '#ffffff', bgColor: 'transparent', bold: true, visible: true },
      { id: 'ov14', text: 'Like · Share · Subscribe', x: 50, y: 58, fontSize: 26, color: '#44cc44', bgColor: 'transparent', bold: false, visible: true },
    ]
  },
  {
    id: makeId(), name: 'MUSIC', sourceType: 'color', bgColor: '#0a001a', icon: '🎵', category: 'main',
    overlays: [
      { id: 'ov15', text: '🎵 NOW PLAYING', x: 50, y: 30, fontSize: 36, color: '#c084fc', bgColor: 'transparent', bold: true, visible: true },
      { id: 'ov16', text: 'AutoDJ Radio', x: 50, y: 55, fontSize: 48, color: '#ffffff', bgColor: 'transparent', bold: false, visible: true },
    ]
  },
];

const DEFAULT_AUDIO: AudioTrack[] = [
  { id: 'mic', name: 'Microphone', type: 'mic', volume: 85, muted: false, level: 0 },
  { id: 'vid-audio', name: 'Video Audio', type: 'video', volume: 100, muted: false, level: 0 },
  { id: 'music', name: 'Background Music', type: 'music', volume: 70, muted: false, level: 0 },
];

const DEFAULT_OUTPUT: StreamOutput = {
  mode: 'record',
  whipUrl: '',
  rtmpUrl: '',
  streamKey: '',
  platform: 'youtube',
  resolution: '1280x720',
  fps: 30,
  bitrate: 4000,
  folderHandle: null,
};

const DEFAULT_PIP: PiPSource = { enabled: false, position: 'bottom-right', size: 25 };
const DEFAULT_HEALTH: StreamHealth = { estimatedBitrate: 0, droppedFrames: 0, encoderStatus: 'idle', score: 100, latencyMs: 0, packetsLost: 0 };
const DEFAULT_CHROMA: ChromaKeySettings = { enabled: false, color: '#00b140', tolerance: 40, softness: 20 };
const DEFAULT_ANALYTICS: BroadcastAnalytics = {
  sessionStart: Date.now(), sessionEnd: null, totalDuration: 0, sceneSwitches: [],
  healthHistory: [], peakBitrate: 0, avgBitrate: 0, adBreaks: 0, tickerMessages: 0, sceneUsage: {},
};
const DEFAULT_AUTODJ: AutoDJState = {
  enabled: false, status: 'idle', mode: 'automatic', currentPlaylistId: null,
  currentIndex: 0, currentItem: null, nextItem: null, crossfadeDuration: 3,
  songsUntilAd: 5, adInterval: 5, autoSwitchToLive: true, graceBeforeReturn: 10,
};

const RESOLUTION_MAP: Record<string, [number, number]> = {
  '3840x2160': [3840, 2160],
  '1920x1080': [1920, 1080],
  '1280x720': [1280, 720],
  '854x480': [854, 480],
};

const CANVAS_W = 1280;
const CANVAS_H = 720;

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function applyChromaKey(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, tolerance: number, softness: number) {
  const [kr, kg, kb] = hexToRgb(color);
  const tol = tolerance * 2.55;
  const soft = Math.max(1, softness * 0.5);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const dist = Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2);
    if (dist < tol) { data[i + 3] = 0; }
    else if (dist < tol + soft) { data[i + 3] = Math.round(((dist - tol) / soft) * 255); }
  }
  ctx.putImageData(imageData, 0, 0);
}

function getBestMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
  ];
  return candidates.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
}

export function useStudioEngine() {
  const [scenes, setScenes] = useState<StudioScene[]>(DEFAULT_SCENES);
  const [currentSceneId, setCurrentSceneId] = useState(DEFAULT_SCENES[0].id);
  const [previewSceneId, setPreviewSceneId] = useState(DEFAULT_SCENES[1].id);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>(DEFAULT_AUDIO);
  const [output, setOutputState] = useState<StreamOutput>(DEFAULT_OUTPUT);
  const [isLive, setIsLive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [pipStream, setPipStream] = useState<MediaStream | null>(null);
  const [guestStream, setGuestStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [ticker, setTicker] = useState('');
  const [tickerVisible, setTickerVisible] = useState(false);
  const [captions, setCaptions] = useState('');
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [chatOverlayEnabled, setChatOverlayEnabled] = useState(false);
  const [pinnedChatMessage, setPinnedChatMessage] = useState<{ author: string; text: string } | null>(null);
  const [transition, setTransition] = useState<TransitionType>('cut');
  const [transitionDuration, setTransitionDuration] = useState(300);
  const [pip, setPip] = useState<PiPSource>(DEFAULT_PIP);
  const [health, setHealth] = useState<StreamHealth>(DEFAULT_HEALTH);
  const [chromaKey, setChromaKey] = useState<ChromaKeySettings>(DEFAULT_CHROMA);
  const [analytics, setAnalytics] = useState<BroadcastAnalytics>({ ...DEFAULT_ANALYTICS, sessionStart: Date.now() });
  const [rundown, setRundown] = useState<RundownSegment[]>([]);
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [autoDJ, setAutoDJ] = useState<AutoDJState>({ ...DEFAULT_AUTODJ });
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [hotkeys, setHotkeys] = useState<SceneHotkey[]>([]);
  const [guestLayout, setGuestLayout] = useState<GuestLayout>('duo');
  const [listenerCount, setListenerCount] = useState(0);
  const [stationName, setStationName] = useState('My Radio Station');

  // Automation state
  const [autoPilot, setAutoPilot] = useState(false);
  const [rundownCurrentIndex, setRundownCurrentIndex] = useState(0);

  // Recording cloud upload state
  const [lastRecordingBlob, setLastRecordingBlob] = useState<{ blob: Blob; name: string } | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const videoElemRef = useRef<HTMLVideoElement | null>(null);
  const mediaVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaImageRef = useRef<HTMLImageElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const guestVideoRef = useRef<HTMLVideoElement | null>(null);
  // AutoDJ audio element — created once, reused
  const autoDJAudioRef = useRef<HTMLAudioElement | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const vidGainRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const autoDJSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const rafRef = useRef<number | null>(null);
  const previewRafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('video/webm');
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const healthRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerXRef = useRef(CANVAS_W);
  const captionTextRef = useRef('');
  const captionVisibleUntilRef = useRef(0);
  const pinnedChatRef = useRef<{ author: string; text: string; until: number } | null>(null);
  const bytesRef = useRef(0);
  const lastByteTimeRef = useRef(Date.now());
  const folderWriterRef = useRef<FileSystemWritableFileStream | null>(null);
  const transitionRef = useRef<{ active: boolean; alpha: number; direction: number }>({ active: false, alpha: 1, direction: -1 });
  const scenesRef = useRef<StudioScene[]>(scenes);
  const currentSceneIdRef = useRef(currentSceneId);
  const analyticsDataRef = useRef<BroadcastAnalytics>({ ...DEFAULT_ANALYTICS, sessionStart: Date.now() });
  const sceneTimerRef = useRef<{ id: string; start: number } | null>(null);
  const autoDJRef = useRef<AutoDJState>(autoDJ);
  const playlistsRef = useRef<Playlist[]>(playlists);
  const chatOverlayEnabledRef = useRef(chatOverlayEnabled);
  const autoPilotRef = useRef(autoPilot);
  const rundownRef = useRef<RundownSegment[]>(rundown);
  const rundownIndexRef = useRef(rundownCurrentIndex);
  const autoPilotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stream recovery
  const whipPcRef = useRef<RTCPeerConnection | null>(null);
  const streamRecoveryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRecoveryAttemptsRef = useRef(0);
  const programStreamRef = useRef<MediaStream | null>(null);

  scenesRef.current = scenes;
  currentSceneIdRef.current = currentSceneId;
  autoDJRef.current = autoDJ;
  playlistsRef.current = playlists;
  chatOverlayEnabledRef.current = chatOverlayEnabled;
  autoPilotRef.current = autoPilot;
  rundownRef.current = rundown;
  rundownIndexRef.current = rundownCurrentIndex;

  // ── Enumerate cameras ─────────────────────────────────────────────────────
  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput').map(d => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${d.deviceId.slice(0, 6)}`,
      }));
      setCameras(videoDevices);
    } catch { console.log('Could not enumerate cameras'); }
  }, []);

  useEffect(() => { enumerateCameras(); }, [enumerateCameras]);

  // ── Audio context ─────────────────────────────────────────────────────────
  const initAudio = useCallback(async (stream?: MediaStream) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      if (!destRef.current) destRef.current = ctx.createMediaStreamDestination();
      if (!micGainRef.current) { micGainRef.current = ctx.createGain(); micGainRef.current.connect(destRef.current); }
      if (!vidGainRef.current) { vidGainRef.current = ctx.createGain(); vidGainRef.current.connect(destRef.current); }
      if (!musicGainRef.current) {
        musicGainRef.current = ctx.createGain();
        musicGainRef.current.gain.value = 0.7;
        musicGainRef.current.connect(destRef.current);
      }
      if (!analyserRef.current) {
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.connect(ctx.destination);
      }
      if (stream) {
        if (micSourceRef.current) { try { micSourceRef.current.disconnect(); } catch {} }
        micSourceRef.current = ctx.createMediaStreamSource(stream);
        micSourceRef.current.connect(micGainRef.current);
        micSourceRef.current.connect(analyserRef.current);
      }
    } catch (err) { console.error('Audio init:', err); }
  }, []);

  // ── Setup AutoDJ audio element on first mount ─────────────────────────────
  const ensureAutoDJAudio = useCallback(() => {
    if (!autoDJAudioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      autoDJAudioRef.current = audio;
    }
    // Connect to audio context if not already done
    if (autoDJAudioRef.current && audioCtxRef.current && !autoDJSourceRef.current) {
      try {
        autoDJSourceRef.current = audioCtxRef.current.createMediaElementSource(autoDJAudioRef.current);
        if (musicGainRef.current) {
          autoDJSourceRef.current.connect(musicGainRef.current);
        } else {
          autoDJSourceRef.current.connect(audioCtxRef.current.destination);
        }
      } catch {
        // Already connected or error — ignore
      }
    }
    return autoDJAudioRef.current;
  }, []);

  const syncAudioGains = useCallback(() => {
    const micTrack = audioTracks.find(t => t.id === 'mic');
    const vidTrack = audioTracks.find(t => t.id === 'vid-audio');
    const musicTrack = audioTracks.find(t => t.id === 'music');
    if (micGainRef.current && micTrack) micGainRef.current.gain.value = micTrack.muted ? 0 : micTrack.volume / 100;
    if (vidGainRef.current && vidTrack) vidGainRef.current.gain.value = vidTrack.muted ? 0 : vidTrack.volume / 100;
    if (musicGainRef.current && musicTrack) musicGainRef.current.gain.value = musicTrack.muted ? 0 : musicTrack.volume / 100;
  }, [audioTracks]);

  useEffect(() => { syncAudioGains(); }, [syncAudioGains]);

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (deviceId?: string, facing?: 'user' | 'environment') => {
    try {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      const fm = facing ?? facingMode;
      const videoConstraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 3840, min: 1280 }, height: { ideal: 2160, min: 720 }, frameRate: { ideal: 60, min: 24 } }
        : { facingMode: fm, width: { ideal: 3840, min: 1280 }, height: { ideal: 2160, min: 720 }, frameRate: { ideal: 60, min: 24 } };
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000, channelCount: 2 },
      });
      setCameraStream(stream);
      setFacingMode(fm);
      if (videoElemRef.current) {
        videoElemRef.current.srcObject = stream;
        // Critical: ensure playback rate is 1.0 (no slow motion)
        videoElemRef.current.playbackRate = 1.0;
        videoElemRef.current.play().catch(() => {});
      }
      await initAudio(stream);
      await enumerateCameras();
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      toast.success(`Camera: ${settings.width}x${settings.height} @ ${settings.frameRate}fps`);
      return stream;
    } catch {
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing ?? facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        setCameraStream(fallback);
        if (videoElemRef.current) {
          videoElemRef.current.srcObject = fallback;
          videoElemRef.current.playbackRate = 1.0;
          videoElemRef.current.play().catch(() => {});
        }
        await initAudio(fallback);
        toast.success('Camera started (1080p)');
        return fallback;
      } catch {
        toast.error('Camera access denied');
        setError('Camera permission denied');
        return null;
      }
    }
  }, [cameraStream, facingMode, initAudio, enumerateCameras]);

  const flipCamera = useCallback(async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    if (cameraStream) await startCamera(undefined, newFacing);
  }, [facingMode, cameraStream, startCamera]);

  const startPip = useCallback(async () => {
    try {
      const allCams = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = allCams.filter(d => d.kind === 'videoinput');
      let constraints: MediaStreamConstraints;
      if (videoDevs.length > 1 && cameraStream) {
        const usedId = cameraStream.getVideoTracks()[0]?.getSettings().deviceId;
        const other = videoDevs.find(d => d.deviceId !== usedId);
        constraints = { video: other ? { deviceId: { exact: other.deviceId } } : { facingMode: facingMode === 'user' ? 'environment' : 'user' }, audio: false };
      } else {
        constraints = { video: { facingMode: facingMode === 'user' ? 'environment' : 'user' }, audio: false };
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setPipStream(stream);
      if (pipVideoRef.current) {
        pipVideoRef.current.srcObject = stream;
        pipVideoRef.current.playbackRate = 1.0;
        pipVideoRef.current.play().catch(() => {});
      }
      setPip(p => ({ ...p, enabled: true }));
      toast.success('PiP camera started');
    } catch { toast.error('Could not start PiP camera'); }
  }, [cameraStream, facingMode]);

  const stopPip = useCallback(() => {
    if (pipStream) pipStream.getTracks().forEach(t => t.stop());
    setPipStream(null);
    if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
    setPip(p => ({ ...p, enabled: false }));
  }, [pipStream]);

  const stopCamera = useCallback(() => {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); }
    if (videoElemRef.current) videoElemRef.current.srcObject = null;
  }, [cameraStream]);

  const handleGuestStream = useCallback((stream: MediaStream | null, _guestId: string) => {
    setGuestStream(stream);
    if (guestVideoRef.current) {
      if (stream) {
        guestVideoRef.current.srcObject = stream;
        guestVideoRef.current.playbackRate = 1.0;
        guestVideoRef.current.play().catch(() => {});
      } else guestVideoRef.current.srcObject = null;
    }
  }, []);

  // ── Preload upcoming scenes ───────────────────────────────────────────────
  const preloadedUrlsRef = useRef<Set<string>>(new Set());

  const preloadScenes = useCallback((sceneIds: string[]) => {
    sceneIds.forEach(sceneId => {
      const scene = scenesRef.current.find(s => s.id === sceneId);
      if (!scene) return;
      if (scene.sourceType === 'video' && scene.mediaUrl && !preloadedUrlsRef.current.has(scene.mediaUrl)) {
        preloadedUrlsRef.current.add(scene.mediaUrl);
        const preloadEl = document.createElement('video');
        preloadEl.preload = 'auto';
        preloadEl.muted = true;
        preloadEl.src = scene.mediaUrl;
        preloadEl.load();
        // Load first 3s to buffer it
        preloadEl.addEventListener('canplay', () => {
          console.log(`[Preload] Buffered: ${scene.name}`);
        }, { once: true });
      } else if (scene.sourceType === 'image' && scene.imageUrl && !preloadedUrlsRef.current.has(scene.imageUrl)) {
        preloadedUrlsRef.current.add(scene.imageUrl);
        const img = new Image();
        img.src = scene.imageUrl;
      }
    });
  }, []);

  // Preload next 2 scenes whenever rundown changes
  useEffect(() => {
    if (rundown.length === 0) return;
    const currentIdx = rundown.findIndex(s => s.status === 'live');
    const nextIds = rundown.slice(currentIdx + 1, currentIdx + 3).map(s => s.sceneId);
    preloadScenes(nextIds);
  }, [rundown, preloadScenes]);

  // ── AutoDJ engine ─────────────────────────────────────────────────────────
  const autoDJPlayNext = useCallback(() => {
    const dj = autoDJRef.current;
    const pls = playlistsRef.current;
    if (!dj.currentPlaylistId) {
      toast.error('AutoDJ: Select a playlist first');
      return;
    }
    const pl = pls.find(p => p.id === dj.currentPlaylistId);
    if (!pl || pl.items.length === 0) {
      toast.error('AutoDJ: Playlist is empty — upload tracks in the Playlists tab');
      return;
    }

    const adItems = pl.items.filter(i => i.type === 'ad');
    if (dj.songsUntilAd <= 0 && adItems.length > 0) {
      const ad = adItems[Math.floor(Math.random() * adItems.length)];
      setAutoDJ(prev => ({ ...prev, currentItem: ad, nextItem: null, songsUntilAd: prev.adInterval, status: 'playing' }));
      const audio = ensureAutoDJAudio();
      if (audio) {
        audio.src = ad.url;
        audio.load();
        audio.play().catch(e => console.error('AutoDJ ad play error:', e));
        audio.onended = () => {
          if (autoDJRef.current.mode === 'automatic' && autoDJRef.current.status === 'playing') autoDJPlayNext();
        };
      }
      return;
    }

    const musicItems = pl.items.filter(i => i.type !== 'ad');
    if (musicItems.length === 0) {
      toast.error('AutoDJ: No music tracks — add music in the Playlists tab');
      return;
    }

    let idx = dj.currentIndex;
    if (pl.mode === 'shuffle') idx = Math.floor(Math.random() * musicItems.length);

    const item = musicItems[idx % musicItems.length];
    const nextItem = musicItems[(idx + 1) % musicItems.length] || null;

    setAutoDJ(prev => ({
      ...prev,
      currentItem: item,
      nextItem,
      currentIndex: idx + 1,
      songsUntilAd: Math.max(0, prev.songsUntilAd - 1),
      status: 'playing',
    }));

    const audio = ensureAutoDJAudio();
    if (audio) {
      audio.src = item.url;
      audio.load();
      audio.play().catch(e => {
        console.error('AutoDJ play error:', e);
        toast.error('AutoDJ: Could not play track — check browser audio permissions');
      });
      audio.onended = () => {
        if (autoDJRef.current.mode === 'automatic' && autoDJRef.current.status === 'playing') {
          autoDJPlayNext();
        }
      };
    }
  }, [ensureAutoDJAudio]);

  const autoDJPlay = useCallback(async () => {
    // Must create/resume audio context inside user gesture
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    if (!destRef.current) destRef.current = ctx.createMediaStreamDestination();
    if (!musicGainRef.current) {
      musicGainRef.current = ctx.createGain();
      musicGainRef.current.gain.value = 0.7;
      musicGainRef.current.connect(destRef.current);
      musicGainRef.current.connect(ctx.destination); // Also output to speakers
    }

    // Create audio element and connect
    const audio = ensureAutoDJAudio();
    if (autoDJSourceRef.current === null && audio) {
      try {
        autoDJSourceRef.current = ctx.createMediaElementSource(audio);
        autoDJSourceRef.current.connect(musicGainRef.current);
      } catch {
        // Already connected — safe to ignore
      }
    }

    const dj = autoDJRef.current;
    if (dj.status === 'paused' && audio && audio.paused && audio.src) {
      // Resume paused track
      audio.play().catch(e => console.error('Resume error:', e));
      setAutoDJ(prev => ({ ...prev, status: 'playing', enabled: true }));
      return;
    }

    setAutoDJ(prev => ({ ...prev, enabled: true, status: 'playing' }));
    autoDJPlayNext();
  }, [ensureAutoDJAudio, autoDJPlayNext]);

  const autoDJPause = useCallback(() => {
    const audio = autoDJAudioRef.current;
    if (audio) audio.pause();
    setAutoDJ(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const autoDJSkip = useCallback(() => {
    const audio = autoDJAudioRef.current;
    if (audio) { audio.pause(); audio.onended = null; }
    autoDJPlayNext();
  }, [autoDJPlayNext]);

  const autoDJStop = useCallback(() => {
    const audio = autoDJAudioRef.current;
    if (audio) { audio.pause(); audio.src = ''; audio.onended = null; }
    setAutoDJ(prev => ({ ...prev, status: 'idle', enabled: false, currentItem: null, nextItem: null }));
  }, []);

  const autoDJSetMode = useCallback((mode: AutoDJMode) => setAutoDJ(prev => ({ ...prev, mode })), []);
  const autoDJSetPlaylist = useCallback((id: string) => {
    setAutoDJ(prev => ({ ...prev, currentPlaylistId: id, currentIndex: 0 }));
  }, []);
  const autoDJSetCrossfade = useCallback((secs: number) => setAutoDJ(prev => ({ ...prev, crossfadeDuration: secs })), []);
  const autoDJSetAdInterval = useCallback((n: number) => setAutoDJ(prev => ({ ...prev, adInterval: n, songsUntilAd: n })), []);
  const autoDJToggleAutoSwitch = useCallback(() => setAutoDJ(prev => ({ ...prev, autoSwitchToLive: !prev.autoSwitchToLive })), []);

  const addPlaylist = useCallback((pl: Omit<Playlist, 'id'>) => {
    const newPl: Playlist = { ...pl, id: `pl-${Date.now()}` };
    setPlaylists(prev => [...prev, newPl]);
    return newPl.id;
  }, []);
  const removePlaylist = useCallback((id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
    setAutoDJ(prev => prev.currentPlaylistId === id ? { ...prev, currentPlaylistId: null, currentItem: null } : prev);
  }, []);
  const addMediaToPlaylist = useCallback((playlistId: string, item: Omit<MediaItem, 'id'>) => {
    const newItem: MediaItem = { ...item, id: `mi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, items: [...p.items, newItem] } : p));
    toast.success(`Added to playlist: ${item.title}`);
  }, []);
  const removeMediaFromPlaylist = useCallback((playlistId: string, itemId: string) => {
    setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, items: p.items.filter(i => i.id !== itemId) } : p));
  }, []);

  // ── TV AutoPilot — runs show automatically ────────────────────────────────
  const advanceRundown = useCallback(() => {
    const rd = rundownRef.current;
    const idx = rundownIndexRef.current;
    if (!autoPilotRef.current || rd.length === 0) return;

    const segment = rd[idx];
    if (!segment) {
      // End of rundown — restart or stop
      setAutoPilot(false);
      toast('AutoPilot: Rundown complete');
      return;
    }

    // Switch to this segment's scene
    const sceneId = segment.sceneId;
    if (sceneId) {
      setCurrentSceneId(sceneId);
      toast(`▶ AUTO: ${segment.title}`, { duration: 1200 });
    }

    // Mark as live, update rundown
    setRundown(prev => prev.map((s, i) => ({
      ...s,
      status: i === idx ? 'live' : i < idx ? 'done' : 'pending'
    })));

    const nextIdx = idx + 1;
    setRundownCurrentIndex(nextIdx);

    // Schedule next segment
    const dur = (segment.plannedDuration || 30) * 1000;
    autoPilotTimerRef.current = setTimeout(advanceRundown, dur);

    // Preload next 2 scenes
    const nextIds = rd.slice(nextIdx, nextIdx + 2).map(s => s.sceneId);
    preloadScenes(nextIds);
  }, [preloadScenes]);

  const startAutoPilot = useCallback(() => {
    if (rundown.length === 0) {
      toast.error('Add rundown segments first');
      return;
    }
    setAutoPilot(true);
    setRundownCurrentIndex(0);
    setRundown(prev => prev.map(s => ({ ...s, status: 'pending' })));
    toast.success('AutoPilot started — TV running automatically');
    setTimeout(advanceRundown, 100);
  }, [rundown, advanceRundown]);

  const stopAutoPilot = useCallback(() => {
    if (autoPilotTimerRef.current) clearTimeout(autoPilotTimerRef.current);
    setAutoPilot(false);
    toast('AutoPilot stopped');
  }, []);

  // ── Scene management ──────────────────────────────────────────────────────
  const switchScene = useCallback((id: string) => {
    const fromId = currentSceneIdRef.current;
    const toName = scenesRef.current.find(s => s.id === id)?.name ?? id;
    const now = Date.now();
    analyticsDataRef.current.sceneSwitches.push({ time: now, from: fromId, to: id });
    if (sceneTimerRef.current) {
      const elapsed = Math.floor((now - sceneTimerRef.current.start) / 1000);
      const prevId = sceneTimerRef.current.id;
      analyticsDataRef.current.sceneUsage[prevId] = (analyticsDataRef.current.sceneUsage[prevId] || 0) + elapsed;
    }
    sceneTimerRef.current = { id, start: now };
    transitionRef.current = { active: true, alpha: 1, direction: -1 };
    setCurrentSceneId(id);
    toast(`▶ ${toName}`, { duration: 800 });

    // If autoDJ is on and switching to music scene, keep playing
    if (autoDJRef.current.autoSwitchToLive && autoDJRef.current.status === 'playing') {
      // AutoDj continues in background
    }
  }, []);

  const setPreviewScene = useCallback((id: string) => setPreviewSceneId(id), []);

  const takeToProgram = useCallback(() => {
    const toId = previewSceneId;
    setCurrentSceneId(prev => {
      setPreviewSceneId(prev);
      return toId;
    });
    transitionRef.current = { active: true, alpha: 1, direction: -1 };
    const name = scenesRef.current.find(s => s.id === toId)?.name ?? '';
    toast(`▶ CUT: ${name}`, { duration: 800 });
  }, [previewSceneId]);

  const addScene = useCallback((scene: Omit<StudioScene, 'id'>) => {
    const newScene: StudioScene = { ...scene, id: makeId() };
    setScenes(prev => [...prev, newScene]);
    return newScene.id;
  }, []);

  const updateScene = useCallback((id: string, patch: Partial<StudioScene>) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const deleteScene = useCallback((id: string) => {
    setScenes(prev => {
      const next = prev.filter(s => s.id !== id);
      setCurrentSceneId(c => (c === id && next.length > 0) ? next[0].id : c);
      return next;
    });
  }, []);

  const captureSceneThumbnail = useCallback((sceneId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const capture = () => {
      const thumb = canvas.toDataURL('image/jpeg', 0.6);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, thumbnail: thumb } : s));
      toast.success('Thumbnail captured');
    };
    if ('requestIdleCallback' in window) (window as Window & typeof globalThis & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(capture);
    else setTimeout(capture, 0);
  }, []);

  // ── Audio ─────────────────────────────────────────────────────────────────
  const setTrackVolume = useCallback((id: string, volume: number) => {
    setAudioTracks(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (id === 'mic' && micGainRef.current) micGainRef.current.gain.value = t.muted ? 0 : volume / 100;
      if (id === 'vid-audio' && vidGainRef.current) vidGainRef.current.gain.value = t.muted ? 0 : volume / 100;
      if (id === 'music' && musicGainRef.current) musicGainRef.current.gain.value = t.muted ? 0 : volume / 100;
      return { ...t, volume };
    }));
  }, []);

  const toggleTrackMute = useCallback((id: string) => {
    setAudioTracks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const muted = !t.muted;
      if (id === 'mic' && micGainRef.current) micGainRef.current.gain.value = muted ? 0 : t.volume / 100;
      if (id === 'vid-audio' && vidGainRef.current) vidGainRef.current.gain.value = muted ? 0 : t.volume / 100;
      if (id === 'music' && musicGainRef.current) musicGainRef.current.gain.value = muted ? 0 : t.volume / 100;
      return { ...t, muted };
    }));
  }, []);

  // ── Media loading ─────────────────────────────────────────────────────────
  const loadMedia = useCallback((sceneId: string, url: string, type: 'video' | 'image') => {
    setScenes(prev => prev.map(s => {
      if (s.id !== sceneId) return s;
      if (type === 'video') return { ...s, mediaUrl: url, sourceType: 'video' };
      return { ...s, imageUrl: url, thumbnail: url, sourceType: 'image' };
    }));
    if (type === 'video' && mediaVideoRef.current) {
      const video = mediaVideoRef.current;
      video.src = url;
      video.loop = true;
      video.preload = 'auto';
      video.playsInline = true;
      video.muted = true;
      // Critical: force 1x playback rate to prevent slow motion
      video.playbackRate = 1.0;
      video.defaultPlaybackRate = 1.0;
      video.load();
      // Buffer the video immediately
      const canPlay = () => {
        video.playbackRate = 1.0;
        video.pause(); // Preloaded, don't auto-play
        video.removeEventListener('canplay', canPlay);
      };
      video.addEventListener('canplay', canPlay);
    }
    if (type === 'image' && mediaImageRef.current) mediaImageRef.current.src = url;
  }, []);

  // ── Canvas draw ───────────────────────────────────────────────────────────
  const drawScene = useCallback((ctx: CanvasRenderingContext2D, sceneId: string, applyChroma = false) => {
    const scene = scenesRef.current.find(s => s.id === sceneId);
    if (!scene) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (scene.sourceType === 'color' || scene.sourceType === 'text') {
      ctx.fillStyle = scene.bgColor || '#0d0d1a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    } else if (scene.sourceType === 'camera') {
      const vid = videoElemRef.current;
      if (vid && vid.readyState >= 2 && vid.videoWidth > 0) {
        if (applyChroma && chromaKey.enabled) {
          if (!offscreenRef.current) {
            offscreenRef.current = document.createElement('canvas');
            offscreenRef.current.width = CANVAS_W;
            offscreenRef.current.height = CANVAS_H;
          }
          const off = offscreenRef.current;
          const offCtx = off.getContext('2d', { willReadFrequently: true });
          if (offCtx) {
            offCtx.imageSmoothingEnabled = true;
            offCtx.imageSmoothingQuality = 'high';
            offCtx.drawImage(vid, 0, 0, CANVAS_W, CANVAS_H);
            applyChromaKey(offCtx, CANVAS_W, CANVAS_H, chromaKey.color, chromaKey.tolerance, chromaKey.softness);
            ctx.drawImage(off, 0, 0);
          }
        } else {
          ctx.drawImage(vid, 0, 0, CANVAS_W, CANVAS_H);
        }
      } else {
        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Camera not active', CANVAS_W / 2, CANVAS_H / 2);
      }
    } else if (scene.sourceType === 'video') {
      const mv = mediaVideoRef.current;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      if (mv && mv.readyState >= 2) {
        const vw = mv.videoWidth || CANVAS_W;
        const vh = mv.videoHeight || CANVAS_H;
        const scale = Math.min(CANVAS_W / vw, CANVAS_H / vh);
        const dw = vw * scale, dh = vh * scale;
        ctx.drawImage(mv, (CANVAS_W - dw) / 2, (CANVAS_H - dh) / 2, dw, dh);
      }
    } else if (scene.sourceType === 'image' && mediaImageRef.current && mediaImageRef.current.complete && mediaImageRef.current.naturalWidth > 0) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      const iw = mediaImageRef.current.naturalWidth;
      const ih = mediaImageRef.current.naturalHeight;
      const scale = Math.min(CANVAS_W / iw, CANVAS_H / ih);
      const dw = iw * scale, dh = ih * scale;
      ctx.drawImage(mediaImageRef.current, (CANVAS_W - dw) / 2, (CANVAS_H - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = scene.bgColor || '#0d0d1a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // Text overlays
    (scene.overlays || []).forEach(ov => {
      if (!ov.visible || !ov.text) return;
      const x = (ov.x / 100) * CANVAS_W;
      const y = (ov.y / 100) * CANVAS_H;
      ctx.save();
      ctx.font = `${ov.bold ? 'bold' : 'normal'} ${ov.fontSize}px Inter, sans-serif`;
      const metrics = ctx.measureText(ov.text);
      if (ov.bgColor && ov.bgColor !== 'transparent') {
        ctx.fillStyle = ov.bgColor;
        ctx.fillRect(x - metrics.width / 2 - 12, y - ov.fontSize * 0.8 - 6, metrics.width + 24, ov.fontSize + 12);
      }
      ctx.fillStyle = ov.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ov.text, x, y);
      ctx.restore();
    });
  }, [chromaKey]);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = requestAnimationFrame(renderFrame); return; }
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) { rafRef.current = requestAnimationFrame(renderFrame); return; }

    // Transition effect
    const tr = transitionRef.current;
    if (tr.active && transition !== 'cut') {
      tr.alpha += tr.direction * (16 / transitionDuration);
      if (tr.alpha <= 0) tr.direction = 1;
      if (tr.alpha >= 1) { tr.active = false; tr.alpha = 1; }
      ctx.globalAlpha = Math.max(0, Math.min(1, tr.alpha));
    } else {
      ctx.globalAlpha = 1;
      if (tr.active) tr.active = false;
    }

    drawScene(ctx, currentSceneId, true);
    ctx.globalAlpha = 1;

    // PiP overlay
    if (pip.enabled && pipVideoRef.current && pipVideoRef.current.readyState >= 2) {
      const pipW = (pip.size / 100) * CANVAS_W;
      const pipH = (pipW * 9) / 16;
      const pad = 16;
      let px = 0, py = 0;
      if (pip.position === 'top-left') { px = pad; py = pad; }
      else if (pip.position === 'top-right') { px = CANVAS_W - pipW - pad; py = pad; }
      else if (pip.position === 'bottom-left') { px = pad; py = CANVAS_H - pipH - pad; }
      else { px = CANVAS_W - pipW - pad; py = CANVAS_H - pipH - pad; }
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(px - 1, py - 1, pipW + 2, pipH + 2);
      ctx.drawImage(pipVideoRef.current, px, py, pipW, pipH);
    }

    // Guest overlay
    if (guestStream && guestVideoRef.current && guestVideoRef.current.readyState >= 2) {
      const gw = CANVAS_W * 0.28;
      const gh = gw * 9 / 16;
      const gx = 16;
      const gy = pip.enabled && pip.position === 'bottom-left' ? CANVAS_H - gh * 2 - 32 : CANVAS_H - gh - 16;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(gx - 1, gy - 1, gw + 2, gh + 2);
      ctx.drawImage(guestVideoRef.current, gx, gy, gw, gh);
      ctx.fillStyle = 'rgba(59,130,246,0.8)';
      ctx.fillRect(gx, gy, 60, 18);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('GUEST', gx + 6, gy + 9);
    }

    // AutoDJ now-playing watermark
    const dj = autoDJRef.current;
    if (dj.status === 'playing' && dj.currentItem) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, 300, 38);
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎵 ' + dj.currentItem.title.slice(0, 30), 8, 19);
    }

    // AutoPilot indicator
    if (autoPilotRef.current) {
      ctx.fillStyle = 'rgba(16,185,129,0.8)';
      ctx.fillRect(CANVAS_W - 120, 8, 112, 22);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ AUTOPILOT', CANVAS_W - 64, 19);
    }

    // Ticker
    if (tickerVisible && ticker) {
      const barH = 52, barY = CANVAS_H - barH;
      ctx.fillStyle = 'rgba(180,0,0,0.94)';
      ctx.fillRect(0, barY, CANVAS_W, barH);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(0, barY, 160, barH);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BREAKING', 80, barY + barH / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(ticker, tickerXRef.current + 170, barY + barH / 2);
      tickerXRef.current -= 2.5;
      const tw = ctx.measureText(ticker).width;
      if (tickerXRef.current < -tw) tickerXRef.current = CANVAS_W - 170;
    }

    // Captions
    if (captionsEnabled && captionTextRef.current && Date.now() < captionVisibleUntilRef.current) {
      const capH = 60;
      const capY = tickerVisible ? CANVAS_H - 52 - capH - 8 : CANVAS_H - capH - 16;
      const text = captionTextRef.current;
      ctx.font = 'bold 24px Inter, sans-serif';
      const tw = ctx.measureText(text).width;
      const capX = (CANVAS_W - tw - 32) / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(capX, capY, tw + 32, capH);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, capX + 16, capY + capH / 2);
    }

    // Pinned chat message
    const now = Date.now();
    if (chatOverlayEnabledRef.current && pinnedChatRef.current && now < pinnedChatRef.current.until) {
      const msg = pinnedChatRef.current;
      const chatY = 60;
      ctx.font = '600 14px Inter, sans-serif';
      const authorW = ctx.measureText(msg.author + ': ').width;
      ctx.font = '400 14px Inter, sans-serif';
      const textW = ctx.measureText(msg.text).width;
      const totalW = authorW + textW + 32;
      const chatX = (CANVAS_W - Math.min(totalW, CANVAS_W - 40)) / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(chatX - 8, chatY - 20, Math.min(totalW, CANVAS_W - 40) + 16, 44);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.fillText(msg.author + ': ', chatX, chatY);
      ctx.font = '400 14px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(msg.text.slice(0, 80), chatX + authorW, chatY);
    }

    rafRef.current = requestAnimationFrame(renderFrame);
  }, [currentSceneId, pip, ticker, tickerVisible, captionsEnabled, transition, transitionDuration, drawScene, guestStream]);

  const renderPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) { previewRafRef.current = requestAnimationFrame(renderPreview); return; }
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) { previewRafRef.current = requestAnimationFrame(renderPreview); return; }
    drawScene(ctx, previewSceneId, false);
    previewRafRef.current = requestAnimationFrame(renderPreview);
  }, [previewSceneId, drawScene]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(renderFrame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [renderFrame]);

  useEffect(() => {
    if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current);
    previewRafRef.current = requestAnimationFrame(renderPreview);
    return () => { if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current); };
  }, [renderPreview]);

  // Auto-play video when scene switches to video
  useEffect(() => {
    const scene = scenes.find(s => s.id === currentSceneId);
    if (!scene) return;
    if (scene.sourceType === 'video' && scene.mediaUrl && mediaVideoRef.current) {
      const mv = mediaVideoRef.current;
      if (mv.src !== scene.mediaUrl) {
        mv.src = scene.mediaUrl;
        mv.loop = true;
        mv.preload = 'auto';
        mv.playsInline = true;
        mv.muted = true;
        mv.defaultPlaybackRate = 1.0;
        mv.playbackRate = 1.0;
      }
      // Ensure playback rate is always 1.0 (never slow)
      mv.playbackRate = 1.0;
      mv.play().catch(() => {});
    }
    if (scene.sourceType === 'image' && scene.imageUrl && mediaImageRef.current) {
      mediaImageRef.current.src = scene.imageUrl;
    }
  }, [currentSceneId, scenes]);

  // Continuously enforce playbackRate = 1.0 on media video
  useEffect(() => {
    const mv = mediaVideoRef.current;
    if (!mv) return;
    const enforce = () => {
      if (mv.playbackRate !== 1.0) mv.playbackRate = 1.0;
    };
    mv.addEventListener('ratechange', enforce);
    mv.addEventListener('play', enforce);
    return () => {
      mv.removeEventListener('ratechange', enforce);
      mv.removeEventListener('play', enforce);
    };
  }, []);

  // VU meter polling
  useEffect(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    const interval = setInterval(() => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      setAudioTracks(prev => prev.map(t => t.id === 'mic' ? { ...t, level: Math.round((avg / 255) * 100) } : t));
    }, 80);
    return () => clearInterval(interval);
  }, [cameraStream]);

  // Health monitor
  useEffect(() => {
    if (!isLive && !isRecording) { setHealth(DEFAULT_HEALTH); return; }
    healthRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastByteTimeRef.current) / 1000;
      const kbps = elapsed > 0 ? Math.round((bytesRef.current * 8) / elapsed / 1000) : 0;
      bytesRef.current = 0;
      lastByteTimeRef.current = now;
      const score = kbps > 2000 ? 95 : kbps > 1000 ? 75 : kbps > 500 ? 55 : kbps > 0 ? 35 : 0;
      const status: StreamHealth['encoderStatus'] = score >= 80 ? 'encoding' : score >= 50 ? 'degraded' : score > 0 ? 'critical' : 'idle';
      setHealth(h => ({ ...h, estimatedBitrate: kbps, encoderStatus: status, score }));
      analyticsDataRef.current.healthHistory.push({ time: now, score, bitrate: kbps });
      if (kbps > analyticsDataRef.current.peakBitrate) analyticsDataRef.current.peakBitrate = kbps;
      const hist = analyticsDataRef.current.healthHistory;
      if (hist.length > 0) analyticsDataRef.current.avgBitrate = Math.round(hist.reduce((s, h) => s + h.bitrate, 0) / hist.length);
      setAnalytics({ ...analyticsDataRef.current });
    }, 1000);
    return () => { if (healthRef.current) clearInterval(healthRef.current); };
  }, [isLive, isRecording]);

  // ── WHIP stream recovery ──────────────────────────────────────────────────
  const attemptStreamRecovery = useCallback(async () => {
    if (!isLive || !programStreamRef.current) return;
    const attempt = ++streamRecoveryAttemptsRef.current;
    const delay = Math.min(5000 * Math.pow(1.5, attempt - 1), 30000);
    toast(`Stream reconnecting... attempt ${attempt} (${delay / 1000}s)`);

    streamRecoveryRef.current = setTimeout(async () => {
      try {
        const out = output;
        if (!out.whipUrl || !programStreamRef.current) return;
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }]
        });
        programStreamRef.current.getTracks().forEach(t => pc.addTrack(t, programStreamRef.current!));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const resp = await fetch(out.whipUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp', ...(out.streamKey ? { Authorization: `Bearer ${out.streamKey}` } : {}) },
          body: offer.sdp,
        });
        if (!resp.ok) throw new Error(`WHIP ${resp.status}`);
        const answer = await resp.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: answer });
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            whipPcRef.current = null;
            attemptStreamRecovery();
          } else if (pc.connectionState === 'connected') {
            streamRecoveryAttemptsRef.current = 0;
            toast.success('Stream reconnected!');
          }
        };
        whipPcRef.current = pc;
      } catch (err) {
        console.error('Recovery failed:', err);
        attemptStreamRecovery();
      }
    }, delay);
  }, [isLive, output]);

  // ── Output ────────────────────────────────────────────────────────────────
  const startOutput = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) { toast.error('Canvas not ready'); return; }
    try {
      await initAudio(cameraStream ?? undefined);
      // CRITICAL: Do NOT resize canvas during recording — keep at CANVAS_W x CANVAS_H
      // Resizing mid-recording breaks frame timing and causes slow-motion playback
      const fps = output.fps || 30;

      // Capture stream at exact fps — this is crucial for correct playback speed
      const canvasStream = canvas.captureStream(fps);
      const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

      // Add audio if available
      if (destRef.current) {
        const audioTracks = destRef.current.stream.getAudioTracks();
        tracks.push(...audioTracks);
      }

      const programStream = new MediaStream(tracks);
      programStreamRef.current = programStream;

      analyticsDataRef.current = { ...DEFAULT_ANALYTICS, sessionStart: Date.now() };
      sceneTimerRef.current = { id: currentSceneId, start: Date.now() };
      bytesRef.current = 0;
      lastByteTimeRef.current = Date.now();

      // VP8 is the safest for smooth recording across all devices
      const mimeType = getBestMimeType();
      mimeTypeRef.current = mimeType;
      const videoBitsPerSecond = output.bitrate * 1000;
      // 250ms timeslice = good balance of smooth chunks vs overhead
      const TIMESLICE_MS = 250;

      if (output.mode === 'folder') {
        let dirHandle: FileSystemDirectoryHandle;
        try {
          dirHandle = await (window as unknown as { showDirectoryPicker: (opts: object) => Promise<FileSystemDirectoryHandle> })
            .showDirectoryPicker({ mode: 'readwrite', startIn: 'videos' });
        } catch { toast.error('Folder selection cancelled'); return; }
        const fileName = `recording-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.webm`;
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        folderWriterRef.current = await fileHandle.createWritable();
        chunksRef.current = [];
        const recorder = new MediaRecorder(programStream, { mimeType, videoBitsPerSecond, audioBitsPerSecond: 128000 });
        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
            bytesRef.current += e.data.size;
            if (folderWriterRef.current) await folderWriterRef.current.write(e.data);
          }
        };
        recorder.onstop = async () => {
          if (folderWriterRef.current) { await folderWriterRef.current.close(); folderWriterRef.current = null; }
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setLastRecordingBlob({ blob, name: fileName });
          toast.success(`Saved to folder: ${fileName}`);
        };
        recorder.start(TIMESLICE_MS);
        recorderRef.current = recorder;
        setIsRecording(true);
        setDuration(0);
        durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        toast.success(`Recording to folder: ${fileName}`);

      } else if (output.mode === 'record') {
        chunksRef.current = [];
        const recorder = new MediaRecorder(programStream, { mimeType, videoBitsPerSecond, audioBitsPerSecond: 128000 });
        recorder.ondataavailable = e => {
          if (e.data.size > 0) { chunksRef.current.push(e.data); bytesRef.current += e.data.size; }
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setLastRecordingBlob({ blob, name: `broadcast-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.webm` });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `broadcast-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          toast.success('Recording downloaded — also available for cloud upload');
        };
        recorder.start(TIMESLICE_MS);
        recorderRef.current = recorder;
        setIsRecording(true);
        setDuration(0);
        durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        toast.success(`Recording started @ ${fps}fps`);

      } else if (output.mode === 'whip') {
        if (!output.whipUrl) { toast.error('Enter WHIP endpoint URL'); return; }
        streamRecoveryAttemptsRef.current = 0;
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }]
        });
        whipPcRef.current = pc;
        tracks.forEach(t => pc.addTrack(t, programStream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const resp = await fetch(output.whipUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp', ...(output.streamKey ? { Authorization: `Bearer ${output.streamKey}` } : {}) },
          body: offer.sdp,
        });
        if (!resp.ok) throw new Error(`WHIP error ${resp.status}: ${await resp.text()}`);
        const answer = await resp.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: answer });
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            toast.error('Stream dropped — attempting recovery...');
            whipPcRef.current = null;
            attemptStreamRecovery();
          } else if (pc.connectionState === 'connected') {
            streamRecoveryAttemptsRef.current = 0;
          }
        };
        setIsLive(true);
        setDuration(0);
        durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        toast.success('🔴 LIVE via WHIP WebRTC');

      } else if (output.mode === 'rtmp') {
        toast('RTMP requires relay server. Recording locally instead.', { duration: 4000 });
        chunksRef.current = [];
        const recorder = new MediaRecorder(programStream, { mimeType, videoBitsPerSecond, audioBitsPerSecond: 128000 });
        recorder.ondataavailable = e => { if (e.data.size > 0) { chunksRef.current.push(e.data); bytesRef.current += e.data.size; } };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setLastRecordingBlob({ blob, name: `rtmp-session-${new Date().toISOString().slice(0, 10)}.webm` });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `rtmp-session-${new Date().toISOString().slice(0, 10)}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        };
        recorder.start(TIMESLICE_MS);
        recorderRef.current = recorder;
        setIsLive(true);
        setDuration(0);
        durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      }
    } catch (err) {
      console.error('Output error:', err);
      toast.error(`Failed: ${(err as Error).message}`);
    }
  }, [output, cameraStream, initAudio, currentSceneId, attemptStreamRecovery]);

  const stopOutput = useCallback(async () => {
    if (streamRecoveryRef.current) clearTimeout(streamRecoveryRef.current);
    if (whipPcRef.current) { whipPcRef.current.close(); whipPcRef.current = null; }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (folderWriterRef.current) { await folderWriterRef.current.close(); folderWriterRef.current = null; }
    if (durationRef.current) clearInterval(durationRef.current);
    if (healthRef.current) clearInterval(healthRef.current);
    analyticsDataRef.current.sessionEnd = Date.now();
    setAnalytics({ ...analyticsDataRef.current });
    setIsRecording(false);
    setIsLive(false);
    setDuration(0);
    setHealth(DEFAULT_HEALTH);
    programStreamRef.current = null;
    toast('Output stopped');
  }, []);

  // ── Captions ──────────────────────────────────────────────────────────────
  const updateCaption = useCallback((text: string) => {
    captionTextRef.current = text;
    captionVisibleUntilRef.current = Date.now() + 5000;
    setCaptions(text);
  }, []);
  const enableCaptions = useCallback(() => setCaptionsEnabled(true), []);
  const disableCaptions = useCallback(() => { setCaptionsEnabled(false); captionTextRef.current = ''; }, []);

  // ── Chat overlay ──────────────────────────────────────────────────────────
  const pinChatMessage = useCallback((msg: { author: string; text: string }) => {
    pinnedChatRef.current = { ...msg, until: Date.now() + 10000 };
    setPinnedChatMessage(msg);
  }, []);
  const unpinChatMessage = useCallback(() => {
    pinnedChatRef.current = null;
    setPinnedChatMessage(null);
  }, []);
  const toggleChatOverlay = useCallback(() => setChatOverlayEnabled(v => !v), []);

  // ── Ticker ────────────────────────────────────────────────────────────────
  const showTicker = useCallback((text: string) => {
    setTicker(text); setTickerVisible(true); tickerXRef.current = CANVAS_W;
  }, []);
  const hideTicker = useCallback(() => setTickerVisible(false), []);

  // ── Overlays ──────────────────────────────────────────────────────────────
  const addOverlay = useCallback((sceneId: string, ov: Omit<OverlayText, 'id'>) => {
    const overlay: OverlayText = { ...ov, id: `ov-${Date.now()}` };
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, overlays: [...(s.overlays || []), overlay] } : s));
  }, []);
  const updateOverlay = useCallback((sceneId: string, ovId: string, patch: Partial<OverlayText>) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, overlays: (s.overlays || []).map(o => o.id === ovId ? { ...o, ...patch } : o) } : s));
  }, []);
  const removeOverlay = useCallback((sceneId: string, ovId: string) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, overlays: (s.overlays || []).filter(o => o.id !== ovId) } : s));
  }, []);
  const replaceOverlays = useCallback((sceneId: string, overlays: Omit<OverlayText, 'id'>[]) => {
    const withIds: OverlayText[] = overlays.map((ov, i) => ({ ...ov, id: `ov-lt-${Date.now()}-${i}` }));
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, overlays: withIds } : s));
  }, []);
  const clearOverlays = useCallback((sceneId: string) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, overlays: [] } : s));
  }, []);

  // ── Rundown ───────────────────────────────────────────────────────────────
  const addRundownSegment = useCallback((seg: Omit<RundownSegment, 'id'>) => {
    setRundown(prev => [...prev, { ...seg, id: `rd-${Date.now()}` }]);
  }, []);
  const removeRundownSegment = useCallback((id: string) => setRundown(prev => prev.filter(s => s.id !== id)), []);
  const updateRundownSegment = useCallback((id: string, patch: Partial<RundownSegment>) => {
    setRundown(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  // ── Ads ───────────────────────────────────────────────────────────────────
  const addAdSlot = useCallback((ad: Omit<AdSlot, 'id'>) => {
    setAdSlots(prev => [...prev, { ...ad, id: `ad-${Date.now()}` }]);
  }, []);
  const removeAdSlot = useCallback((id: string) => setAdSlots(prev => prev.filter(a => a.id !== id)), []);

  // ── Chroma ────────────────────────────────────────────────────────────────
  const updateChromaKey = useCallback((patch: Partial<ChromaKeySettings>) => {
    setChromaKey(prev => ({ ...prev, ...patch }));
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current);
      if (durationRef.current) clearInterval(durationRef.current);
      if (healthRef.current) clearInterval(healthRef.current);
      if (autoPilotTimerRef.current) clearTimeout(autoPilotTimerRef.current);
      if (streamRecoveryRef.current) clearTimeout(streamRecoveryRef.current);
      cameraStream?.getTracks().forEach(t => t.stop());
      pipStream?.getTracks().forEach(t => t.stop());
      autoDJAudioRef.current?.pause();
    };
  }, [cameraStream, pipStream]);

  const state: StudioState = {
    currentSceneId, previewSceneId, scenes, audioTracks, output,
    isLive, isRecording, duration, error, transition, transitionDuration,
    pip, health, chromaKey, captions, captionsEnabled,
    chatOverlayEnabled, pinnedChatMessage,
  };

  return {
    state, cameras, cameraStream, pipStream, guestStream, facingMode,
    ticker, tickerVisible, rundown, adSlots, analytics, autoDJ, playlists,
    hotkeys, guestLayout, listenerCount, stationName,
    autoPilot, rundownCurrentIndex, lastRecordingBlob,
    analyser: analyserRef.current,
    canvasRef, previewCanvasRef, videoElemRef, mediaVideoRef, mediaImageRef, pipVideoRef, guestVideoRef,
    startCamera, stopCamera, flipCamera, startPip, stopPip,
    switchScene, setPreviewScene, takeToProgram,
    addScene, updateScene, deleteScene, captureSceneThumbnail,
    setTrackVolume, toggleTrackMute,
    loadMedia, startOutput, stopOutput,
    setOutput: (patch: Partial<StreamOutput>) => setOutputState(prev => ({ ...prev, ...patch })),
    setTransition, setTransitionDuration,
    setPip, addOverlay, updateOverlay, removeOverlay, replaceOverlays, clearOverlays,
    showTicker, hideTicker,
    addRundownSegment, removeRundownSegment, updateRundownSegment,
    addAdSlot, removeAdSlot,
    updateChromaKey,
    handleGuestStream, updateCaption, enableCaptions, disableCaptions,
    pinChatMessage, unpinChatMessage, toggleChatOverlay,
    autoDJPlay, autoDJPause, autoDJSkip, autoDJStop, autoDJSetMode, autoDJSetPlaylist,
    autoDJSetCrossfade, autoDJSetAdInterval, autoDJToggleAutoSwitch,
    addPlaylist, removePlaylist, addMediaToPlaylist, removeMediaFromPlaylist,
    setHotkeys: (h: SceneHotkey[]) => setHotkeys(h),
    setGuestLayout, setListenerCount, setStationName,
    startAutoPilot, stopAutoPilot,
    preloadScenes,
    clearLastRecording: () => setLastRecordingBlob(null),
  };
}
