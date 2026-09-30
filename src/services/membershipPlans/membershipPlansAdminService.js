import { supabase } from '../supabase/client';

/**
 * Check whether an error indicates the Supabase membership_plans table hasn't been created yet.
 */
export const isTableMissingError = (error) => {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('membership_plans') && (msg.includes('not find') || msg.includes('schema cache') || msg.includes('does not exist'))
  );
};

/**
 * Fetch all membership plans from Supabase ordered by display_order ascending, then created_at descending
 */
export const fetchMembershipPlans = async () => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        const customErr = new Error("The 'membership_plans' table does not exist in Supabase yet. Please execute the migration SQL.");
        customErr.code = 'TABLE_NOT_FOUND';
        throw customErr;
      }
      throw error;
    }

    return (data || []).map((plan) => ({
      ...plan,
      features: Array.isArray(plan.features) ? plan.features : []
    }));
  } catch (err) {
    console.error('[MembershipPlansAdminService] fetchMembershipPlans error:', err);
    throw err;
  }
};

/**
 * Fetch single membership plan by ID
 */
export const fetchMembershipPlanById = async (id) => {
  if (!id || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        const customErr = new Error("The 'membership_plans' table does not exist in Supabase yet.");
        customErr.code = 'TABLE_NOT_FOUND';
        throw customErr;
      }
      throw error;
    }

    if (data) {
      data.features = Array.isArray(data.features) ? data.features : [];
    }
    return data;
  } catch (err) {
    console.error('[MembershipPlansAdminService] fetchMembershipPlanById error:', err);
    throw err;
  }
};

/**
 * Create a new membership plan in Supabase
 */
export const createMembershipPlan = async (planData) => {
  if (!supabase) throw new Error('Supabase client is not initialized.');

  // Validate required fields
  if (!planData.name || !planData.name.trim()) {
    throw new Error('Plan Name is required.');
  }

  const priceNum = parseFloat(planData.price);
  if (isNaN(priceNum) || priceNum < 0) {
    throw new Error('Price must be a valid non-negative number.');
  }

  const displayOrderNum = parseInt(planData.display_order, 10);
  const displayOrder = isNaN(displayOrderNum) ? 0 : displayOrderNum;

  const trialDaysNum = parseInt(planData.trial_days, 10);
  const trialDays = isNaN(trialDaysNum) || trialDaysNum < 0 ? 0 : trialDaysNum;

  // Clean features array (remove empty strings)
  const cleanFeatures = Array.isArray(planData.features)
    ? planData.features.map((f) => (typeof f === 'string' ? f.trim() : '')).filter(Boolean)
    : [];

  const payload = {
    name: planData.name.trim(),
    plan_type: planData.plan_type || 'Monthly',
    price: priceNum,
    billing_period: planData.billing_period || 'Monthly',
    description: planData.description?.trim() || null,
    discount_text: planData.discount_text?.trim() || null,
    trial_days: trialDays,
    features: cleanFeatures,
    is_active: planData.is_active !== undefined ? Boolean(planData.is_active) : true,
    display_order: displayOrder
  };

  try {
    const { data, error } = await supabase
      .from('membership_plans')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        const customErr = new Error("The 'membership_plans' table does not exist in Supabase yet. Please execute the migration SQL.");
        customErr.code = 'TABLE_NOT_FOUND';
        throw customErr;
      }
      throw error;
    }

    return data;
  } catch (err) {
    console.error('[MembershipPlansAdminService] createMembershipPlan error:', err);
    throw err;
  }
};

/**
 * Update an existing membership plan in Supabase
 */
export const updateMembershipPlan = async (id, planData) => {
  if (!id) throw new Error('Plan ID is required for update.');
  if (!supabase) throw new Error('Supabase client is not initialized.');

  if (!planData.name || !planData.name.trim()) {
    throw new Error('Plan Name is required.');
  }

  const priceNum = parseFloat(planData.price);
  if (isNaN(priceNum) || priceNum < 0) {
    throw new Error('Price must be a valid non-negative number.');
  }

  const displayOrderNum = parseInt(planData.display_order, 10);
  const displayOrder = isNaN(displayOrderNum) ? 0 : displayOrderNum;

  const trialDaysNum = parseInt(planData.trial_days, 10);
  const trialDays = isNaN(trialDaysNum) || trialDaysNum < 0 ? 0 : trialDaysNum;

  const cleanFeatures = Array.isArray(planData.features)
    ? planData.features.map((f) => (typeof f === 'string' ? f.trim() : '')).filter(Boolean)
    : [];

  const payload = {
    name: planData.name.trim(),
    plan_type: planData.plan_type || 'Monthly',
    price: priceNum,
    billing_period: planData.billing_period || 'Monthly',
    description: planData.description?.trim() || null,
    discount_text: planData.discount_text?.trim() || null,
    trial_days: trialDays,
    features: cleanFeatures,
    is_active: planData.is_active !== undefined ? Boolean(planData.is_active) : true,
    display_order: displayOrder,
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('membership_plans')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        const customErr = new Error("The 'membership_plans' table does not exist in Supabase yet. Please execute the migration SQL.");
        customErr.code = 'TABLE_NOT_FOUND';
        throw customErr;
      }
      throw error;
    }

    return data;
  } catch (err) {
    console.error('[MembershipPlansAdminService] updateMembershipPlan error:', err);
    throw err;
  }
};

/**
 * Toggle active/inactive status of a membership plan in Supabase
 */
export const toggleMembershipPlanStatus = async (id, isActive) => {
  if (!id) throw new Error('Plan ID is required.');
  if (!supabase) throw new Error('Supabase client is not initialized.');

  try {
    const { data, error } = await supabase
      .from('membership_plans')
      .update({
        is_active: Boolean(isActive),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        const customErr = new Error("The 'membership_plans' table does not exist in Supabase yet. Please execute the migration SQL.");
        customErr.code = 'TABLE_NOT_FOUND';
        throw customErr;
      }
      throw error;
    }

    return data;
  } catch (err) {
    console.error('[MembershipPlansAdminService] toggleMembershipPlanStatus error:', err);
    throw err;
  }
};

/**
 * Permanently delete a membership plan from Supabase
 */
export const deleteMembershipPlan = async (id) => {
  if (!id) throw new Error('Plan ID is required.');
  if (!supabase) throw new Error('Supabase client is not initialized.');

  try {
    const { error } = await supabase
      .from('membership_plans')
      .delete()
      .eq('id', id);

    if (error) {
      if (isTableMissingError(error)) {
        const customErr = new Error("The 'membership_plans' table does not exist in Supabase yet. Please execute the migration SQL.");
        customErr.code = 'TABLE_NOT_FOUND';
        throw customErr;
      }
      throw error;
    }

    return true;
  } catch (err) {
    console.error('[MembershipPlansAdminService] deleteMembershipPlan error:', err);
    throw err;
  }
};
