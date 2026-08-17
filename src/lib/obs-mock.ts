import { OBSScene, AudioSource, StreamStatus, MediaItem } from '@/types/obs';

export const MOCK_SCENES: OBSScene[] = [
  { sceneName: 'LIVE CAMERA', sceneIndex: 0, previewUrl: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=320&q=70&random=1' },
  { sceneName: 'GUEST CAMERA', sceneIndex: 1, previewUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=320&q=70&random=2' },
  { sceneName: 'NEWS CLIP', sceneIndex: 2, previewUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=320&q=70&random=3' },
  { sceneName: 'FULL VIDEO', sceneIndex: 3, previewUrl: 'https://images.unsplash.com/photo-1536240478700-b869ad10dca7?w=320&q=70&random=4' },
  { sceneName: 'PHOTO SLIDE', sceneIndex: 4, previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=320&q=70&random=5' },
  { sceneName: 'ADVERTISEMENT', sceneIndex: 5, previewUrl: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=320&q=70&random=6' },
  { sceneName: 'INTRO', sceneIndex: 6, previewUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=320&q=70&random=7' },
  { sceneName: 'OUTRO', sceneIndex: 7, previewUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=320&q=70&random=8' },
  { sceneName: 'BRB', sceneIndex: 8, previewUrl: 'https://images.unsplash.com/photo-1614680376408-81e91ffe3db7?w=320&q=70&random=9' },
];

export const MOCK_AUDIO_SOURCES: AudioSource[] = [
  { id: 'host-mic', name: 'Host Mic', volume: 80, muted: false, type: 'microphone' },
  { id: 'guest-mic', name: 'Guest Mic', volume: 75, muted: false, type: 'guest' },
  { id: 'desktop', name: 'Desktop Audio', volume: 60, muted: false, type: 'desktop' },
  { id: 'music', name: 'Background Music', volume: 30, muted: true, type: 'music' },
];

export const MOCK_MEDIA: MediaItem[] = [
  { id: 'n1', name: 'Politics Report', type: 'video', category: 'news', duration: '2:34', thumbnail: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=200&q=80' },
  { id: 'n2', name: 'Economy Update', type: 'video', category: 'news', duration: '1:52', thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&q=80' },
  { id: 'n3', name: 'Breaking News', type: 'video', category: 'news', duration: '0:45', thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&q=80' },
  { id: 'a1', name: 'Sponsor Alpha', type: 'video', category: 'ads', duration: '0:30', thumbnail: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=200&q=80' },
  { id: 'a2', name: 'Sponsor Beta', type: 'video', category: 'ads', duration: '0:15', thumbnail: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=200&q=80' },
  { id: 'p1', name: 'Podcast Intro', type: 'video', category: 'podcast', duration: '0:10', thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=200&q=80' },
  { id: 'p2', name: 'Podcast Outro', type: 'video', category: 'podcast', duration: '0:08', thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=200&q=80' },
  { id: 'ph1', name: 'Studio Photo', type: 'image', category: 'photos', thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&q=80' },
  { id: 'ph2', name: 'Guest Portrait', type: 'image', category: 'photos', thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&q=80' },
];

export const INITIAL_STREAM_STATUS: StreamStatus = {
  streaming: false,
  recording: false,
  screenRecording: false,
  duration: '00:00:00',
  bitrate: 0,
  droppedFrames: 0,
  fps: 30,
  cpuUsage: 0,
};

export function simulateConnect(): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) resolve();
      else reject(new Error('Connection refused. Check host/port/password.'));
    }, 1500);
  });
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

// IndexedDB helpers for uploaded media
const DB_NAME = 'obs-media-db';
const STORE_NAME = 'uploads';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveUploadedMedia(item: MediaItem, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ ...item, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadUploadedMedia(): Promise<MediaItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const items: MediaItem[] = (req.result || []).map((row: MediaItem & { blob: Blob }) => ({
        ...row,
        url: URL.createObjectURL(row.blob),
      }));
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteUploadedMedia(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
