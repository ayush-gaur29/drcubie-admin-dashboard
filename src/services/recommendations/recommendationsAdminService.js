import { supabase } from '../supabase/client.js';

/**
 * Fetch all recommendations ordered by active status, then display_order ascending, then created_at
 */
export const fetchAdminRecommendations = async () => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('recommendations')
      .select('id, title, content_type, content_id, category, display_order, is_active, created_at, updated_at')
      .order('is_active', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[RecommendationsAdminService] fetchAdminRecommendations error:', err);
    throw err;
  }
};

/**
 * Fetch candidate items across sparks, videos, and audios for recommendation linking
 */
export const fetchRecommendationCandidates = async () => {
  if (!supabase) return { sparks: [], videos: [], audios: [] };

  try {
    const [sparksRes, videosRes, audiosRes] = await Promise.all([
      supabase.from('sparks').select('id, title, category, thumbnail_url').order('created_at', { ascending: false }),
      supabase.from('videos').select('id, title, category, thumbnail_url').order('created_at', { ascending: false }),
      supabase.from('audios').select('id, title, category, thumbnail_url').order('created_at', { ascending: false })
    ]);

    return {
      sparks: sparksRes.data || [],
      videos: videosRes.data || [],
      audios: audiosRes.data || []
    };
  } catch (err) {
    console.error('[RecommendationsAdminService] fetchRecommendationCandidates error:', err);
    return { sparks: [], videos: [], audios: [] };
  }
};

/**
 * Persist normalized order for an array of active recommendation IDs:
 * index 0 -> display_order 1, index 1 -> display_order 2, etc.
 */
