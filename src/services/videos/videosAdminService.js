import { supabase } from '../supabase/client';

/**
 * Fetch all videos with filtering and search
 */
export const fetchAdminVideos = async ({
  search = '',
  category = '',
  status = '',
  isVip = null,
  limit = 50
} = {}) => {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('videos')
      .select('id, title, description, video_url, thumbnail_url, duration, duration_seconds, category, is_vip, status, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
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
    console.error('[VideosAdminService] fetchAdminVideos error:', err);
    throw err;
  }
};

/**
 * Fetch single video by ID
 */
export const fetchVideoById = async (id) => {
  if (!id || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[VideosAdminService] fetchVideoById error:', err);
    throw err;
  }
};

/**
 * Upload a video file to 'videos' bucket in Supabase Storage
 */
export const uploadVideoFile = async (file, onProgress) => {
  if (!supabase || !file) throw new Error('Missing file or client');

  // Verify file size limit (100MB)
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Video file size exceeds maximum limit of 100MB');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `sparks/${Date.now()}_${cleanName}`;

  const { data, error } = await supabase.storage
    .from('videos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from('videos')
    .getPublicUrl(data.path);

  return publicData.publicUrl;
};

/**
 * Upload a thumbnail image file to 'thumbnails' bucket
 */
export const uploadThumbnailFile = async (file) => {
  if (!supabase || !file) throw new Error('Missing file or client');

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Thumbnail image exceeds maximum limit of 10MB');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `sparks/${Date.now()}_${cleanName}`;

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
 * Create a new Video record
 */
export const createVideo = async (videoData) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      title: videoData.title.trim(),
      description: videoData.description || null,
      video_url: videoData.video_url.trim(),
      thumbnail_url: videoData.thumbnail_url || null,
      duration: videoData.duration || '0:30',
      duration_seconds: parseInt(videoData.duration_seconds || 30, 10),
      category: videoData.category || 'Mindfulness',
      is_vip: Boolean(videoData.is_vip),
      status: videoData.status || 'published',
      created_by: user?.id || null
    };

    const { data, error } = await supabase
      .from('videos')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[VideosAdminService] createVideo error:', err);
    throw err;
  }
};

/**
 * Update an existing Video record
 */
export const updateVideo = async (id, videoData) => {
  if (!id || !supabase) throw new Error('Missing ID or Supabase client');

  try {
    const payload = {
      title: videoData.title?.trim(),
      description: videoData.description ?? null,
      video_url: videoData.video_url?.trim(),
      thumbnail_url: videoData.thumbnail_url ?? null,
      duration: videoData.duration || '0:30',
      duration_seconds: parseInt(videoData.duration_seconds || 30, 10),
      category: videoData.category || 'Mindfulness',
      is_vip: Boolean(videoData.is_vip),
      status: videoData.status || 'published',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('videos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[VideosAdminService] updateVideo error:', err);
    throw err;
  }
};

/**
 * Check if a video is referenced by any Spark
 */
export const checkVideoReferences = async (videoId) => {
  if (!videoId || !supabase) return [];
  try {
    const { data } = await supabase
      .from('sparks')
      .select('id, title')
      .eq('video_id', videoId);
    return data || [];
  } catch {
    return [];
  }
};

/**
 * Delete a Video record
 */
export const deleteVideo = async (id) => {
  if (!id || !supabase) throw new Error('Missing ID or Supabase client');

  try {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[VideosAdminService] deleteVideo error:', err);
    throw err;
  }
};
