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
 * Resolves destination route for push notification navigation:
 * - General/Inbox -> 'notifications'
 * - Today -> 'today'
 * - Spark -> 'spark/:id' or 'today'
 * - Video -> 'videos/:id' or 'videos'
 * - Audio -> 'audios/:id' or 'audios'
 * - VIP Pass -> 'vip-pass'
 */
export const resolveDestinationRoute = ({
  route = null,
  type = 'general',
  relatedContentType = null,
  relatedContentId = null
}) => {
  if (route && typeof route === 'string' && route.trim()) {
    return route.trim();
  }

  const relType = String(relatedContentType || '').trim().toLowerCase();
  const notifType = String(type || '').trim().toLowerCase();
  const relId = relatedContentId ? String(relatedContentId).trim() : null;

  if (relType === 'spark' || notifType === 'spark') {
    return relId ? `spark/${relId}` : 'today';
  }
  if (relType === 'video' || notifType === 'video') {
    return relId ? `videos/${relId}` : 'videos';
  }
  if (relType === 'audio' || notifType === 'audio') {
    return relId ? `audios/${relId}` : 'audios';
  }
  if (relType === 'vip' || notifType === 'vip') {
    return 'vip-pass';
  }
  if (relType === 'today') {
    return 'today';
  }
  if (relType === 'streak' || notifType === 'streak' || relType === 'profile' || notifType === 'profile') {
    return 'profile';
  }

  return 'notifications';
};

/**
 * Dispatch notification to specified target audience:
 * - 'all': all users in public.profiles (FCM broadcast: true)
 * - 'vip': only users in public.profiles with is_vip = true (FCM userIds: [...])
 * - 'specific': designated user_id (FCM userId: specificUserId)
 * 
 * 1. Inserts in-app notification rows into public.notifications.
 * 2. Invokes Supabase Edge Function 'send-push-notification' for FCM system push delivery.
 */
export const sendNotification = async ({
  title,
  message,
  type = 'general',
  targetAudience = 'all',
  specificUserId = null,
  relatedContentId = null,
  relatedContentType = null,
  route = null
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

    // 1. Insert in-app notifications into public.notifications
    const rows = targetUserIds.map((userId) => ({
      user_id: userId,
      title: title.trim(),
      message: message.trim(),
      type: type || 'general',
      related_content_id: relatedContentId || null,
      related_content_type: relatedContentType || null,
      is_read: false
    }));

    const { data: insertedRows, error: insertError } = await supabase
      .from('notifications')
      .insert(rows)
      .select();

    if (insertError) throw insertError;

    // 2. Resolve final route for FCM push data payload
    const finalRoute = resolveDestinationRoute({
      route,
      type,
      relatedContentType,
      relatedContentId
    });

    // 3. Construct push payload for Edge Function
    const pushPayload = {
      title: title.trim(),
      message: message.trim(),
      type: type || 'general',
      relatedContentId: relatedContentId || null,
      relatedContentType: relatedContentType || null,
      route: finalRoute || null
    };

    if (targetAudience === 'all') {
      pushPayload.broadcast = true;
    } else if (targetAudience === 'vip') {
      pushPayload.userIds = targetUserIds;
    } else if (targetAudience === 'specific') {
      pushPayload.userId = specificUserId;
    }


    // 4. Invoke send-push-notification Edge Function
    // Automatically includes active admin JWT in Authorization header & apikey
    const { data: pushResult, error: pushError } = await supabase.functions.invoke(
      'send-push-notification',
      {
        body: pushPayload
      }
    );

    if (pushError) {
      console.error('[NotificationsAdminService] send-push-notification invocation failed:', pushError);
      throw new Error(`Push notification dispatch failed: ${pushError.message || 'Edge function error'}`);
    }

    if (pushResult && pushResult.success === false) {
      console.error('[NotificationsAdminService] send-push-notification returned failure:', pushResult);
      throw new Error(`Push notification dispatch failed: ${pushResult.error || 'FCM delivery failed'}`);
    }

    return {
      count: insertedRows?.length || rows.length,
      data: insertedRows,
      pushResult,
      pushPayload
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
