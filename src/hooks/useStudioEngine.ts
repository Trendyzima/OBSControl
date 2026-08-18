
import { useState, useRef, useCallback, useEffect } from 'react';
import { StudioScene, AudioTrack, StudioState, StreamOutput, OverlayText, CameraDevice } from '@/types/studio';
import { toast } from 'sonner';

// ─── Default scenes ──────────────────────────────────────────────────────────
function makeId() {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const DEFAULT_SCENES: StudioScene[] = [
  { id: makeId(), name: 'CAMERA', sourceType: 'camera', icon: '🎥', overlays: [] },
  { id: makeId(), name: 'VIDEO', sourceType: 'video', icon: '🎬', overlays: [] },
  { id: makeId(), name: 'PHOTO', sourceType: 'image', icon: '🖼', overlays: [] },
  { id: makeId(), name: 'INTRO', sourceType: 'color', bgColor: '#0d0d1a', icon: '▶', overlays: [
    { id: 'ov1', text: 'STARTING SOON', x: 50, y: 45, fontSize: 48, color: '#ffffff', bgColor: 'transparent', bold: true, visible: true },
    { id: 'ov2', text: 'Live Broadcast', x: 50, y: 58, fontSize: 22, color: '#cc3333', bgColor: 'transparent', bold: false, visible: true },
  ]},
  { id: makeId(), name: 'BRB', sourceType: 'color', bgColor: '#0a0a0a', icon: '⏸', overlays: [
    { id: 'ov3', text: 'BE RIGHT BACK', x: 50, y: 50, fontSize: 52, color: '#ff3333', bgColor: 'transparent', bold: true, visible: true },
  ]},
  { id: makeId(), name: 'AD BREAK', sourceType: 'color', bgColor: '#1a0a00', icon: '📢', overlays: [
    { id: 'ov4', text: 'AD BREAK', x: 50, y: 50, fontSize: 52, color: '#ff9900', bgColor: 'transparent', bold: true, visible: true },
  ]},
  { id: makeId(), name: 'OUTRO', sourceType: 'color', bgColor: '#0d1a0d', icon: '🔚', overlays: [
    { id: 'ov5', text: 'THANKS FOR WATCHING', x: 50, y: 45, fontSize: 36, color: '#ffffff', bgColor: 'transparent', bold: true, visible: true },
    { id: 'ov6', text: 'See you next time!', x: 50, y: 58, fontSize: 24, color: '#44cc44', bgColor: 'transparent', bold: false, visible: true },
  ]},
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
};

// ─── Canvas renderer ──────────────────────────────────────────────────────────
const CANVAS_W = 1280;
const CANVAS_H = 720;

export function useStudioEngine() {
  const [scenes, setScenes] = useState<StudioScene[]>(DEFAULT_SCENES);
  const [currentSceneId, setCurrentSceneId] = useState(DEFAULT_SCENES[0].id);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>(DEFAULT_AUDIO);
  const [output, setOutput] = useState<StreamOutput>(DEFAULT_OUTPUT);
  const [isLive, setIsLive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [ticker, setTicker] = useState('');
  const [tickerVisible, setTickerVisible] = useState(false);
  const [tickerX, setTickerX] = useState(CANVAS_W);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElemRef = useRef<HTMLVideoElement | null>(null);    // camera preview
  const mediaVideoRef = useRef<HTMLVideoElement | null>(null);   // media playback
  const mediaImageRef = useRef<HTMLImageElement | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const vidGainRef = useRef<GainNode | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tickerXRef = useRef(CANVAS_W);

  // ── Enumerate cameras ──────────────────────────────────────────────────────
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

  useEffect(() => {
    enumerateCameras();
  }, [enumerateCameras]);

  // ── Initialize audio context ───────────────────────────────────────────────
  const initAudio = useCallback(async (stream?: MediaStream) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      if (!destRef.current) {
        destRef.current = ctx.createMediaStreamDestination();
      }

      // Mic gain
      if (!micGainRef.current) {
        micGainRef.current = ctx.createGain();
        micGainRef.current.connect(destRef.current);
      }

      // Video gain
      if (!vidGainRef.current) {
        vidGainRef.current = ctx.createGain();
        vidGainRef.current.connect(destRef.current);
      }

      // Analyser for VU meter
      if (!analyserRef.current) {
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 256;
      }

      // Connect mic stream if provided
      if (stream) {
        if (micSourceRef.current) {
          micSourceRef.current.disconnect();
        }
        micSourceRef.current = ctx.createMediaStreamSource(stream);
        micSourceRef.current.connect(micGainRef.current);
        micSourceRef.current.connect(analyserRef.current);
      }

      // Apply saved volumes
      const micTrack = audioTracks.find(t => t.id === 'mic');
      const vidTrack = audioTracks.find(t => t.id === 'vid-audio');
      if (micGainRef.current && micTrack) {
        micGainRef.current.gain.value = micTrack.muted ? 0 : micTrack.volume / 100;
      }
      if (vidGainRef.current && vidTrack) {
        vidGainRef.current.gain.value = vidTrack.muted ? 0 : vidTrack.volume / 100;
      }
    } catch (err) {
      console.error('Audio init error:', err);
    }
  }, [audioTracks]);

  // ── Start camera ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId }, width: { ideal: CANVAS_W }, height: { ideal: CANVAS_H } } : { width: { ideal: CANVAS_W }, height: { ideal: CANVAS_H }, facingMode: 'user' },
        audio: true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);

      if (videoElemRef.current) {
        videoElemRef.current.srcObject = stream;
        videoElemRef.current.play().catch(() => {});
      }

      await initAudio(stream);
      await enumerateCameras();
      toast.success('Camera started');
      return stream;
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Camera access denied. Enable camera permissions.');
      setError('Camera permission denied');
      return null;
    }
  }, [cameraStream, initAudio, enumerateCameras]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    if (videoElemRef.current) {
      videoElemRef.current.srcObject = null;
    }
  }, [cameraStream]);

  // ── Scene switch ───────────────────────────────────────────────────────────
  const switchScene = useCallback((id: string) => {
    setCurrentSceneId(id);
    toast(`Scene: ${scenes.find(s => s.id === id)?.name ?? id}`, { duration: 1000 });
  }, [scenes]);

  // ── Scene management ───────────────────────────────────────────────────────
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

  // ── Audio track management ──────────────────────────────────────────────────
  const setTrackVolume = useCallback((id: string, volume: number) => {
    setAudioTracks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, volume };
      if (id === 'mic' && micGainRef.current) {
        micGainRef.current.gain.value = t.muted ? 0 : volume / 100;
      }
      if (id === 'vid-audio' && vidGainRef.current) {
        vidGainRef.current.gain.value = t.muted ? 0 : volume / 100;
      }
      return updated;
    }));
  }, []);

  const toggleTrackMute = useCallback((id: string) => {
    setAudioTracks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const muted = !t.muted;
      if (id === 'mic' && micGainRef.current) {
        micGainRef.current.gain.value = muted ? 0 : t.volume / 100;
      }
      if (id === 'vid-audio' && vidGainRef.current) {
        vidGainRef.current.gain.value = muted ? 0 : t.volume / 100;
      }
      return { ...t, muted };
    }));
  }, []);

  // ── Load video/image into scene ────────────────────────────────────────────
  const loadMedia = useCallback((sceneId: string, url: string, type: 'video' | 'image') => {
    setScenes(prev => prev.map(s => {
      if (s.id !== sceneId) return s;
      if (type === 'video') return { ...s, mediaUrl: url, thumbnail: url.startsWith('blob') ? undefined : url };
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

  // ── Canvas render loop ─────────────────────────────────────────────────────
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scene = scenes.find(s => s.id === currentSceneId);
    if (!scene) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    if (scene.sourceType === 'color' || scene.sourceType === 'text') {
      ctx.fillStyle = scene.bgColor || '#0d0d1a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    } else if (scene.sourceType === 'camera' && videoElemRef.current && videoElemRef.current.readyState >= 2) {
      ctx.drawImage(videoElemRef.current, 0, 0, CANVAS_W, CANVAS_H);
    } else if (scene.sourceType === 'video' && mediaVideoRef.current && mediaVideoRef.current.readyState >= 2) {
      // Black bg first
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Letterbox fit
      const vw = mediaVideoRef.current.videoWidth || CANVAS_W;
      const vh = mediaVideoRef.current.videoHeight || CANVAS_H;
      const scale = Math.min(CANVAS_W / vw, CANVAS_H / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (CANVAS_W - dw) / 2;
      const dy = (CANVAS_H - dh) / 2;
      ctx.drawImage(mediaVideoRef.current, dx, dy, dw, dh);
    } else if (scene.sourceType === 'image' && mediaImageRef.current && mediaImageRef.current.complete) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      const iw = mediaImageRef.current.naturalWidth || CANVAS_W;
      const ih = mediaImageRef.current.naturalHeight || CANVAS_H;
      const scale = Math.min(CANVAS_W / iw, CANVAS_H / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (CANVAS_W - dw) / 2;
      const dy = (CANVAS_H - dh) / 2;
      ctx.drawImage(mediaImageRef.current, dx, dy, dw, dh);
    } else {
      // Fallback
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
      const textW = metrics.width;
      const textH = ov.fontSize;
      if (ov.bgColor && ov.bgColor !== 'transparent') {
        ctx.fillStyle = ov.bgColor;
        ctx.fillRect(x - textW / 2 - 12, y - textH * 0.8 - 6, textW + 24, textH + 12);
      }
      ctx.fillStyle = ov.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ov.text, x, y);
    });

    // News ticker
    if (tickerVisible && ticker) {
      const barH = 48;
      const barY = CANVAS_H - barH;
      ctx.fillStyle = 'rgba(200, 0, 0, 0.92)';
      ctx.fillRect(0, barY, CANVAS_W, barH);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(ticker, tickerXRef.current, barY + barH / 2);
      // Advance ticker
      tickerXRef.current -= 2;
      const textW2 = ctx.measureText(ticker).width;
      if (tickerXRef.current < -textW2) tickerXRef.current = CANVAS_W;
    }

    rafRef.current = requestAnimationFrame(renderFrame);
  }, [scenes, currentSceneId, ticker, tickerVisible]);

  // Restart render loop when scene changes
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [renderFrame]);

  // Media playback when scene switches
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
      const level = Math.round((avg / 255) * 100);
      setAudioTracks(prev => prev.map(t => t.id === 'mic' ? { ...t, level } : t));
    }, 80);
    return () => clearInterval(interval);
  }, [cameraStream]);

  // ── Start recording / streaming ────────────────────────────────────────────
  const startOutput = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) { toast.error('Canvas not ready'); return; }

    try {
      // Ensure audio context
      await initAudio(cameraStream ?? undefined);

      const canvasStream = canvas.captureStream(output.fps);

      // Mix audio into program
      const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
      if (destRef.current) {
        tracks.push(...destRef.current.stream.getAudioTracks());
      }
      const programStream = new MediaStream(tracks);

      if (output.mode === 'record') {
        chunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';
        const recorder = new MediaRecorder(programStream, {
          mimeType,
          videoBitsPerSecond: output.bitrate * 1000,
        });
        recorder.ondataavailable = e => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `studio-recording-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Recording saved');
        };
        recorder.start(1000);
        recorderRef.current = recorder;
        setIsRecording(true);
        setDuration(0);
        durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        toast.success('Recording started');
      } else if (output.mode === 'whip') {
        if (!output.whipUrl) { toast.error('Enter WHIP endpoint URL'); return; }
        // WHIP WebRTC ingest
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        tracks.forEach(t => pc.addTrack(t, programStream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const resp = await fetch(output.whipUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp', ...(output.streamKey ? { Authorization: `Bearer ${output.streamKey}` } : {}) },
          body: offer.sdp,
        });
        if (!resp.ok) throw new Error(`WHIP error ${resp.status}`);
        const answer = await resp.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: answer });
        setIsLive(true);
        setDuration(0);
        durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        toast.success('🔴 LIVE via WHIP');
      }
    } catch (err) {
      console.error('Output error:', err);
      toast.error(`Failed to start: ${(err as Error).message}`);
    }
  }, [output, cameraStream, initAudio]);

  const stopOutput = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (durationRef.current) clearInterval(durationRef.current);
    setIsRecording(false);
    setIsLive(false);
    setDuration(0);
    toast('Output stopped');
  }, []);

  // ── Ticker ──────────────────────────────────────────────────────────────────
  const showTicker = useCallback((text: string) => {
    setTicker(text);
    setTickerVisible(true);
    tickerXRef.current = CANVAS_W;
  }, []);

  const hideTicker = useCallback(() => {
    setTickerVisible(false);
  }, []);

  // ── Overlay management ─────────────────────────────────────────────────────
  const addOverlay = useCallback((sceneId: string, ov: Omit<OverlayText, 'id'>) => {
    const overlay: OverlayText = { ...ov, id: `ov-${Date.now()}` };
    setScenes(prev => prev.map(s =>
      s.id === sceneId ? { ...s, overlays: [...(s.overlays || []), overlay] } : s
    ));
  }, []);

  const updateOverlay = useCallback((sceneId: string, ovId: string, patch: Partial<OverlayText>) => {
    setScenes(prev => prev.map(s =>
      s.id === sceneId
        ? { ...s, overlays: (s.overlays || []).map(o => o.id === ovId ? { ...o, ...patch } : o) }
        : s
    ));
  }, []);

  const removeOverlay = useCallback((sceneId: string, ovId: string) => {
    setScenes(prev => prev.map(s =>
      s.id === sceneId
        ? { ...s, overlays: (s.overlays || []).filter(o => o.id !== ovId) }
        : s
    ));
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (durationRef.current) clearInterval(durationRef.current);
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    };
  }, [cameraStream]); // Fixed: Added cameraStream to dependency array

  const state: StudioState = { currentSceneId, scenes, audioTracks, output, isLive, isRecording, duration, error };

  return {
    // State
    state,
    cameras,
    cameraStream,
    ticker,
    tickerVisible,

    // Refs to attach to DOM
    canvasRef,
    videoElemRef,
    mediaVideoRef,
    mediaImageRef,

    // Camera
    startCamera,
    stopCamera,

    // Scenes
    switchScene,
    addScene,
    updateScene,
    deleteScene,

    // Audio
    setTrackVolume,
    toggleTrackMute,

    // Media
    loadMedia,

    // Output
    startOutput,
    stopOutput,
    setOutput: (patch: Partial<StreamOutput>) => setOutput(prev => ({ ...prev, ...patch })),

    // Overlays
    addOverlay,
    updateOverlay,
    removeOverlay,

    // Ticker
    showTicker,
    hideTicker,
  };
}