export const persistActiveRecommendationsOrder = async (orderedActiveIds) => {
  if (!supabase || !Array.isArray(orderedActiveIds) || orderedActiveIds.length === 0) return;

  const updates = orderedActiveIds.map((id, index) => {
    return supabase
      .from('recommendations')
      .update({
        display_order: index + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
  });

  const results = await Promise.all(updates);
  const err = results.find((r) => r.error);
  if (err && err.error) throw err.error;
};

/**
 * Normalizes all active recommendations currently in the database to 1, 2, ..., n
 */
export const normalizeDatabaseRecommendations = async () => {
  if (!supabase) return;
  try {
    const { data: activeItems, error } = await supabase
      .from('recommendations')
      .select('id, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !activeItems) return;

    let needsUpdate = false;
    for (let i = 0; i < activeItems.length; i++) {
      if (activeItems[i].display_order !== i + 1) {
        needsUpdate = true;
        break;
      }
    }

    if (needsUpdate) {
      await persistActiveRecommendationsOrder(activeItems.map((item) => item.id));
    }
  } catch (err) {
    console.warn('[RecommendationsAdminService] normalizeDatabaseRecommendations error:', err);
  }
};

/**
 * Create a new recommendation with position placement
 * targetPosition: 1-indexed integer or 'last' / null
 */
export const createRecommendation = async (recData, targetPosition = 'last') => {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const isActive = Boolean(recData.is_active ?? true);

    // If created as inactive, store with display_order 0
    if (!isActive) {
      const payload = {
        title: recData.title.trim(),
        content_type: recData.content_type,
        content_id: recData.content_id,
        category: recData.category || 'Mindfulness',
        display_order: 0,
        is_active: false,
        created_by: user?.id || null
      };

      const { data, error } = await supabase
        .from('recommendations')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Active recommendation creation:
    // 1. Fetch current active recommendations in order
    const { data: currentActive, error: fetchErr } = await supabase
      .from('recommendations')
      .select('id, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (fetchErr) throw fetchErr;

    const activeList = currentActive || [];
    const totalActive = activeList.length;

    // Determine target position (1-indexed)
    let pos = totalActive + 1;
    if (targetPosition !== 'last' && targetPosition != null) {
      const parsed = parseInt(targetPosition, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= totalActive + 1) {
        pos = parsed;
      }
    }

    // 2. Insert new recommendation with tentative display_order
    const payload = {
      title: recData.title.trim(),
      content_type: recData.content_type,
      content_id: recData.content_id,
      category: recData.category || 'Mindfulness',
      display_order: pos,
      is_active: true,
      created_by: user?.id || null
    };

    const { data: newRec, error: insertErr } = await supabase
      .from('recommendations')
      .insert([payload])
      .select()
      .single();

    if (insertErr) throw insertErr;

    // 3. Assemble new active order array: insert newRec.id at index pos - 1
    const newActiveIds = activeList.map((item) => item.id);
    newActiveIds.splice(pos - 1, 0, newRec.id);

    // 4. Persist normalized contiguous order 1..N
    await persistActiveRecommendationsOrder(newActiveIds);

    return newRec;
  } catch (err) {
    console.error('[RecommendationsAdminService] createRecommendation error:', err);
    throw err;
  }
};

/**
 * Update an existing recommendation and handle position repositioning
 */
export const updateRecommendation = async (id, recData, targetPosition = null) => {
  if (!id || !supabase) throw new Error('Missing ID or Supabase client');

  try {
    const isActive = Boolean(recData.is_active);

    // Fetch all current active recommendations
    const { data: currentActive, error: fetchErr } = await supabase
      .from('recommendations')
      .select('id, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (fetchErr) throw fetchErr;

    const activeList = currentActive || [];
    const wasActive = activeList.some((item) => item.id === id);

    // Case 1: Updating to INACTIVE
    if (!isActive) {
      const payload = {
        title: recData.title?.trim(),
        content_type: recData.content_type,
        content_id: recData.content_id,
        category: recData.category || 'Mindfulness',
        display_order: 0,
        is_active: false,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('recommendations')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If it was active, compact the remaining active items to 1..k-1
      if (wasActive) {
        const remainingActiveIds = activeList
          .filter((item) => item.id !== id)
          .map((item) => item.id);
        await persistActiveRecommendationsOrder(remainingActiveIds);
      }

      return data;
    }

    // Case 2: ACTIVE recommendation
    if (wasActive) {
      // It was already in active list
      const currentIndex = activeList.findIndex((item) => item.id === id);
      const totalActive = activeList.length;

      let pos = currentIndex + 1;
      if (targetPosition !== null && targetPosition !== undefined) {
        if (targetPosition === 'last') {
          pos = totalActive;
        } else {
          const parsed = parseInt(targetPosition, 10);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= totalActive) {
            pos = parsed;
          }
        }
      }

      // Reorder array
      const reorderedActiveIds = activeList.filter((item) => item.id !== id).map((item) => item.id);
      reorderedActiveIds.splice(pos - 1, 0, id);

      // Update current item fields
      const payload = {
        title: recData.title?.trim(),
        content_type: recData.content_type,
        content_id: recData.content_id,
        category: recData.category || 'Mindfulness',
        display_order: pos,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('recommendations')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;

      // If position actually changed, re-persist order for all affected items
      if (pos !== currentIndex + 1) {
        await persistActiveRecommendationsOrder(reorderedActiveIds);
      }

      return data;
    } else {
      // Was previously INACTIVE, now becoming ACTIVE
      const totalActive = activeList.length;
      let pos = totalActive + 1;
      if (targetPosition !== null && targetPosition !== undefined && targetPosition !== 'last') {
        const parsed = parseInt(targetPosition, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= totalActive + 1) {
          pos = parsed;
        }
      }

      const activeIds = activeList.map((item) => item.id);
      activeIds.splice(pos - 1, 0, id);

      const payload = {
        title: recData.title?.trim(),
        content_type: recData.content_type,
        content_id: recData.content_id,
        category: recData.category || 'Mindfulness',
        display_order: pos,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('recommendations')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;

      await persistActiveRecommendationsOrder(activeIds);
      return data;
    }
  } catch (err) {
    console.error('[RecommendationsAdminService] updateRecommendation error:', err);
    throw err;
  }
};

/**
 * Toggle recommendation active status and re-normalize active order
 */
export const toggleRecommendationActive = async (id, isActive) => {
  if (!id || !supabase) throw new Error('Missing ID or Supabase client');

  try {
    if (!isActive) {
      // Deactivating: set is_active = false, display_order = 0
      const { error } = await supabase
        .from('recommendations')
        .update({
          is_active: false,
          display_order: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Compact remaining active items
      const { data: remainingActive } = await supabase
        .from('recommendations')
        .select('id, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (remainingActive && remainingActive.length > 0) {
        await persistActiveRecommendationsOrder(remainingActive.map((item) => item.id));
      }
      return true;
    } else {
      // Activating: append to end of active list
      const { data: currentActive } = await supabase
        .from('recommendations')
        .select('id')
        .eq('is_active', true);

      const nextOrder = (currentActive?.length || 0) + 1;

      const { error } = await supabase
        .from('recommendations')
        .update({
          is_active: true,
          display_order: nextOrder,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  } catch (err) {
    console.error('[RecommendationsAdminService] toggleRecommendationActive error:', err);
    throw err;
  }
};

/**
 * Delete a recommendation and compact remaining active items
 */
export const deleteRecommendation = async (id) => {
  if (!id || !supabase) throw new Error('Missing ID or Supabase client');

  try {
    // 1. Fetch item to know if it was active
    const { data: item } = await supabase
      .from('recommendations')
      .select('is_active, display_order')
      .eq('id', id)
      .maybeSingle();

    const wasActive = item?.is_active;

    // 2. Delete the record
    const { error } = await supabase
      .from('recommendations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // 3. Compact remaining active list if deleted item was active
    if (wasActive) {
      const { data: remainingActive } = await supabase
        .from('recommendations')
        .select('id, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (remainingActive && remainingActive.length > 0) {
        await persistActiveRecommendationsOrder(remainingActive.map((r) => r.id));
      }
    }

    return true;
  } catch (err) {
    console.error('[RecommendationsAdminService] deleteRecommendation error:', err);
    throw err;
  }
};
