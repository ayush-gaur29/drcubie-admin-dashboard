import { supabase } from '../supabase/client';

/**
 * Fetch registered users from public.profiles
 * RLS allows admin users to select all profiles
 */
export const fetchAdminUsers = async ({
  search = '',
  role = '',
  isVip = null,
  limit = 50
} = {}) => {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role, is_vip, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (isVip !== null && isVip !== '') {
      query = query.eq('is_vip', isVip === 'true' || isVip === true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[UsersAdminService] fetchAdminUsers error:', err);
    throw err;
  }
};

/**
 * Fetch a single user profile by ID
 */
export const fetchUserById = async (id) => {
  if (!id || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role, is_vip, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[UsersAdminService] fetchUserById error:', err);
    throw err;
  }
};

/**
 * Toggle or update VIP entitlement for a user profile
 */
export const toggleUserVip = async (id, isVip) => {
  if (!id || !supabase) throw new Error('Missing ID or Supabase client');

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_vip: isVip,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[UsersAdminService] toggleUserVip error:', err);
    throw err;
  }
};
