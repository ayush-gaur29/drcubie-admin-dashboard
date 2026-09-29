import { supabase } from '../supabase/client.js';

const SETTINGS_STORAGE_KEY = 'drcubie_vip_settings_v1';

const DEFAULT_SETTINGS = {
  vip_access_enabled: true,
  content_visibility: 'locked', // 'locked' = visible with lock, 'hidden' = hidden completely
  entitlement_behavior: 'trial', // 'trial' = 14-day free trial, 'instant' = instant VIP access
  vip_title: 'VIP Sanctuary Pass',
  vip_subtitle: 'Elevate Your Daily Practice',
  vip_cohort: 'Annual Cohort',
  vip_message: "Unrestricted access to Dr. Cubie's private audio archives, exclusive video masterclasses, and offline contemplation sanctuary.",
  featured_content_id: null,
  featured_content_type: null
};

/**
 * Fetch dynamic overview KPIs for VIP Pass directly from Supabase
 */
export const fetchVipKpis = async () => {
  const defaultKpis = {
    vipMembers: 0,
    vipVideos: 0,
    vipAudios: 0,
    vipSparks: 0,
    activeVipContent: 0,
    totalContent: 0
  };

  if (!supabase) return defaultKpis;

  try {
    const [
      vipMembersRes,
      vipVideosRes,
      vipAudiosRes,
      vipSparksRes,
      activeSparksRes,
      activeVideosRes,
      activeAudiosRes,
      totalSparksRes,
      totalVideosRes,
      totalAudiosRes
    ] = await Promise.all([
      // 1. VIP Members count from profiles
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_vip', true),
      // 2. VIP Videos count
      supabase.from('videos').select('id', { count: 'exact', head: true }).eq('is_vip', true),
      // 3. VIP Audios count
      supabase.from('audios').select('id', { count: 'exact', head: true }).eq('is_vip', true),
      // 4. VIP Sparks count
      supabase.from('sparks').select('id', { count: 'exact', head: true }).eq('is_vip', true),
      // 5. Active/Published VIP content counts
      supabase.from('sparks').select('id', { count: 'exact', head: true }).eq('is_vip', true).eq('status', 'published'),
      supabase.from('videos').select('id', { count: 'exact', head: true }).eq('is_vip', true).eq('status', 'published'),
      supabase.from('audios').select('id', { count: 'exact', head: true }).eq('is_vip', true).eq('status', 'published'),
      // 6. Total content across all modules
      supabase.from('sparks').select('id', { count: 'exact', head: true }),
      supabase.from('videos').select('id', { count: 'exact', head: true }),
      supabase.from('audios').select('id', { count: 'exact', head: true })
    ]);

    const vipMembers = vipMembersRes.count ?? 0;
    const vipVideos = vipVideosRes.count ?? 0;
    const vipAudios = vipAudiosRes.count ?? 0;
    const vipSparks = vipSparksRes.count ?? 0;
    const activeVipContent =
      (activeSparksRes.count ?? 0) +
      (activeVideosRes.count ?? 0) +
      (activeAudiosRes.count ?? 0);
    const totalContent =
      (totalSparksRes.count ?? 0) +
      (totalVideosRes.count ?? 0) +
      (totalAudiosRes.count ?? 0);

    return {
      vipMembers,
      vipVideos,
      vipAudios,
      vipSparks,
      activeVipContent,
      totalContent
    };
  } catch (err) {
    console.error('[VipPassAdminService] Error fetching VIP KPIs:', err);
    return defaultKpis;
  }
};

/**
 * Fetch unified content (Sparks, Videos, Audios) from Supabase with VIP metadata
 */
