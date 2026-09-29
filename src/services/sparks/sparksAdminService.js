import { supabase } from '../supabase/client';
import { slugify } from '../../utils/validators';
import { createVideo, updateVideo } from '../videos/videosAdminService';
import { createAudio, updateAudio } from '../audios/audiosAdminService';
import { deleteStorageFile } from '../media/storageAdminService';

/**
 * Fetch all sparks with filtering and search
 */
export const fetchAdminSparks = async ({
  search = '',
  category = '',
  status = '',
  isVip = null,
  limit = 50
} = {}) => {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('sparks')
      .select(`
        id,
        slug,
        title,
        short_description,
        category,
        duration,
        thumbnail_url,
        video_id,
        audio_id,
        reflection,
        insight,
        practice,
        status,
        is_vip,
        created_at,
        updated_at,
        videos (id, title, video_url, thumbnail_url, duration, duration_seconds),
        audios (id, title, audio_url, thumbnail_url, duration, duration_seconds, speaker)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (search) {
      query = query.or(`title.ilike.%${search}%,short_description.ilike.%${search}%`);
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

    if (error) {
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('[SparksAdminService] fetchAdminSparks error:', err);
    throw err;
  }
};

/**
 * Fetch single spark by ID
 */
export const fetchSparkById = async (id) => {
  if (!id || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('sparks')
      .select(`
        *,
        videos (id, title, video_url, thumbnail_url, duration, duration_seconds),
        audios (id, title, audio_url, thumbnail_url, duration, duration_seconds, speaker)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[SparksAdminService] fetchSparkById error:', err);
    throw err;
  }
};

/**
 * Create a new Spark
 */
export const createSpark = async (sparkData) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Use provided slug or generate from title as invisible database fallback if schema requires it
    const generatedSlug = sparkData.slug?.trim() || (sparkData.title ? slugify(sparkData.title) : null);

    const payload = {
      title: sparkData.title.trim(),
      slug: generatedSlug,
      short_description: sparkData.short_description || null,
      category: sparkData.category || 'Mindfulness',
      duration: sparkData.duration || '4 min',
      thumbnail_url: sparkData.thumbnail_url || null,
      video_id: sparkData.video_id || null,
      audio_id: sparkData.audio_id || null,
      reflection: sparkData.reflection || null,
      insight: sparkData.insight || null,
      practice: sparkData.practice || null,
      status: sparkData.status || 'published',
      is_vip: Boolean(sparkData.is_vip),
      created_by: user?.id || null
    };

    const { data, error } = await supabase
      .from('sparks')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[SparksAdminService] createSpark error:', err);
    throw err;
  }
};

/**
 * Update an existing Spark
 */
export const updateSpark = async (id, sparkData) => {
  if (!id || !supabase) throw new Error('Missing ID or Supabase client');

  try {
    const payload = {
      title: sparkData.title?.trim(),
      short_description: sparkData.short_description ?? null,
      category: sparkData.category || 'Mindfulness',
      duration: sparkData.duration || '4 min',
      thumbnail_url: sparkData.thumbnail_url ?? null,
      video_id: sparkData.video_id || null,
      audio_id: sparkData.audio_id || null,
      reflection: sparkData.reflection ?? null,
      insight: sparkData.insight ?? null,
      practice: sparkData.practice ?? null,
      status: sparkData.status || 'published',
      is_vip: Boolean(sparkData.is_vip),
      updated_at: new Date().toISOString()
    };

    if (sparkData.slug) {
      payload.slug = sparkData.slug.trim();
    }

    const { data, error } = await supabase
      .from('sparks')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[SparksAdminService] updateSpark error:', err);
    throw err;
  }
};

/**
 * Create a new Spark along with associated Video and Audio records
 */
export const createSparkWithMedia = async (sparkFormData) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  let videoId = sparkFormData.video_id || null;
  let audioId = sparkFormData.audio_id || null;

  // 1. If video URL exists from upload, create corresponding Video record
  if (sparkFormData.video_url && !videoId) {
    try {
      const newVideo = await createVideo({
        title: sparkFormData.title,
        description: sparkFormData.short_description || `Contemplation video for ${sparkFormData.title}`,
        video_url: sparkFormData.video_url,
        thumbnail_url: sparkFormData.thumbnail_url || null,
        duration: sparkFormData.video_duration || '0:30',
        duration_seconds: sparkFormData.video_duration_seconds || 30,
        category: sparkFormData.category || 'Mindfulness',
        is_vip: Boolean(sparkFormData.is_vip),
        status: sparkFormData.status || 'published'
      });
      videoId = newVideo.id;
    } catch (err) {
      console.error('[SparksAdminService] Error creating associated video:', err);
      throw new Error(`Failed to save video record: ${err.message}`);
    }
  }

  // 2. If audio URL exists from upload, create corresponding Audio record
  if (sparkFormData.audio_url && !audioId) {
    try {
      const newAudio = await createAudio({
        title: `${sparkFormData.title} (Audio)`,
        description: sparkFormData.reflection || `Spoken contemplation for ${sparkFormData.title}`,
        audio_url: sparkFormData.audio_url,
        thumbnail_url: sparkFormData.thumbnail_url || null,
        duration: sparkFormData.audio_duration || '4 min',
        duration_seconds: sparkFormData.audio_duration_seconds || 240,
        category: sparkFormData.category || 'Mindfulness',
        speaker: 'Voice of Dr. Cubie',
        is_vip: Boolean(sparkFormData.is_vip),
        status: sparkFormData.status || 'published'
      });
      audioId = newAudio.id;
    } catch (err) {
      console.error('[SparksAdminService] Error creating associated audio:', err);
      throw new Error(`Failed to save audio record: ${err.message}`);
    }
  }

  // 3. Create the main Spark record
  const sparkPayload = {
    ...sparkFormData,
    video_id: videoId,
    audio_id: audioId
  };

  return await createSpark(sparkPayload);
};

