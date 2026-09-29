import { supabase } from '../supabase/client';

/**
 * Fetch all scheduled daily content entries with joined spark, video, and audio metadata
 */
export const fetchDailyContentList = async () => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('daily_content')
      .select(`
        id,
        content_date,
        status,
        created_at,
        updated_at,
        sparks (
          id,
          title,
          slug,
          category,
          thumbnail_url,
          video_id,
          audio_id,
          videos (id, title, duration),
          audios (id, title, speaker, duration)
        )
      `)
      .order('content_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[DailyContentAdminService] fetchDailyContentList error:', err);
    throw err;
  }
};

/**
 * Fetch daily content for a specific date (YYYY-MM-DD)
 */
export const fetchDailyContentByDate = async (dateStr) => {
  if (!supabase || !dateStr) return null;

  try {
    const { data, error } = await supabase
      .from('daily_content')
      .select(`
        id,
        content_date,
        status,
        spark_id,
        sparks (
          id,
          title,
          slug,
          category,
          thumbnail_url,
          video_id,
          audio_id,
          videos (id, title, duration),
          audios (id, title, speaker, duration)
        )
      `)
      .eq('content_date', dateStr)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[DailyContentAdminService] fetchDailyContentByDate error:', err);
    throw err;
  }
};

/**
 * Save daily programming for a specific date.
 * Allows optionally updating the assigned Spark's linked video_id and audio_id directly.
 */
export const saveDailyContent = async ({
  content_date,
  spark_id,
  status = 'published',
  video_id = null,
  audio_id = null
}) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!content_date || !spark_id) throw new Error('Date and Spark are required');

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. If video_id or audio_id are explicitly modified/specified, update the Spark record
    if (video_id !== undefined || audio_id !== undefined) {
      const sparkUpdates = {};
      if (video_id !== undefined) sparkUpdates.video_id = video_id || null;
      if (audio_id !== undefined) sparkUpdates.audio_id = audio_id || null;

      if (Object.keys(sparkUpdates).length > 0) {
        sparkUpdates.updated_at = new Date().toISOString();
        await supabase
          .from('sparks')
          .update(sparkUpdates)
          .eq('id', spark_id);
      }
    }

    // 2. Upsert the daily_content entry for the calendar date
    const payload = {
      content_date,
      spark_id,
      status,
      created_by: user?.id || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('daily_content')
      .upsert(payload, { onConflict: 'content_date' })
      .select(`
        id,
        content_date,
        status,
        spark_id,
        sparks (
          id,
          title,
          category,
          video_id,
          audio_id,
          videos (id, title),
          audios (id, title)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[DailyContentAdminService] saveDailyContent error:', err);
    throw err;
  }
};

/**
 * Delete a daily content entry
 */
export const deleteDailyContent = async (id) => {
  if (!id || !supabase) throw new Error('Missing ID or Supabase client');

  try {
    const { error } = await supabase
      .from('daily_content')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[DailyContentAdminService] deleteDailyContent error:', err);
    throw err;
  }
};
