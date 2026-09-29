import { supabase } from '../supabase/client';

/**
 * Fetch all notifications for admin view
 */
export const fetchAdminNotifications = async (limit = 100) => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, title, message, type, related_content_id, related_content_type, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[NotificationsAdminService] fetchAdminNotifications error:', err);
    throw err;
  }
};

/**
 * Dispatch notification to specified target audience:
 * - 'all': all users in public.profiles
 * - 'vip': only users in public.profiles with is_vip = true
 * - 'specific': designated user_id
 */
export const sendNotification = async ({
  title,
  message,
  type = 'general',
  targetAudience = 'all',
  specificUserId = null,
  relatedContentId = null,
  relatedContentType = null
}) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!title?.trim() || !message?.trim()) throw new Error('Title and message are required');

  try {
    let targetUserIds = [];

    if (targetAudience === 'all') {
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id');
      if (profError) throw profError;
      targetUserIds = (profiles || []).map((p) => p.id);
    } else if (targetAudience === 'vip') {
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_vip', true);
      if (profError) throw profError;
      targetUserIds = (profiles || []).map((p) => p.id);
    } else if (targetAudience === 'specific') {
      if (!specificUserId) throw new Error('Specific user ID must be provided');
      targetUserIds = [specificUserId];
    }

    if (targetUserIds.length === 0) {
      return { count: 0, message: 'No recipient users found for selected audience.' };
    }

    const rows = targetUserIds.map((userId) => ({
      user_id: userId,
      title: title.trim(),
      message: message.trim(),
      type: type || 'general',
      related_content_id: relatedContentId || null,
      related_content_type: relatedContentType || null,
      is_read: false
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(rows)
      .select();

    if (error) throw error;

    return {
      count: data?.length || rows.length,
      data
    };
  } catch (err) {
    console.error('[NotificationsAdminService] sendNotification error:', err);
    throw err;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (id) => {
  if (!id || !supabase) throw new Error('Missing ID or Supabase client');

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[NotificationsAdminService] deleteNotification error:', err);
    throw err;
  }
};
