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
  { id: 'music', name: 'Background Music', type: 'music', volume: 30, muted: true, level: 0 },
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

// Best supported MIME type for smooth recording
function getBestMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
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

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const videoElemRef = useRef<HTMLVideoElement | null>(null);
  const mediaVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaImageRef = useRef<HTMLImageElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const guestVideoRef = useRef<HTMLVideoElement | null>(null);
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

  scenesRef.current = scenes;
  currentSceneIdRef.current = currentSceneId;
  autoDJRef.current = autoDJ;
  playlistsRef.current = playlists;
  chatOverlayEnabledRef.current = chatOverlayEnabled;

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
      if (!musicGainRef.current) { musicGainRef.current = ctx.createGain(); musicGainRef.current.gain.value = 0.3; musicGainRef.current.connect(destRef.current); }
      if (!analyserRef.current) { analyserRef.current = ctx.createAnalyser(); analyserRef.current.fftSize = 2048; }
      if (stream) {
        if (micSourceRef.current) { try { micSourceRef.current.disconnect(); } catch {} }
        micSourceRef.current = ctx.createMediaStreamSource(stream);
        micSourceRef.current.connect(micGainRef.current);
        micSourceRef.current.connect(analyserRef.current);
      }
    } catch (err) { console.error('Audio init:', err); }
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
        videoElemRef.current.play().catch(() => {});
      }
      await initAudio(stream);
      await enumerateCameras();
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      toast.success(`Camera: ${settings.width}x${settings.height} (${fm === 'environment' ? 'Rear' : 'Front'})`);
      return stream;
    } catch {
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing ?? facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        setCameraStream(fallback);
        if (videoElemRef.current) { videoElemRef.current.srcObject = fallback; videoElemRef.current.play().catch(() => {}); }
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
      if (pipVideoRef.current) { pipVideoRef.current.srcObject = stream; pipVideoRef.current.play().catch(() => {}); }
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
      if (stream) { guestVideoRef.current.srcObject = stream; guestVideoRef.current.play().catch(() => {}); }
      else guestVideoRef.current.srcObject = null;
    }
  }, []);

  // ── AutoDJ engine ─────────────────────────────────────────────────────────
  const autoDJPlayNext = useCallback(() => {
    const dj = autoDJRef.current;
    const pls = playlistsRef.current;
    if (!dj.currentPlaylistId) return;
    const pl = pls.find(p => p.id === dj.currentPlaylistId);
    if (!pl || pl.items.length === 0) return;

    const adItems = pl.items.filter(i => i.type === 'ad');
    if (dj.songsUntilAd <= 0 && adItems.length > 0) {
      const ad = adItems[Math.floor(Math.random() * adItems.length)];
      setAutoDJ(prev => ({ ...prev, currentItem: ad, nextItem: null, songsUntilAd: prev.adInterval, status: 'playing' }));
      if (autoDJAudioRef.current) {
        autoDJAudioRef.current.src = ad.url;
        autoDJAudioRef.current.play().catch(() => {});
        autoDJAudioRef.current.onended = () => autoDJPlayNext();
      }
      return;
    }

    const musicItems = pl.items.filter(i => i.type !== 'ad');
    if (musicItems.length === 0) return;

    let idx = dj.currentIndex;
    if (pl.mode === 'shuffle') idx = Math.floor(Math.random() * musicItems.length);

    const item = musicItems[idx % musicItems.length];
    const nextItem = musicItems[(idx + 1) % musicItems.length] || null;

    setAutoDJ(prev => ({
      ...prev,
      currentItem: item,
      nextItem,
      currentIndex: idx + 1,
      songsUntilAd: prev.songsUntilAd - 1,
      status: 'playing',
    }));

    if (autoDJAudioRef.current) {
      autoDJAudioRef.current.src = item.url;
      autoDJAudioRef.current.play().catch(() => {});
      autoDJAudioRef.current.onended = () => {
        if (autoDJRef.current.mode === 'automatic' && autoDJRef.current.status === 'playing') {
          autoDJPlayNext();
        }
      };
    }
  }, []);

  const autoDJPlay = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    if (!destRef.current) destRef.current = ctx.createMediaStreamDestination();
    if (!musicGainRef.current) { musicGainRef.current = ctx.createGain(); musicGainRef.current.connect(destRef.current); }
    if (!autoDJAudioRef.current) {
      autoDJAudioRef.current = new Audio();
      autoDJAudioRef.current.crossOrigin = 'anonymous';
    }
    if (!autoDJSourceRef.current && autoDJAudioRef.current) {
      try {
        autoDJSourceRef.current = ctx.createMediaElementSource(autoDJAudioRef.current);
        autoDJSourceRef.current.connect(musicGainRef.current);
      } catch { /* already connected */ }
    }
    setAutoDJ(prev => ({ ...prev, enabled: true, status: 'playing' }));
    autoDJPlayNext();
    toast.success('AutoDJ started');
  }, [autoDJPlayNext]);

  const autoDJPause = useCallback(() => {
    if (autoDJAudioRef.current) autoDJAudioRef.current.pause();
    setAutoDJ(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const autoDJSkip = useCallback(() => {
    if (autoDJAudioRef.current) { autoDJAudioRef.current.pause(); autoDJAudioRef.current.onended = null; }
    autoDJPlayNext();
  }, [autoDJPlayNext]);

  const autoDJSetMode = useCallback((mode: AutoDJMode) => setAutoDJ(prev => ({ ...prev, mode })), []);
  const autoDJSetPlaylist = useCallback((id: string) => setAutoDJ(prev => ({ ...prev, currentPlaylistId: id, currentIndex: 0 })), []);
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
  }, []);
  const removeMediaFromPlaylist = useCallback((playlistId: string, itemId: string) => {
    setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, items: p.items.filter(i => i.id !== itemId) } : p));
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
    if ('requestIdleCallback' in window) requestIdleCallback(capture);
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
      if (type === 'video') return { ...s, mediaUrl: url };
      return { ...s, imageUrl: url, thumbnail: url };
    }));
    if (type === 'video' && mediaVideoRef.current) {
      const video = mediaVideoRef.current;
      video.src = url;
      video.loop = true;
      video.preload = 'auto';
      // Key fix: set these attributes for smooth playback
      video.playsInline = true;
      video.muted = true;
      video.load();
      // Start buffering immediately
      video.play().then(() => video.pause()).catch(() => {});
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
    } else if (scene.sourceType === 'camera' && videoElemRef.current && videoElemRef.current.readyState >= 2) {
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
          offCtx.drawImage(videoElemRef.current, 0, 0, CANVAS_W, CANVAS_H);
          applyChromaKey(offCtx, CANVAS_W, CANVAS_H, chromaKey.color, chromaKey.tolerance, chromaKey.softness);
          ctx.drawImage(off, 0, 0);
        }
      } else {
        ctx.drawImage(videoElemRef.current, 0, 0, CANVAS_W, CANVAS_H);
      }
    } else if (scene.sourceType === 'video') {
      const mv = mediaVideoRef.current;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      if (mv && mv.readyState >= 2 && !mv.paused && !mv.ended) {
        const vw = mv.videoWidth || CANVAS_W;
        const vh = mv.videoHeight || CANVAS_H;
        const scale = Math.min(CANVAS_W / vw, CANVAS_H / vh);
        const dw = vw * scale, dh = vh * scale;
        ctx.drawImage(mv, (CANVAS_W - dw) / 2, (CANVAS_H - dh) / 2, dw, dh);
      } else if (mv && mv.readyState >= 1) {
        // Draw last frame even if paused
        try { ctx.drawImage(mv, 0, 0, CANVAS_W, CANVAS_H); } catch {}
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

    // Pinned chat message overlay
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
      }
      mv.play().catch(() => {});
    } else if (mediaVideoRef.current && scene.sourceType !== 'video') {
      // Don't pause — keep buffered
    }
    if (scene.sourceType === 'image' && scene.imageUrl && mediaImageRef.current) {
      mediaImageRef.current.src = scene.imageUrl;
    }
  }, [currentSceneId, scenes]);

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
      const status = score >= 80 ? 'encoding' : score >= 50 ? 'degraded' : score > 0 ? 'critical' : 'idle';
      setHealth(h => ({ ...h, estimatedBitrate: kbps, encoderStatus: status, score }));
      analyticsDataRef.current.healthHistory.push({ time: now, score, bitrate: kbps });
      if (kbps > analyticsDataRef.current.peakBitrate) analyticsDataRef.current.peakBitrate = kbps;
      const hist = analyticsDataRef.current.healthHistory;
      if (hist.length > 0) analyticsDataRef.current.avgBitrate = Math.round(hist.reduce((s, h) => s + h.bitrate, 0) / hist.length);
      setAnalytics({ ...analyticsDataRef.current });
    }, 1000);
    return () => { if (healthRef.current) clearInterval(healthRef.current); };
  }, [isLive, isRecording]);

  // ── Output — fixed smooth recording ───────────────────────────────────────
  const startOutput = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) { toast.error('Canvas not ready'); return; }
    try {
      await initAudio(cameraStream ?? undefined);
      const [rw, rh] = RESOLUTION_MAP[output.resolution] || [1280, 720];
      canvas.width = rw;
      canvas.height = rh;

      // Use high framerate canvas stream for smooth recording
      const canvasStream = canvas.captureStream(output.fps);
      const tracks = [...canvasStream.getVideoTracks()];
      if (destRef.current) tracks.push(...destRef.current.stream.getAudioTracks());
      const programStream = new MediaStream(tracks);

      analyticsDataRef.current = { ...DEFAULT_ANALYTICS, sessionStart: Date.now() };
      sceneTimerRef.current = { id: currentSceneId, start: Date.now() };

      // Get best MIME type — avoid VP9 on mobile for smooth playback
      const mimeType = getBestMimeType();
      mimeTypeRef.current = mimeType;

      // Calculate video bitrate — ensure smooth recording
      const videoBitsPerSecond = output.bitrate * 1000;
      // Use small timeslice (100ms) for smooth chunk delivery and no stuttering
      const TIMESLICE_MS = 100;

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
          toast.success(`Saved: ${fileName}`);
        };
        // Small timeslice = smooth chunks, no buffering
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
          // Create a single clean blob from all chunks
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `broadcast-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          toast.success('Recording downloaded');
        };
        // CRITICAL: use small timeslice for smooth video with no buffering artifacts
        recorder.start(TIMESLICE_MS);
        recorderRef.current = recorder;
        setIsRecording(true);
        setDuration(0);
        durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        toast.success('Recording started — smooth 30/60fps');

      } else if (output.mode === 'whip') {
        if (!output.whipUrl) { toast.error('Enter WHIP endpoint URL'); return; }
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] });
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
            toast.error('Stream connection lost');
            setIsLive(false);
          }
        };
        setIsLive(true);
        setDuration(0);
        durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        toast.success('🔴 LIVE via WHIP WebRTC');

      } else if (output.mode === 'rtmp') {
        toast('RTMP requires a relay server (nginx-rtmp, Node-Media-Server). Starting local recording for now.', { duration: 5000 });
        chunksRef.current = [];
        const recorder = new MediaRecorder(programStream, { mimeType, videoBitsPerSecond, audioBitsPerSecond: 128000 });
        recorder.ondataavailable = e => { if (e.data.size > 0) { chunksRef.current.push(e.data); bytesRef.current += e.data.size; } };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `rtmp-session-${new Date().toISOString().slice(0, 10)}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          toast.success('Session saved');
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
  }, [output, cameraStream, initAudio, currentSceneId]);

  const stopOutput = useCallback(async () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (folderWriterRef.current) { await folderWriterRef.current.close(); folderWriterRef.current = null; }
    if (durationRef.current) clearInterval(durationRef.current);
    if (healthRef.current) clearInterval(healthRef.current);
    analyticsDataRef.current.sessionEnd = Date.now();
    setAnalytics({ ...analyticsDataRef.current });
    if (canvasRef.current) { canvasRef.current.width = CANVAS_W; canvasRef.current.height = CANVAS_H; }
    setIsRecording(false);
    setIsLive(false);
    setDuration(0);
    setHealth(DEFAULT_HEALTH);
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
    toast(`Chat pinned: "${msg.text.slice(0, 30)}…"`);
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

  // Bulk replace overlays (for lower-third templates)
  const replaceOverlays = useCallback((sceneId: string, overlays: Omit<OverlayText, 'id'>[]) => {
    const withIds: OverlayText[] = overlays.map((ov, i) => ({ ...ov, id: `ov-lt-${Date.now()}-${i}` }));
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, overlays: withIds } : s));
  }, []);
  const clearOverlays = useCallback((sceneId: string) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, overlays: [] } : s));
  }, []);

  // ── Rundown ───────────────────────────────────────────────────────────────
  const addRundownSegment = useCallback((seg: Omit<RundownSegment, 'id'>) => { setRundown(prev => [...prev, { ...seg, id: `rd-${Date.now()}` }]); }, []);
  const removeRundownSegment = useCallback((id: string) => setRundown(prev => prev.filter(s => s.id !== id)), []);
  const updateRundownSegment = useCallback((id: string, patch: Partial<RundownSegment>) => { setRundown(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s)); }, []);

  // ── Ads ───────────────────────────────────────────────────────────────────
  const addAdSlot = useCallback((ad: Omit<AdSlot, 'id'>) => { setAdSlots(prev => [...prev, { ...ad, id: `ad-${Date.now()}` }]); }, []);
  const removeAdSlot = useCallback((id: string) => setAdSlots(prev => prev.filter(a => a.id !== id)), []);

  // ── Chroma ────────────────────────────────────────────────────────────────
  const updateChromaKey = useCallback((patch: Partial<ChromaKeySettings>) => { setChromaKey(prev => ({ ...prev, ...patch })); }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current);
      if (durationRef.current) clearInterval(durationRef.current);
      if (healthRef.current) clearInterval(healthRef.current);
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
    autoDJPlay, autoDJPause, autoDJSkip, autoDJSetMode, autoDJSetPlaylist,
    autoDJSetCrossfade, autoDJSetAdInterval, autoDJToggleAutoSwitch,
    addPlaylist, removePlaylist, addMediaToPlaylist, removeMediaFromPlaylist,
    setHotkeys: (h: SceneHotkey[]) => setHotkeys(h),
    setGuestLayout, setListenerCount, setStationName,
  };
}