/**
 * Update a Spark along with associated Video and Audio records
 */
export const updateSparkWithMedia = async (sparkId, sparkFormData, initialData = {}) => {
  if (!sparkId || !supabase) throw new Error('Missing ID or Supabase client');

  let videoId = initialData.video_id || null;
  let audioId = initialData.audio_id || null;

  // 1. Handle Video
  if (sparkFormData.video_url) {
    // New or updated video URL
    if (videoId) {
      // Update existing video record
      try {
        await updateVideo(videoId, {
          title: sparkFormData.title,
          video_url: sparkFormData.video_url,
          thumbnail_url: sparkFormData.thumbnail_url || null,
          category: sparkFormData.category || 'Mindfulness',
          duration: sparkFormData.video_duration || initialData.videos?.duration || '0:30',
          duration_seconds: sparkFormData.video_duration_seconds || initialData.videos?.duration_seconds || 30,
          is_vip: Boolean(sparkFormData.is_vip),
          status: sparkFormData.status || 'published'
        });
      } catch (err) {
        console.warn('[SparksAdminService] Could not update existing video record:', err);
      }
    } else {
      // Create new video record
      try {
        const newVideo = await createVideo({
          title: sparkFormData.title,
          description: sparkFormData.short_description || `Contemplation video for ${sparkFormData.title}`,
          video_url: sparkFormData.video_url,
          thumbnail_url: sparkFormData.thumbnail_url || null,
          duration: sparkFormData.video_duration || '0:30',
          duration_seconds: sparkFormData.video_duration_seconds || 30,
          category: sparkFormData.category || 'Mindfulness',
          is_vip: Boolean(sparkFormData.is_vip),
          status: sparkFormData.status || 'published'
        });
        videoId = newVideo.id;
      } catch (err) {
        console.error('[SparksAdminService] Error creating associated video:', err);
        throw new Error(`Failed to save video record: ${err.message}`);
      }
    }
  } else if (sparkFormData.video_url === null) {
    // Admin removed video
    videoId = null;
  }

  // 2. Handle Audio
  if (sparkFormData.audio_url) {
    // New or updated audio URL
    if (audioId) {
      // Update existing audio record
      try {
        await updateAudio(audioId, {
          title: `${sparkFormData.title} (Audio)`,
          audio_url: sparkFormData.audio_url,
          thumbnail_url: sparkFormData.thumbnail_url || null,
          category: sparkFormData.category || 'Mindfulness',
          speaker: initialData.audios?.speaker || 'Voice of Dr. Cubie',
          duration: sparkFormData.audio_duration || initialData.audios?.duration || '4 min',
          duration_seconds: sparkFormData.audio_duration_seconds || initialData.audios?.duration_seconds || 240,
          is_vip: Boolean(sparkFormData.is_vip),
          status: sparkFormData.status || 'published'
        });
      } catch (err) {
        console.warn('[SparksAdminService] Could not update existing audio record:', err);
      }
    } else {
      // Create new audio record
      try {
        const newAudio = await createAudio({
          title: `${sparkFormData.title} (Audio)`,
          description: sparkFormData.reflection || `Spoken contemplation for ${sparkFormData.title}`,
          audio_url: sparkFormData.audio_url,
          thumbnail_url: sparkFormData.thumbnail_url || null,
          duration: sparkFormData.audio_duration || '4 min',
          duration_seconds: sparkFormData.audio_duration_seconds || 240,
          category: sparkFormData.category || 'Mindfulness',
          speaker: 'Voice of Dr. Cubie',
          is_vip: Boolean(sparkFormData.is_vip),
          status: sparkFormData.status || 'published'
        });
        audioId = newAudio.id;
      } catch (err) {
        console.error('[SparksAdminService] Error creating associated audio:', err);
        throw new Error(`Failed to save audio record: ${err.message}`);
      }
    }
  } else if (sparkFormData.audio_url === null) {
    // Admin removed audio
    audioId = null;
  }

  // 3. Update main Spark record
  const sparkPayload = {
    ...sparkFormData,
    video_id: videoId,
    audio_id: audioId
  };

  const updatedSpark = await updateSpark(sparkId, sparkPayload);

  // 4. Safe Storage Cleanup of replaced objects (Requirement 10)
  if (sparkFormData.replacedOldThumbnailPath) {
    deleteStorageFile('thumbnails', sparkFormData.replacedOldThumbnailPath).catch((err) => {
      console.warn('[SparksAdminService] Cleanup old thumbnail note:', err.message);
    });
  }
  if (sparkFormData.replacedOldVideoPath) {
    deleteStorageFile('videos', sparkFormData.replacedOldVideoPath).catch((err) => {
      console.warn('[SparksAdminService] Cleanup old video note:', err.message);
    });
  }
  if (sparkFormData.replacedOldAudioPath) {
    deleteStorageFile('audio', sparkFormData.replacedOldAudioPath).catch((err) => {
      console.warn('[SparksAdminService] Cleanup old audio note:', err.message);
    });
  }

  return updatedSpark;
};

/**
 * Delete a Spark
 */
export const deleteSpark = async (id) => {
  if (!id || !supabase) throw new Error('Missing ID or Supabase client');

  try {
    const { error } = await supabase
      .from('sparks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[SparksAdminService] deleteSpark error:', err);
    throw err;
  }
};