export const fetchUnifiedContent = async ({
  type = 'all',
  vipFilter = 'all',
  status = 'all',
  search = ''
} = {}) => {
  if (!supabase) return [];

  try {
    const promises = [];

    // Fetch sparks if requested
    if (type === 'all' || type === 'spark') {
      let sparkQuery = supabase
        .from('sparks')
        .select('id, title, short_description, category, duration, thumbnail_url, is_vip, status, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (vipFilter === 'vip') sparkQuery = sparkQuery.eq('is_vip', true);
      if (vipFilter === 'non-vip') sparkQuery = sparkQuery.eq('is_vip', false);
      if (status !== 'all' && status) sparkQuery = sparkQuery.eq('status', status);

      promises.push(
        sparkQuery.then(({ data, error }) => {
          if (error) {
            console.error('Error fetching sparks:', error);
            return [];
          }
          return (data || []).map((item) => ({
            id: item.id,
            content_type: 'spark',
            title: item.title,
            description: (item.short_description || '').replace(/\[VIP_FEATURED\]/g, '').trim(),
            category: item.category || 'Mindfulness',
            duration: item.duration || '3 min',
            thumbnail_url: item.thumbnail_url,
            is_vip: Boolean(item.is_vip),
            is_featured: (item.short_description || '').includes('[VIP_FEATURED]'),
            status: item.status || 'published',
            created_at: item.created_at,
            updated_at: item.updated_at,
            raw: item
          }));
        })
      );
    }

    // Fetch videos if requested
    if (type === 'all' || type === 'video') {
      let videoQuery = supabase
        .from('videos')
        .select('id, title, description, category, duration, duration_seconds, thumbnail_url, video_url, is_vip, status, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (vipFilter === 'vip') videoQuery = videoQuery.eq('is_vip', true);
      if (vipFilter === 'non-vip') videoQuery = videoQuery.eq('is_vip', false);
      if (status !== 'all' && status) videoQuery = videoQuery.eq('status', status);

      promises.push(
        videoQuery.then(({ data, error }) => {
          if (error) {
            console.error('Error fetching videos:', error);
            return [];
          }
          return (data || []).map((item) => ({
            id: item.id,
            content_type: 'video',
            title: item.title,
            description: (item.description || '').replace(/\[VIP_FEATURED\]/g, '').trim(),
            category: item.category || 'Focus',
            duration: item.duration || '0:30',
            duration_seconds: item.duration_seconds,
            thumbnail_url: item.thumbnail_url,
            media_url: item.video_url,
            is_vip: Boolean(item.is_vip),
            is_featured: (item.description || '').includes('[VIP_FEATURED]'),
            status: item.status || 'published',
            created_at: item.created_at,
            updated_at: item.updated_at,
            raw: item
          }));
        })
      );
    }

    // Fetch audios if requested
    if (type === 'all' || type === 'audio') {
      let audioQuery = supabase
        .from('audios')
        .select('id, title, description, category, duration, duration_seconds, speaker, thumbnail_url, audio_url, is_vip, status, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (vipFilter === 'vip') audioQuery = audioQuery.eq('is_vip', true);
      if (vipFilter === 'non-vip') audioQuery = audioQuery.eq('is_vip', false);
      if (status !== 'all' && status) audioQuery = audioQuery.eq('status', status);

      promises.push(
        audioQuery.then(({ data, error }) => {
          if (error) {
            console.error('Error fetching audios:', error);
            return [];
          }
          return (data || []).map((item) => ({
            id: item.id,
            content_type: 'audio',
            title: item.title,
            description: (item.description || '').replace(/\[VIP_FEATURED\]/g, '').trim(),
            category: item.category || 'Mindfulness',
            duration: item.duration || '1 min',
            duration_seconds: item.duration_seconds,
            speaker: item.speaker || 'Dr. Cubie',
            thumbnail_url: item.thumbnail_url,
            media_url: item.audio_url,
            is_vip: Boolean(item.is_vip),
            is_featured: (item.description || '').includes('[VIP_FEATURED]'),
            status: item.status || 'published',
            created_at: item.created_at,
            updated_at: item.updated_at,
            raw: item
          }));
        })
      );
    }

    const results = await Promise.all(promises);
    let unified = results.flat();

    // Check localStorage fallback for featured item if not tagged in DB
    const savedSettings = getLocalVipSettings();
    if (savedSettings.featured_content_id) {
      const hasDbFeatured = unified.some((item) => item.is_featured);
      if (!hasDbFeatured) {
        unified = unified.map((item) => ({
          ...item,
          is_featured: item.id === savedSettings.featured_content_id
        }));
      }
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      unified = unified.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }

    // Sort by created_at descending
    unified.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return unified;
  } catch (err) {
    console.error('[VipPassAdminService] Error fetching unified content:', err);
    return [];
  }
};

/**
 * Toggle VIP status on a specific content item in its existing Supabase table
 */
export const toggleContentVip = async (contentType, id, isVip) => {
  if (!id || !supabase) throw new Error('Missing ID or Supabase client');

  const table =
    contentType === 'spark' ? 'sparks' : contentType === 'video' ? 'videos' : 'audios';

  try {
    const { data, error } = await supabase
      .from(table)
      .update({
        is_vip: Boolean(isVip),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`[VipPassAdminService] toggleContentVip error on ${table}:`, err);
    throw err;
  }
};

/**
 * Mark a single content item as the featured VIP highlight.
 * Automatically removes the featured flag from any previously featured item.
 */
export const setFeaturedVipContent = async (contentType, id) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // 1. Clean existing [VIP_FEATURED] tags from all 3 tables in Supabase
    const [sparksWithTag, videosWithTag, audiosWithTag] = await Promise.all([
      supabase.from('sparks').select('id, short_description').ilike('short_description', '%[VIP_FEATURED]%'),
      supabase.from('videos').select('id, description').ilike('description', '%[VIP_FEATURED]%'),
      supabase.from('audios').select('id, description').ilike('description', '%[VIP_FEATURED]%')
    ]);

    const cleanPromises = [];
    (sparksWithTag.data || []).forEach((s) => {
      cleanPromises.push(
        supabase
          .from('sparks')
          .update({
            short_description: (s.short_description || '').replace(/\s*\[VIP_FEATURED\]/g, '').trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', s.id)
      );
    });
    (videosWithTag.data || []).forEach((v) => {
      cleanPromises.push(
        supabase
          .from('videos')
          .update({
            description: (v.description || '').replace(/\s*\[VIP_FEATURED\]/g, '').trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', v.id)
      );
    });
    (audiosWithTag.data || []).forEach((a) => {
      cleanPromises.push(
        supabase
          .from('audios')
          .update({
            description: (a.description || '').replace(/\s*\[VIP_FEATURED\]/g, '').trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', a.id)
      );
    });

    if (cleanPromises.length > 0) {
      await Promise.all(cleanPromises);
    }

    // 2. Add [VIP_FEATURED] tag to target item and ensure is_vip = true
    if (id && contentType) {
      const table =
        contentType === 'spark' ? 'sparks' : contentType === 'video' ? 'videos' : 'audios';
      const descField = contentType === 'spark' ? 'short_description' : 'description';

      const { data: item } = await supabase
        .from(table)
        .select(`id, ${descField}`)
        .eq('id', id)
        .maybeSingle();

      if (item) {
        const rawDesc = item[descField] || '';
        const newDesc = rawDesc.includes('[VIP_FEATURED]')
          ? rawDesc
          : rawDesc
          ? `${rawDesc} [VIP_FEATURED]`
          : '[VIP_FEATURED]';

        await supabase
          .from(table)
          .update({
            [descField]: newDesc,
            is_vip: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
      }
    }

    // 3. Persist to local settings cache as well
    saveLocalVipSettings({
      featured_content_id: id,
      featured_content_type: contentType
    });

    return true;
  } catch (err) {
    console.error('[VipPassAdminService] setFeaturedVipContent error:', err);
    throw err;
  }
};

/**
 * Fetch candidates of existing non-VIP items that can be added to VIP
 */
export const fetchNonVipCandidates = async () => {
  if (!supabase) return { sparks: [], videos: [], audios: [] };

  try {
    const [sparksRes, videosRes, audiosRes] = await Promise.all([
      supabase
        .from('sparks')
        .select('id, title, category, thumbnail_url, is_vip')
        .eq('is_vip', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('videos')
        .select('id, title, category, thumbnail_url, is_vip')
        .eq('is_vip', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('audios')
        .select('id, title, category, thumbnail_url, is_vip')
        .eq('is_vip', false)
        .order('created_at', { ascending: false })
    ]);

    return {
      sparks: sparksRes.data || [],
      videos: videosRes.data || [],
      audios: audiosRes.data || []
    };
  } catch (err) {
    console.error('[VipPassAdminService] fetchNonVipCandidates error:', err);
    return { sparks: [], videos: [], audios: [] };
  }
};

/**
 * Fetch VIP members list from public.profiles where is_vip = true
 */
export const fetchVipMembers = async () => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role, is_vip, created_at, updated_at')
      .eq('is_vip', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[VipPassAdminService] fetchVipMembers error:', err);
    return [];
  }
};

/**
 * Fetch standard non-VIP members list for granting VIP
 */
export const fetchStandardMembers = async () => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role, is_vip, created_at, updated_at')
      .eq('is_vip', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[VipPassAdminService] fetchStandardMembers error:', err);
    return [];
  }
};

/**
 * Toggle member VIP entitlement directly in public.profiles
 */
export const toggleMemberVip = async (userId, isVip) => {
  if (!userId || !supabase) throw new Error('Missing User ID or Supabase client');

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_vip: Boolean(isVip),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[VipPassAdminService] toggleMemberVip error:', err);
    throw err;
  }
};

/**
 * Local settings helpers
 */
export const getLocalVipSettings = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    }
  } catch (e) {
    console.warn('Failed reading local VIP settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
};

export const saveLocalVipSettings = (newSettings) => {
  try {
    const current = getLocalVipSettings();
    const merged = { ...current, ...newSettings };
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch (e) {
    console.warn('Failed saving local VIP settings:', e);
    return { ...DEFAULT_SETTINGS, ...newSettings };
  }
};
