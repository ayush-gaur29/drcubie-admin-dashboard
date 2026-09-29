import { supabase } from '../supabase/client';
import { parseDurationToSeconds } from '../../utils/formatters';

/**
 * Fetch all audios with filtering and search
 */
export const fetchAdminAudios = async ({
  search = '',
  category = '',
  status = '',
  isVip = null,
  limit = 50
} = {}) => {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('audios')
      .select('id, title, description, audio_url, duration, duration_seconds, category, speaker, thumbnail_url, is_vip, status, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,speaker.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (isVip !== null && isVip !== '') {
      query = query.eq('is_vip', isVip === 'true' || isVip === true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[AudiosAdminService] fetchAdminAudios error:', err);
    throw err;
  }
};

/**
 * Fetch single audio by ID
 */
export const fetchAudioById = async (id) => {
  if (!id || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('audios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[AudiosAdminService] fetchAudioById error:', err);
    throw err;
  }
};

/**
 * Upload an audio file to 'audio' bucket in Supabase Storage
 */
export const uploadAudioFile = async (file) => {
  if (!supabase || !file) throw new Error('Missing file or client');

  // Verify file format (MP3, WAV, AAC, OGG, M4A)
  const allowedExtensions = ['.mp3', '.wav', '.aac', '.ogg', '.m4a'];
  const nameLower = file.name.toLowerCase();
  const hasValidExt = allowedExtensions.some((ext) => nameLower.endsWith(ext));

  if (!hasValidExt && !file.type.startsWith('audio/')) {
    throw new Error('Unsupported audio format. Supported formats: MP3, WAV, AAC, OGG, M4A.');
  }

  // Verify file size limit (50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Audio file size exceeds maximum limit of 50MB');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `sparks/${Date.now()}_${cleanName}`;

  const { data, error } = await supabase.storage
    .from('audio')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from('audio')
    .getPublicUrl(data.path);

  return publicData.publicUrl;
};

/**
 * Upload audio cover artwork to 'thumbnails' bucket
 */
export const uploadAudioCover = async (file) => {
  if (!supabase || !file) throw new Error('Missing file or client');

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Cover artwork file exceeds maximum limit of 10MB');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `audio/${Date.now()}_${cleanName}`;

  const { data, error } = await supabase.storage
    .from('thumbnails')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(data.path);

  return publicData.publicUrl;
};

/**
 * Create a new Audio record
 */
export const createAudio = async (audioData) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const durationStr = audioData.duration || '04:15';
    const durationSeconds = audioData.duration_seconds || parseDurationToSeconds(durationStr) || 0;

    const payload = {
      title: audioData.title.trim(),
      description: audioData.description || null,
      audio_url: audioData.audio_url.trim(),
      thumbnail_url: audioData.thumbnail_url || null,
      duration: durationStr,
      duration_seconds: durationSeconds,
      category: audioData.category || 'Mindfulness',
      speaker: audioData.speaker || 'Voice of Dr. Cubie',
      is_vip: Boolean(audioData.is_vip),
      status: audioData.status || 'published',
      created_by: user?.id || null
    };

    const { data, error } = await supabase
      .from('audios')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[AudiosAdminService] createAudio error:', err);
    throw err;
  }
};

/**
 * Update an existing Audio record
 */
export const updateAudio = async (id, audioData) => {
  if (!id || !supabase) throw new Error('Missing ID or Supabase client');

  try {
    const durationStr = audioData.duration || '04:15';
    const durationSeconds = audioData.duration_seconds || parseDurationToSeconds(durationStr) || 0;

    const payload = {
      title: audioData.title?.trim(),
      description: audioData.description ?? null,
      audio_url: audioData.audio_url?.trim(),
      thumbnail_url: audioData.thumbnail_url ?? null,
      duration: durationStr,
      duration_seconds: durationSeconds,
      category: audioData.category || 'Mindfulness',
      speaker: audioData.speaker || 'Voice of Dr. Cubie',
      is_vip: Boolean(audioData.is_vip),
      status: audioData.status || 'published',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('audios')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[AudiosAdminService] updateAudio error:', err);
    throw err;
  }
};

/**
 * Check if an audio is referenced by any Spark
 */
export const checkAudioReferences = async (audioId) => {
  if (!audioId || !supabase) return [];
  try {
    const { data } = await supabase
      .from('sparks')
      .select('id, title')
      .eq('audio_id', audioId);
    return data || [];
  } catch {
    return [];
  }
};

/**
 * Delete an Audio record
 */
export const deleteAudio = async (id) => {
  if (!id || !supabase) throw new Error('Missing ID or Supabase client');

  try {
    const { error } = await supabase
      .from('audios')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[AudiosAdminService] deleteAudio error:', err);
    throw err;
  }
};
