import { supabase } from '../supabase/client';
import { formatAudioDuration } from '../../utils/formatters';

export const STORAGE_BUCKETS = [
  { id: 'thumbnails', name: 'Thumbnails & Posters', allowedMime: 'image/*', maxSizeMb: 10 },
  { id: 'videos', name: 'Videos', allowedMime: 'video/*', maxSizeMb: 100 },
  { id: 'audio', name: 'Audio Soundscapes', allowedMime: 'audio/*', maxSizeMb: 50 },
  { id: 'avatars', name: 'User Avatars', allowedMime: 'image/*', maxSizeMb: 5 }
];

/**
 * List files inside a specific storage bucket and folder
 */
export const listBucketFiles = async (bucketId, folder = '') => {
  if (!supabase || !bucketId) return [];

  try {
    const { data, error } = await supabase.storage
      .from(bucketId)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) throw error;

    // Filter out internal system placeholder folders like .emptyFolderPlaceholder
    const validItems = (data || []).filter((item) => item.name !== '.emptyFolderPlaceholder');

    return validItems.map((item) => {
      const fullPath = folder ? `${folder}/${item.name}` : item.name;
      const { data: urlData } = supabase.storage.from(bucketId).getPublicUrl(fullPath);

      return {
        id: item.id || fullPath,
        name: item.name,
        path: fullPath,
        bucket: bucketId,
        size: item.metadata?.size || item.size || 0,
        mimetype: item.metadata?.mimetype || '',
        created_at: item.created_at || item.updated_at || null,
        publicUrl: urlData?.publicUrl || ''
      };
    });
  } catch (err) {
    console.error(`[StorageAdminService] listBucketFiles error (${bucketId}):`, err);
    throw err;
  }
};

/**
 * Upload a media file into a storage bucket
 */
export const uploadStorageFile = async (bucketId, file, folder = '') => {
  if (!supabase || !bucketId || !file) throw new Error('Missing file, bucket, or client');

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const targetPath = folder ? `${folder}/${Date.now()}_${cleanName}` : `${Date.now()}_${cleanName}`;

  const { data, error } = await supabase.storage
    .from(bucketId)
    .upload(targetPath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucketId)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl
  };
};

/**
 * Check if a file's publicUrl or path is referenced in database tables (sparks, videos, audios)
 */
export const checkMediaReferences = async (publicUrl, fileName) => {
  if (!supabase) return [];
  const references = [];

  try {
    const term = fileName || publicUrl;

    const [sparksRes, videosRes, audiosRes] = await Promise.all([
      supabase.from('sparks').select('id, title').or(`thumbnail_url.ilike.%${term}%`),
      supabase.from('videos').select('id, title').or(`video_url.ilike.%${term}%,thumbnail_url.ilike.%${term}%`),
      supabase.from('audios').select('id, title').or(`audio_url.ilike.%${term}%,thumbnail_url.ilike.%${term}%`)
    ]);

    if (sparksRes.data?.length) {
      sparksRes.data.forEach((s) => references.push({ type: 'Spark', title: s.title, id: s.id }));
    }
    if (videosRes.data?.length) {
      videosRes.data.forEach((v) => references.push({ type: 'Video', title: v.title, id: v.id }));
    }
    if (audiosRes.data?.length) {
      audiosRes.data.forEach((a) => references.push({ type: 'Audio', title: a.title, id: a.id }));
    }
  } catch (err) {
    console.warn('[StorageAdminService] checkMediaReferences note:', err.message);
  }

  return references;
};

/**
 * Delete a file from a storage bucket
 */
export const deleteStorageFile = async (bucketId, filePath) => {
  if (!supabase || !bucketId || !filePath) throw new Error('Missing file, bucket, or client');

  try {
    const { error } = await supabase.storage
      .from(bucketId)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`[StorageAdminService] deleteStorageFile error (${bucketId}/${filePath}):`, err);
    throw err;
  }
};

/**
 * Upload a media file with progress tracking callback
 */
export const uploadStorageFileWithProgress = async (bucketId, file, folder = '', onProgress) => {
  if (!supabase || !bucketId || !file) throw new Error('Missing file, bucket, or client');

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const targetPath = folder ? `${folder}/${Date.now()}_${cleanName}` : `${Date.now()}_${cleanName}`;

  let currentProgress = 10;
  if (onProgress) onProgress(currentProgress);

  const ticker = setInterval(() => {
    if (currentProgress < 90) {
      currentProgress += Math.min(15, Math.floor((90 - currentProgress) / 3) + 2);
      if (onProgress) onProgress(currentProgress);
    }
  }, 180);

  try {
    const { data, error } = await supabase.storage
      .from(bucketId)
      .upload(targetPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    clearInterval(ticker);

    if (error) throw error;

    if (onProgress) onProgress(100);

    const { data: urlData } = supabase.storage
      .from(bucketId)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl
    };
  } catch (err) {
    clearInterval(ticker);
    throw err;
  }
};

