import { supabase } from '../supabase/client';

/**
 * Fetch live overview KPIs directly from Supabase tables.
 * Returns real values or 0 if empty. Never uses fake hardcoded numbers.
 */
export const fetchDashboardKpis = async () => {
  const defaultKpis = {
    totalUsers: 0,
    totalSparks: 0,
    totalVideos: 0,
    totalAudios: 0,
    totalRecommendations: 0,
    vipContentCount: 0,
    publishedContentCount: 0,
    activeNotificationsCount: 0
  };

  if (!supabase) return defaultKpis;

  try {
    const [
      usersRes,
      sparksRes,
      videosRes,
      audiosRes,
      recsRes,
      notificationsRes,
      vipSparksRes,
      vipVideosRes,
      vipAudiosRes,
      publishedSparksRes,
      publishedVideosRes,
      publishedAudiosRes
    ] = await Promise.all([
      // 1. Total Users
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      // 2. Total Sparks
      supabase.from('sparks').select('id', { count: 'exact', head: true }),
      // 3. Total Videos
      supabase.from('videos').select('id', { count: 'exact', head: true }),
      // 4. Total Audios
      supabase.from('audios').select('id', { count: 'exact', head: true }),
      // 5. Total Recommendations
      supabase.from('recommendations').select('id', { count: 'exact', head: true }),
      // 6. Active/Unread Notifications
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false),
      // 7. VIP counts
      supabase.from('sparks').select('id', { count: 'exact', head: true }).eq('is_vip', true),
      supabase.from('videos').select('id', { count: 'exact', head: true }).eq('is_vip', true),
      supabase.from('audios').select('id', { count: 'exact', head: true }).eq('is_vip', true),
      // 8. Published counts
      supabase.from('sparks').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('videos').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('audios').select('id', { count: 'exact', head: true }).eq('status', 'published')
    ]);

    const totalUsers = usersRes.count ?? 0;
    const totalSparks = sparksRes.count ?? 0;
    const totalVideos = videosRes.count ?? 0;
    const totalAudios = audiosRes.count ?? 0;
    const totalRecommendations = recsRes.count ?? 0;
    const activeNotificationsCount = notificationsRes.count ?? 0;

    const vipCount =
      (vipSparksRes.count ?? 0) +
      (vipVideosRes.count ?? 0) +
      (vipAudiosRes.count ?? 0);

    const publishedCount =
      (publishedSparksRes.count ?? 0) +
      (publishedVideosRes.count ?? 0) +
      (publishedAudiosRes.count ?? 0);

    return {
      totalUsers,
      totalSparks,
      totalVideos,
      totalAudios,
      totalRecommendations,
      vipContentCount: vipCount,
      publishedContentCount: publishedCount,
      activeNotificationsCount
    };
  } catch (err) {
    console.error('[DashboardService] Error fetching KPIs:', err);
    return defaultKpis;
  }
};

/**
 * Fetch recent content items across sparks, videos, and audios
 */
export const fetchRecentContent = async (limit = 6) => {
  if (!supabase) return [];

  try {
    const [sparksRes, videosRes, audiosRes] = await Promise.all([
      supabase
        .from('sparks')
        .select('id, title, category, status, is_vip, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('videos')
        .select('id, title, category, status, is_vip, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('audios')
        .select('id, title, category, status, is_vip, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)
    ]);

    const sparks = (sparksRes.data || []).map((s) => ({ ...s, type: 'spark' }));
    const videos = (videosRes.data || []).map((v) => ({ ...v, type: 'video' }));
    const audios = (audiosRes.data || []).map((a) => ({ ...a, type: 'audio' }));

    const combined = [...sparks, ...videos, ...audios]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    return combined;
  } catch (err) {
    console.error('[DashboardService] Error fetching recent content:', err);
    return [];
  }
};
