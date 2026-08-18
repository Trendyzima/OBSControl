
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  StudioScene, AudioTrack, StudioState, StreamOutput, OverlayText,
  CameraDevice, TransitionType, PiPSource, StreamHealth, RundownSegment, AdSlot
} from '@/types/studio';
import { toast } from 'sonner';

function makeId() {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Default scenes ───────────────────────────────────────────────────────────
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
      { id: 'ov6', text: 'We\'ll be right back after these messages', x: 50, y: 62, fontSize: 22, color: '#ffcc66', bgColor: 'transparent', bold: false, visible: true },
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

const DEFAULT_PIP: PiPSource = {
  enabled: false,
  position: 'bottom-right',
  size: 25,
};

const DEFAULT_HEALTH: StreamHealth = {
  estimatedBitrate: 0,
  droppedFrames: 0,
  encoderStatus: 'idle',
  score: 100,
  latencyMs: 0,
  packetsLost: 0,
};

const CANVAS_W = 1280;
const CANVAS_H = 720;

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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [ticker, setTicker] = useState('');
  const [tickerVisible, setTickerVisible] = useState(false);
  const [transition, setTransition] = useState<TransitionType>('cut');
  const [transitionDuration, setTransitionDuration] = useState(300);
  const [pip, setPip] = useState<PiPSource>(DEFAULT_PIP);
  const [health, setHealth] = useState<StreamHealth>(DEFAULT_HEALTH);

  // Rundown & ads
  const [rundown, setRundown] = useState<RundownSegment[]>([]);
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElemRef = useRef<HTMLVideoElement | null>(null);
  const mediaVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaImageRef = useRef<HTMLImageElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const vidGainRef = useRef<GainNode | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const rafRef = useRef<number | null>(null);
  const previewRafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const healthRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerXRef = useRef(CANVAS_W);
  const bytesRef = useRef(0);
  const lastByteTimeRef = useRef(Date.now());
  const folderWriterRef = useRef<FileSystemWritableFileStream | null>(null);
  const transitionRef = useRef<{ active: boolean; alpha: number; direction: number }>({ active: false, alpha: 1, direction: -1 });

  // ── Enumerate cameras ─────────────────────────────────────────────────────
  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput').map(d => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${d.deviceId.slice(0, 6)}`,
      }));
      setCameras(videoDevices);
    } catch {
      console.log('Could not enumerate cameras');
    }
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
      if (!analyserRef.current) { analyserRef.current = ctx.createAnalyser(); analyserRef.current.fftSize = 256; }
      if (stream) {
        if (micSourceRef.current) micSourceRef.current.disconnect();
        micSourceRef.current = ctx.createMediaStreamSource(stream);
        micSourceRef.current.connect(micGainRef.current);
        micSourceRef.current.connect(analyserRef.current);
      }
      const micTrack = audioTracks.find(t => t.id === 'mic');
      const vidTrack = audioTracks.find(t => t.id === 'vid-audio');
      if (micGainRef.current && micTrack) micGainRef.current.gain.value = micTrack.muted ? 0 : micTrack.volume / 100;
      if (vidGainRef.current && vidTrack) vidGainRef.current.gain.value = vidTrack.muted ? 0 : vidTrack.volume / 100;
    } catch (err) { console.error('Audio init:', err); }
  }, [audioTracks]);

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async (deviceId?: string, facing?: 'user' | 'environment') => {
    try {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      const fm = facing ?? facingMode;
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: CANVAS_W }, height: { ideal: CANVAS_H } }
          : { facingMode: fm, width: { ideal: CANVAS_W }, height: { ideal: CANVAS_H } },
        audio: true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoElemRef.current) { videoElemRef.current.srcObject = stream; videoElemRef.current.play().catch(() => {}); }
      await initAudio(stream);
      await enumerateCameras();
      toast.success(`Camera started (${fm === 'environment' ? 'Rear' : 'Front'})`);
      return stream;
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Camera access denied');
      setError('Camera permission denied');
      return null;
    }
  }, [cameraStream, facingMode, initAudio, enumerateCameras]);

  // ── Flip camera ───────────────────────────────────────────────────────────
  const flipCamera = useCallback(async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    if (cameraStream) {
      await startCamera(undefined, newFacing);
    }
  }, [facingMode, cameraStream, startCamera]);

  // ── Start PiP camera ──────────────────────────────────────────────────────
  const startPip = useCallback(async () => {
    try {
      const cameras2 = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = cameras2.filter(d => d.kind === 'videoinput');
      // Use second camera if available, else use different facing mode
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
    } catch {
      toast.error('Could not start PiP camera');
    }
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

  // ── Scene management ──────────────────────────────────────────────────────
  const switchScene = useCallback((id: string) => {
    // Start transition
    transitionRef.current = { active: true, alpha: 1, direction: -1 };
    setCurrentSceneId(id);
    const name = scenes.find(s => s.id === id)?.name ?? id;
    toast(`▶ ${name}`, { duration: 800 });
  }, [scenes]);

  const setPreviewScene = useCallback((id: string) => {
    setPreviewSceneId(id);
  }, []);

  const takeToProgram = useCallback(() => {
    setCurrentSceneId(prev => {
      setPreviewSceneId(prev);
      transitionRef.current = { active: true, alpha: 1, direction: -1 };
      return previewSceneId;
    });
    toast(`▶ CUT TO PROGRAM`, { duration: 800 });
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

  // ── Capture scene thumbnail ───────────────────────────────────────────────
  const captureSceneThumbnail = useCallback((sceneId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const thumb = canvas.toDataURL('image/jpeg', 0.6);
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, thumbnail: thumb } : s));
    toast.success('Thumbnail captured');
  }, []);

  // ── Audio management ──────────────────────────────────────────────────────
  const setTrackVolume = useCallback((id: string, volume: number) => {
    setAudioTracks(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (id === 'mic' && micGainRef.current) micGainRef.current.gain.value = t.muted ? 0 : volume / 100;
      if (id === 'vid-audio' && vidGainRef.current) vidGainRef.current.gain.value = t.muted ? 0 : volume / 100;
      return { ...t, volume };
    }));
  }, []);

  const toggleTrackMute = useCallback((id: string) => {
    setAudioTracks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const muted = !t.muted;
      if (id === 'mic' && micGainRef.current) micGainRef.current.gain.value = muted ? 0 : t.volume / 100;
      if (id === 'vid-audio' && vidGainRef.current) vidGainRef.current.gain.value = muted ? 0 : t.volume / 100;
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
      mediaVideoRef.current.src = url;
      mediaVideoRef.current.loop = true;
      mediaVideoRef.current.load();
    }
    if (type === 'image' && mediaImageRef.current) {
      mediaImageRef.current.src = url;
    }
  }, []);

  // ── Canvas render ─────────────────────────────────────────────────────────
  const drawScene = useCallback((ctx: CanvasRenderingContext2D, sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (scene.sourceType === 'color' || scene.sourceType === 'text') {
      ctx.fillStyle = scene.bgColor || '#0d0d1a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    } else if (scene.sourceType === 'camera' && videoElemRef.current && videoElemRef.current.readyState >= 2) {
      ctx.drawImage(videoElemRef.current, 0, 0, CANVAS_W, CANVAS_H);
    } else if (scene.sourceType === 'video' && mediaVideoRef.current && mediaVideoRef.current.readyState >= 2) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      const vw = mediaVideoRef.current.videoWidth || CANVAS_W;
      const vh = mediaVideoRef.current.videoHeight || CANVAS_H;
      const scale = Math.min(CANVAS_W / vw, CANVAS_H / vh);
      const dw = vw * scale, dh = vh * scale;
      ctx.drawImage(mediaVideoRef.current, (CANVAS_W - dw) / 2, (CANVAS_H - dh) / 2, dw, dh);
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
      ctx.font = `${ov.bold ? 'bold' : 'normal'} ${ov.fontSize}px 'Inter', sans-serif`;
      const metrics = ctx.measureText(ov.text);
      if (ov.bgColor && ov.bgColor !== 'transparent') {
        ctx.fillStyle = ov.bgColor;
        ctx.fillRect(x - metrics.width / 2 - 12, y - ov.fontSize * 0.8 - 6, metrics.width + 24, ov.fontSize + 12);
      }
      ctx.fillStyle = ov.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ov.text, x, y);
    });
  }, [scenes]);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle fade transition
    const tr = transitionRef.current;
    if (tr.active && transition !== 'cut') {
      tr.alpha += tr.direction * (16 / transitionDuration); // ~60fps
      if (tr.alpha <= 0) {
        tr.direction = 1;
      }
      if (tr.alpha >= 1) {
        tr.active = false;
        tr.alpha = 1;
      }
      ctx.globalAlpha = Math.max(0, Math.min(1, tr.alpha));
    } else {
      ctx.globalAlpha = 1;
      if (tr.active) tr.active = false;
    }

    drawScene(ctx, currentSceneId);
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
      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(px - 1, py - 1, pipW + 2, pipH + 2);
      ctx.drawImage(pipVideoRef.current, px, py, pipW, pipH);
    }

    // News ticker
    if (tickerVisible && ticker) {
      const barH = 52;
      const barY = CANVAS_H - barH;
      ctx.fillStyle = 'rgba(180, 0, 0, 0.94)';
      ctx.fillRect(0, barY, CANVAS_W, barH);
      // Left badge
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(0, barY, 160, barH);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BREAKING', 80, barY + barH / 2);
      // Scrolling text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(ticker, tickerXRef.current + 170, barY + barH / 2);
      tickerXRef.current -= 2.5;
      const tw = ctx.measureText(ticker).width;
      if (tickerXRef.current < -tw) tickerXRef.current = CANVAS_W - 170;
    }

    rafRef.current = requestAnimationFrame(renderFrame);
  }, [currentSceneId, pip, ticker, tickerVisible, transition, transitionDuration, drawScene]);

  // Preview canvas render
  const renderPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawScene(ctx, previewSceneId);
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

  // Video playback on scene switch
  useEffect(() => {
    const scene = scenes.find(s => s.id === currentSceneId);
    if (!scene) return;
    if (scene.sourceType === 'video' && scene.mediaUrl && mediaVideoRef.current) {
      mediaVideoRef.current.src = scene.mediaUrl;
      mediaVideoRef.current.loop = true;
      mediaVideoRef.current.play().catch(() => {});
    } else if (mediaVideoRef.current && scene.sourceType !== 'video') {
      mediaVideoRef.current.pause();
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

  // ── Health monitor ────────────────────────────────────────────────────────
  useEffect(() => {
    if ((!isLive && !isRecording) || !recorderRef.current) {
      setHealth(DEFAULT_HEALTH);
      return;
    }
    healthRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastByteTimeRef.current) / 1000;
      const kbps = elapsed > 0 ? Math.round((bytesRef.current * 8) / elapsed / 1000) : 0;
      bytesRef.current = 0;
      lastByteTimeRef.current = now;
      const score = kbps > 2000 ? 95 : kbps > 1000 ? 75 : kbps > 500 ? 55 : kbps > 0 ? 35 : 0;
      const status = score >= 80 ? 'encoding' : score >= 50 ? 'degraded' : score > 0 ? 'critical' : 'idle';
      setHealth(h => ({ ...h, estimatedBitrate: kbps, encoderStatus: status, score }));
    }, 1000);
    return () => { if (healthRef.current) clearInterval(healthRef.current); };
  }, [isLive, isRecording]);

  // ── Output (Record / Folder / WHIP) ──────────────────────────────────────
  const startOutput = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) { toast.error('Canvas not ready'); return; }
    try {
      await initAudio(cameraStream ?? undefined);
      const canvasStream = canvas.captureStream(output.fps);
      const tracks = [...canvasStream.getVideoTracks()];
      if (destRef.current) tracks.push(...destRef.current.stream.getAudioTracks());
      const programStream = new MediaStream(tracks);

      if (output.mode === 'folder') {
        // File System Access API
        let dirHandle: FileSystemDirectoryHandle;
        try {
          dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite', startIn: 'videos' });
        } catch {
          toast.error('Folder selection cancelled');
          return;
        }
        const fileName = `recording-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.webm`;
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        folderWriterRef.current = await fileHandle.createWritable();

        chunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
        const recorder = new MediaRecorder(programStream, { mimeType, videoBitsPerSecond: output.bitrate * 1000 });
        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
            bytesRef.current += e.data.size;
            if (folderWriterRef.current) {
              await folderWriterRef.current.write(e.data);
            }
          }
        };
        recorder.onstop = async () => {
          if (folderWriterRef.current) {
            await folderWriterRef.current.close();
            folderWriterRef.current = null;
          }
          toast.success(`Saved to folder: ${fileName}`);
        };
        recorder.start(1000);
        recorderRef.current = recorder;
        setIsRecording(true);
        setDuration(0);
        durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        toast.success(`Recording to folder: ${fileName}`);

      } else if (output.mode === 'record') {
        chunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
        const recorder = new MediaRecorder(programStream, { mimeType, videoBitsPerSecond: output.bitrate * 1000 });
        recorder.ondataavailable = e => {
          if (e.data.size > 0) { chunksRef.current.push(e.data); bytesRef.current += e.data.size; }
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `broadcast-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Recording downloaded');
        };
        recorder.start(1000);
        recorderRef.current = recorder;
        setIsRecording(true);
        setDuration(0);
        durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        toast.success('Recording started');

      } else if (output.mode === 'whip') {
        if (!output.whipUrl) { toast.error('Enter WHIP endpoint URL'); return; }
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        tracks.forEach(t => pc.addTrack(t, programStream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const resp = await fetch(output.whipUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp', ...(output.streamKey ? { Authorization: `Bearer ${output.streamKey}` } : {}) },
          body: offer.sdp,
        });
        if (!resp.ok) throw new Error(`WHIP ${resp.status}`);
        const answer = await resp.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: answer });
        setIsLive(true);
        setDuration(0);
        durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        toast.success('🔴 LIVE via WHIP');
      }
    } catch (err) {
      console.error('Output error:', err);
      toast.error(`Failed: ${(err as Error).message}`);
    }
  }, [output, cameraStream, initAudio]);

  const stopOutput = useCallback(async () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (folderWriterRef.current) {
      await folderWriterRef.current.close();
      folderWriterRef.current = null;
    }
    if (durationRef.current) clearInterval(durationRef.current);
    if (healthRef.current) clearInterval(healthRef.current);
    setIsRecording(false);
    setIsLive(false);
    setDuration(0);
    setHealth(DEFAULT_HEALTH);
    toast('Output stopped');
  }, []);

  // ── Ticker ────────────────────────────────────────────────────────────────
  const showTicker = useCallback((text: string) => {
    setTicker(text);
    setTickerVisible(true);
    tickerXRef.current = CANVAS_W;
  }, []);

  const hideTicker = useCallback(() => setTickerVisible(false), []);

  // ── Overlays ──────────────────────────────────────────────────────────────
  const addOverlay = useCallback((sceneId: string, ov: Omit<OverlayText, 'id'>) => {
    const overlay: OverlayText = { ...ov, id: `ov-${Date.now()}` };
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, overlays: [...(s.overlays || []), overlay] } : s));
  }, []);

  const updateOverlay = useCallback((sceneId: string, ovId: string, patch: Partial<OverlayText>) => {
    setScenes(prev => prev.map(s =>
      s.id === sceneId ? { ...s, overlays: (s.overlays || []).map(o => o.id === ovId ? { ...o, ...patch } : o) } : s
    ));
  }, []);

  const removeOverlay = useCallback((sceneId: string, ovId: string) => {
    setScenes(prev => prev.map(s =>
      s.id === sceneId ? { ...s, overlays: (s.overlays || []).filter(o => o.id !== ovId) } : s
    ));
  }, []);

  // ── Rundown management ────────────────────────────────────────────────────
  const addRundownSegment = useCallback((seg: Omit<RundownSegment, 'id'>) => {
    setRundown(prev => [...prev, { ...seg, id: `rd-${Date.now()}` }]);
  }, []);

  const removeRundownSegment = useCallback((id: string) => {
    setRundown(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateRundownSegment = useCallback((id: string, patch: Partial<RundownSegment>) => {
    setRundown(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  // ── Ad management ─────────────────────────────────────────────────────────
  const addAdSlot = useCallback((ad: Omit<AdSlot, 'id'>) => {
    setAdSlots(prev => [...prev, { ...ad, id: `ad-${Date.now()}` }]);
  }, []);

  const removeAdSlot = useCallback((id: string) => {
    setAdSlots(prev => prev.filter(a => a.id !== id));
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current);
      if (durationRef.current) clearInterval(durationRef.current);
      if (healthRef.current) clearInterval(healthRef.current);
      cameraStream?.getTracks().forEach(t => t.stop());
      pipStream?.getTracks().forEach(t => t.stop());
    };
  }, [cameraStream, pipStream]); // The eslint-disable was removed and dependencies were explicitly listed.

  const state: StudioState = {
    currentSceneId, previewSceneId, scenes, audioTracks, output,
    isLive, isRecording, duration, error, transition, transitionDuration,
    pip, health,
  };

  return {
    state,
    cameras,
    cameraStream,
    pipStream,
    facingMode,
    ticker,
    tickerVisible,
    rundown,
    adSlots,
    canvasRef,
    previewCanvasRef,
    videoElemRef,
    mediaVideoRef,
    mediaImageRef,
    pipVideoRef,
    startCamera,
    stopCamera,
    flipCamera,
    startPip,
    stopPip,
    switchScene,
    setPreviewScene,
    takeToProgram,
    addScene,
    updateScene,
    deleteScene,
    captureSceneThumbnail,
    setTrackVolume,
    toggleTrackMute,
    loadMedia,
    startOutput,
    stopOutput,
    setOutput: (patch: Partial<StreamOutput>) => setOutputState(prev => ({ ...prev, ...patch })),
    setTransition,
    setTransitionDuration,
    setPip,
    addOverlay,
    updateOverlay,
    removeOverlay,
    showTicker,
    hideTicker,
    addRundownSegment,
    removeRundownSegment,
    updateRundownSegment,
    addAdSlot,
    removeAdSlot,
  };
}