/**
 * Extracts the storage object path from a Supabase public URL
 */
export const getStoragePathFromUrl = (url, bucketId) => {
  if (!url || typeof url !== 'string') return null;
  const marker = `/object/public/${bucketId}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    return url.substring(idx + marker.length);
  }
  return null;
};

/**
 * Detect audio duration from a local audio File/Blob using browser metadata APIs and AudioContext fallback.
 * Supports MP3, WAV, AAC, OGG, M4A.
 * Rejects if unable to read valid duration metadata.
 * Returns { seconds: number, formatted: string } (e.g. { seconds: 255, formatted: "04:15" })
 */
export const detectAudioDuration = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No audio file provided'));
    }

    let settled = false;

    // Helper: AudioContext fallback for formats or browser engines where onloadedmetadata is unreliable
    const tryAudioContext = async () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        const ctx = new AudioContextClass();
        try {
          const arrayBuffer = await file.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          const dur = audioBuffer.duration;
          if (typeof dur === 'number' && !isNaN(dur) && isFinite(dur) && dur > 0) {
            const rounded = Math.round(dur);
            return {
              seconds: rounded,
              formatted: formatAudioDuration(rounded)
            };
          }
        } finally {
          try {
            await ctx.close();
          } catch {}
        }
      } catch {
        // Fallback failed
      }
      return null;
    };

    let cleanup = () => {};

    // 8-second safety timeout
    const timeout = setTimeout(async () => {
      if (!settled) {
        settled = true;
        cleanup();
        const fallback = await tryAudioContext();
        if (fallback) {
          resolve(fallback);
        } else {
          reject(new Error('Unable to detect the audio duration. Please select a valid audio file.'));
        }
      }
    }, 8000);

    try {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;

      cleanup = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
        audio.removeAttribute('src');
        audio.load();
      };

      audio.onloadedmetadata = async () => {
        if (settled) return;

        let dur = audio.duration;

        // Chromium bug workaround: variable bitrate MP3/audio can report Infinity initially
        if (dur === Infinity) {
          audio.currentTime = Number.MAX_SAFE_INTEGER;
          audio.ontimeupdate = async () => {
            audio.ontimeupdate = null;
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            const actualDur = audio.currentTime;
            cleanup();
            if (typeof actualDur === 'number' && !isNaN(actualDur) && isFinite(actualDur) && actualDur > 0) {
              const rounded = Math.round(actualDur);
              resolve({
                seconds: rounded,
                formatted: formatAudioDuration(rounded)
              });
            } else {
              const fallback = await tryAudioContext();
              if (fallback) {
                resolve(fallback);
              } else {
                reject(new Error('Unable to detect the audio duration. Please select a valid audio file.'));
              }
            }
          };
          return;
        }

        if (typeof dur === 'number' && !isNaN(dur) && isFinite(dur) && dur > 0) {
          settled = true;
          clearTimeout(timeout);
          cleanup();
          const rounded = Math.round(dur);
          resolve({
            seconds: rounded,
            formatted: formatAudioDuration(rounded)
          });
          return;
        }

        // Invalid duration reported -> try AudioContext
        settled = true;
        clearTimeout(timeout);
        cleanup();
        const fallback = await tryAudioContext();
        if (fallback) {
          resolve(fallback);
        } else {
          reject(new Error('Unable to detect the audio duration. Please select a valid audio file.'));
        }
      };

      audio.onerror = async () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        cleanup();
        const fallback = await tryAudioContext();
        if (fallback) {
          resolve(fallback);
        } else {
          reject(new Error('Unable to detect the audio duration. Please select a valid audio file.'));
        }
      };
    } catch {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        cleanup();
        tryAudioContext().then((fallback) => {
          if (fallback) resolve(fallback);
          else reject(new Error('Unable to detect the audio duration. Please select a valid audio file.'));
        });
      }
    }
  });
};

/**
 * Extract duration from video or audio file
 */
export const getMediaDuration = (file, type = 'video') => {
  if (type === 'audio') {
    return detectAudioDuration(file).catch(() => ({
      seconds: 240,
      formatted: '04:00'
    }));
  }

  return new Promise((resolve) => {
    try {
      const element = document.createElement('video');
      element.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);
      element.src = objectUrl;

      const cleanup = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
      };

      element.onloadedmetadata = () => {
        cleanup();
        const durationSec = Math.round(element.duration) || 0;
        const minutes = Math.floor(durationSec / 60);
        const remSec = durationSec % 60;
        const formatted = `${minutes}:${remSec < 10 ? '0' : ''}${remSec}`;
        resolve({
          seconds: durationSec,
          formatted: formatted || '0:30'
        });
      };

      element.onerror = () => {
        cleanup();
        resolve({
          seconds: 30,
          formatted: '0:30'
        });
      };
    } catch {
      resolve({
        seconds: 30,
        formatted: '0:30'
      });
    }
  });
};

