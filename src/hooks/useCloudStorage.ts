import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface CloudMediaItem {
  id: string;
  user_id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'recording';
  mime_type: string | null;
  size: number;
  duration: number;
  storage_path: string;
  public_url: string | null;
  thumbnail_url: string | null;
  category: string;
  tags: string[];
  usage_count: number;
  created_at: string;
  // local only (from signed URL)
  signedUrl?: string;
}

export function useCloudStorage(userId: string | null) {
  const [items, setItems] = useState<CloudMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchMedia = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('cloud_media')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load media: ' + error.message); }
    else setItems(data as CloudMediaItem[]);
    setLoading(false);
  }, [userId]);

  const getSignedUrl = useCallback(async (storagePath: string, bucket: string = 'studio-media') => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 3600);
    if (error) return null;
    return data.signedUrl;
  }, []);

  const uploadMedia = useCallback(async (
    file: File,
    type: 'video' | 'audio' | 'image' | 'recording',
    category: string = 'general'
  ) => {
    if (!userId) { toast.error('Please sign in to upload to cloud'); return null; }
    setUploading(true);
    setUploadProgress(0);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const storagePath = `${userId}/${type}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const bucket = type === 'recording' ? 'studio-recordings' : 'studio-media';

      // Get duration for audio/video
      let duration = 0;
      if (type === 'video' || type === 'audio') {
        duration = await new Promise<number>(resolve => {
          const el = type === 'video' ? document.createElement('video') : document.createElement('audio');
          el.preload = 'metadata';
          el.onloadedmetadata = () => { URL.revokeObjectURL(el.src); resolve(el.duration || 0); };
          el.onerror = () => resolve(0);
          el.src = URL.createObjectURL(file);
        });
      }

      const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;
      setUploadProgress(70);

      // Get signed URL
      const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 3600 * 24 * 7);
      setUploadProgress(85);

      const { data: record, error: dbError } = await supabase.from('cloud_media').insert({
        user_id: userId,
        name: file.name.replace(/\.[^.]+$/, ''),
        type,
        mime_type: file.type,
        size: file.size,
        duration: Math.round(duration),
        storage_path: storagePath,
        public_url: signedData?.signedUrl || null,
        category,
      }).select().single();
      if (dbError) throw dbError;
      setUploadProgress(100);

      setItems(prev => [{ ...record, signedUrl: signedData?.signedUrl } as CloudMediaItem, ...prev]);
      toast.success(`Uploaded: ${file.name}`);
      return record as CloudMediaItem;
    } catch (err) {
      toast.error('Upload failed: ' + (err as Error).message);
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [userId]);

  const deleteMedia = useCallback(async (item: CloudMediaItem) => {
    if (!userId) return;
    const bucket = item.type === 'recording' ? 'studio-recordings' : 'studio-media';
    await supabase.storage.from(bucket).remove([item.storage_path]);
    await supabase.from('cloud_media').delete().eq('id', item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    toast.success('Deleted: ' + item.name);
  }, [userId]);

  const wipeAllMedia = useCallback(async () => {
    if (!userId) return;
    // Get all paths
    const { data: allItems } = await supabase.from('cloud_media').select('storage_path, type').eq('user_id', userId);
    if (allItems) {
      const mediaPaths = allItems.filter(i => i.type !== 'recording').map(i => i.storage_path);
      const recPaths = allItems.filter(i => i.type === 'recording').map(i => i.storage_path);
      if (mediaPaths.length > 0) await supabase.storage.from('studio-media').remove(mediaPaths);
      if (recPaths.length > 0) await supabase.storage.from('studio-recordings').remove(recPaths);
    }
    await supabase.from('cloud_media').delete().eq('user_id', userId);
    setItems([]);
    toast.success('All cloud media wiped');
  }, [userId]);

  const incrementUsage = useCallback(async (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, usage_count: i.usage_count + 1 } : i));
    await supabase.from('cloud_media').update({ usage_count: supabase.rpc('increment' as never) }).eq('id', id);
  }, []);

  return {
    items, loading, uploading, uploadProgress,
    fetchMedia, uploadMedia, deleteMedia, wipeAllMedia, getSignedUrl, incrementUsage,
  };
}
