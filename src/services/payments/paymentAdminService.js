import { supabase } from '../supabase/client.js';

/**
 * Service for fetching and calculating real-time Payment Analytics
 * from Dr. Cubie PostgreSQL database (public.memberships, public.membership_plans, public.profiles).
 */

/**
 * Helper to compute date range window timestamps
 */
export const getDateRangeBounds = (rangeKey, customStart = null, customEnd = null) => {
  const now = new Date();
  let start = new Date();
  let end = new Date(now.getTime());

  switch (rangeKey) {
    case 'today': {
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'last_7_days': {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'last_30_days': {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'last_3_months': {
      start.setMonth(now.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'last_12_months': {
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'all_time': {
      start = new Date('2020-01-01T00:00:00.000Z');
      break;
    }
    case 'custom': {
      if (customStart) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
      } else {
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
      break;
    }
    default: {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }
  }

  // Calculate prior period bounds for comparison
  const durationMs = end.getTime() - start.getTime();
  const priorEnd = new Date(start.getTime() - 1);
  const priorStart = new Date(priorEnd.getTime() - durationMs);

  return {
    start,
    end,
    priorStart,
    priorEnd,
    durationMs
  };
};

/**
 * Fetch raw payment & membership datasets authoritatively from Supabase
 */
export const fetchRawPaymentData = async () => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  try {
    // 1. Fetch memberships, membership plans, and profiles in parallel
    const [membershipsRes, plansRes, profilesRes] = await Promise.all([
      supabase
        .from('memberships')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('membership_plans')
        .select('*')
        .order('display_order', { ascending: true }),
      supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, is_vip, vip_plan_id, vip_status, vip_start_date, vip_end_date, vip_payment_reference, created_at')
    ]);

    const memberships = membershipsRes.data || [];
    const plans = plansRes.data || [];
    const profiles = profilesRes.data || [];

    // Map plans by ID for quick lookup
    const plansById = new Map();
    plans.forEach((p) => {
      plansById.set(p.id, p);
    });

    // Map profiles by ID for quick lookup
    const profilesById = new Map();
    profiles.forEach((u) => {
      profilesById.set(u.id, u);
    });

    // 2. Hydrate memberships with correlated customer and plan data
    const normalizedPayments = [];

    memberships.forEach((mem) => {
      const user = profilesById.get(mem.user_id) || {};
      const plan = plansById.get(mem.plan_id) || {};

      const price = mem.amount != null ? Number(mem.amount) : (Number(plan.price) || 0);
      const paymentRef = mem.payment_reference || mem.id;

      normalizedPayments.push({
        id: mem.id,
        payment_id: paymentRef,
        user_id: mem.user_id,
        customer_name: user.full_name || (user.email ? user.email.split('@')[0] : 'Member'),
        customer_email: user.email || 'No email provided',
        customer_avatar: user.avatar_url || null,
        plan_id: mem.plan_id,
        plan_name: plan.name || 'VIP Membership',
        plan_type: plan.plan_type || 'Monthly',
        billing_period: plan.billing_period || 'Monthly',
        amount: price,
        currency: mem.currency || 'USD',
        status: mem.status || 'active',
        payment_status: mem.payment_status || 'paid',
        is_vip: Boolean(user.is_vip),
        start_date: mem.start_date || mem.created_at,
        end_date: mem.end_date || null,
        created_at: mem.created_at || new Date().toISOString(),
        updated_at: mem.updated_at || mem.created_at,
        raw_source: 'memberships'
      });
    });

    // Sort by created_at descending
    normalizedPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Active VIP count directly from profiles (authoritative entitlement count)
    const activeVipCount = profiles.filter((p) => p.is_vip === true).length;

    return {
      payments: normalizedPayments,
      plans,
      profiles,
      activeVipCount
    };
  } catch (err) {
    console.error('[PaymentAdminService] Error fetching payment data:', err);
    throw err;
  }
};

/**
 * Filter payments by date bounds
 */
export const filterPaymentsByDate = (payments, startDate, endDate) => {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  return payments.filter((p) => {
    const itemDate = new Date(p.created_at).getTime();
    return itemDate >= startMs && itemDate <= endMs;
  });
};

/**
 * Calculate KPI comparison percentage
 */
const calculatePctChange = (current, previous) => {
  if (!previous || previous === 0) {
    return { changePct: 0, isPositive: true, hasComparison: false, rawPct: 0 };
  }
  const pct = Math.round(((current - previous) / previous) * 100 * 10) / 10;
  return {
    changePct: Math.abs(pct),
    isPositive: pct >= 0,
    hasComparison: true,
    rawPct: pct
  };
};

/**
 * Calculate dynamic KPIs for given period and prior comparison period
 */
export const calculatePaymentKpis = (currentPayments, priorPayments, activeVipMembers) => {
  // Current period metrics
  const totalPayments = currentPayments.length;
  const successfulPayments = currentPayments.filter(
    (p) => p.payment_status === 'paid' || p.status === 'active'
  ).length;
  const failedPayments = currentPayments.filter(
    (p) => p.payment_status === 'failed' || p.status === 'failed'
  ).length;
  const totalRevenue = currentPayments
    .filter((p) => p.payment_status === 'paid' || p.status === 'active')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const avgPaymentValue =
    successfulPayments > 0 ? Math.round((totalRevenue / successfulPayments) * 100) / 100 : 0;

  // Prior period metrics for comparison
  const priorTotalPayments = priorPayments.length;
  const priorSuccessfulPayments = priorPayments.filter(
    (p) => p.payment_status === 'paid' || p.status === 'active'
  ).length;
  const priorFailedPayments = priorPayments.filter(
    (p) => p.payment_status === 'failed' || p.status === 'failed'
  ).length;
  const priorTotalRevenue = priorPayments
    .filter((p) => p.payment_status === 'paid' || p.status === 'active')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const priorAvgPaymentValue =
    priorSuccessfulPayments > 0
      ? Math.round((priorTotalRevenue / priorSuccessfulPayments) * 100) / 100
      : 0;

  return {
    totalRevenue: {
      value: totalRevenue,
      comparison: calculatePctChange(totalRevenue, priorTotalRevenue),
      diffAmount: totalRevenue - priorTotalRevenue
    },
    totalPayments: {
      value: totalPayments,
      diffCount: totalPayments - priorTotalPayments,
      comparison: calculatePctChange(totalPayments, priorTotalPayments)
    },
    successfulPayments: {
      value: successfulPayments,
      diffCount: successfulPayments - priorSuccessfulPayments,
      comparison: calculatePctChange(successfulPayments, priorSuccessfulPayments)
    },
    failedPayments: {
      value: failedPayments,
      diffCount: failedPayments - priorFailedPayments,
      comparison: calculatePctChange(failedPayments, priorFailedPayments)
    },
    activeVipMembers: {
      value: activeVipMembers,
      subtitle: 'Verified accounts with is_vip = true'
    },
    avgPaymentValue: {
      value: avgPaymentValue,
      comparison: calculatePctChange(avgPaymentValue, priorAvgPaymentValue)
    }
  };
};

/**
 * Generate accurate time-series buckets for the Revenue Trend chart
 */
export const calculateRevenueTrend = (payments, startDate, endDate, rangeKey) => {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const diffDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));

  // Determine appropriate granularity
  let granularity = 'daily';
  if (rangeKey === 'today' || diffDays <= 1) {
    granularity = 'hourly';
  } else if (diffDays > 90) {
    granularity = 'monthly';
  } else if (diffDays > 31) {
    granularity = 'weekly';
  }

  const buckets = [];
  const successfulPayments = payments.filter(
    (p) => p.payment_status === 'paid' || p.status === 'active'
  );

  if (granularity === 'hourly') {
    // 24 hours of the day (or 6 four-hour intervals)
    for (let h = 0; h < 24; h += 2) {
      const bucketStart = new Date(startDate);
      bucketStart.setHours(h, 0, 0, 0);
      const bucketEnd = new Date(startDate);
      bucketEnd.setHours(h + 2, 0, 0, 0);

      const inBucket = successfulPayments.filter((p) => {
        const t = new Date(p.created_at).getTime();
        return t >= bucketStart.getTime() && t < bucketEnd.getTime();
      });

      const revenue = inBucket.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const label = `${h.toString().padStart(2, '0')}:00`;

      buckets.push({
        label,
        fullDate: bucketStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric'
        }),
        revenue,
        count: inBucket.length
      });
    }
  } else if (granularity === 'daily') {
    const cur = new Date(startDate);
    cur.setHours(0, 0, 0, 0);

    while (cur.getTime() <= endMs) {
      const dayStart = new Date(cur);
      const dayEnd = new Date(cur);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const inBucket = successfulPayments.filter((p) => {
        const t = new Date(p.created_at).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      });

      const revenue = inBucket.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const label = cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      buckets.push({
        label,
        fullDate: cur.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }),
        revenue,
        count: inBucket.length
      });

      cur.setDate(cur.getDate() + 1);
    }
  } else if (granularity === 'weekly') {
    const cur = new Date(startDate);
    cur.setHours(0, 0, 0, 0);

    let weekNum = 1;
    while (cur.getTime() <= endMs) {
      const weekStart = new Date(cur);
      const weekEnd = new Date(cur);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const inBucket = successfulPayments.filter((p) => {
        const t = new Date(p.created_at).getTime();
        return t >= weekStart.getTime() && t < weekEnd.getTime();
      });

      const revenue = inBucket.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const label = `W${weekNum} (${cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

      buckets.push({
        label,
        fullDate: `${cur.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        revenue,
        count: inBucket.length
      });

      cur.setDate(cur.getDate() + 7);
      weekNum++;
    }
  } else {
    // Monthly granularity
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (cur.getTime() <= endMs) {
      const monthStart = new Date(cur);
      const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);

      const inBucket = successfulPayments.filter((p) => {
        const t = new Date(p.created_at).getTime();
        return t >= monthStart.getTime() && t < monthEnd.getTime();
      });

      const revenue = inBucket.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const label = cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      buckets.push({
        label,
        fullDate: cur.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        revenue,
        count: inBucket.length
      });

      cur.setMonth(cur.getMonth() + 1);
    }
  }

  return {
    granularity,
    buckets
  };
};

/**
 * Calculate payment status breakdown
 */
export const calculatePaymentStatusDistribution = (payments) => {
  const statusCounts = {};

  payments.forEach((p) => {
    let s = (p.payment_status || p.status || 'unknown').toLowerCase();
    if (s === 'active') s = 'successful';
    if (s === 'paid') s = 'successful';

    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  const total = payments.length || 1;
  const statusLabels = {
    successful: { label: 'Successful', color: 'var(--success)', variant: 'success' },
    pending: { label: 'Pending', color: 'var(--warning)', variant: 'warning' },
    failed: { label: 'Failed', color: 'var(--danger)', variant: 'danger' },
    refunded: { label: 'Refunded', color: 'var(--accent-vip)', variant: 'vip' },
    cancelled: { label: 'Cancelled', color: 'var(--text-muted)', variant: 'muted' },
    inactive: { label: 'Inactive', color: 'var(--text-faint)', variant: 'muted' },
    revoked: { label: 'Revoked', color: 'var(--danger)', variant: 'danger' }
  };

  const distribution = Object.entries(statusCounts).map(([statusKey, count]) => {
    const meta = statusLabels[statusKey] || {
      label: statusKey.charAt(0).toUpperCase() + statusKey.slice(1),
      color: 'var(--primary)',
      variant: 'primary'
    };
    return {
      statusKey,
      label: meta.label,
      count,
      percentage: Math.round((count / total) * 100 * 10) / 10,
      color: meta.color,
      variant: meta.variant
    };
  });

  // Sort by count descending
  distribution.sort((a, b) => b.count - a.count);

  return distribution;
};

/**
 * Calculate revenue and purchase breakdown by membership plan
 */
export const calculateRevenueByPlan = (payments, plans) => {
  const planStats = new Map();

  // Initialize with all configured plans in DB so none are missed
  plans.forEach((plan) => {
    planStats.set(plan.name, {
      planId: plan.id,
      planName: plan.name,
      planType: plan.plan_type,
      billingPeriod: plan.billing_period,
      price: Number(plan.price) || 0,
      revenue: 0,
      purchases: 0
    });
  });

  // Aggregate payments
  payments.forEach((p) => {
    const name = p.plan_name || 'Other';
    if (!planStats.has(name)) {
      planStats.set(name, {
        planId: p.plan_id,
        planName: name,
        planType: p.plan_type || 'Custom',
        billingPeriod: p.billing_period || 'Monthly',
        price: Number(p.amount) || 0,
        revenue: 0,
        purchases: 0
      });
    }

    const stat = planStats.get(name);
    stat.purchases += 1;
    if (p.payment_status === 'paid' || p.status === 'active') {
      stat.revenue += Number(p.amount) || 0;
    }
  });

  const totalRevenue = Array.from(planStats.values()).reduce((s, p) => s + p.revenue, 0);

  const result = Array.from(planStats.values()).map((p) => ({
    ...p,
    revenueShare:
      totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100 * 10) / 10 : 0
  }));

  // Sort by revenue descending
  result.sort((a, b) => b.revenue - a.revenue);

  return result;
};

/**
 * Calculate customer payment insights (total paying, repeat, first-time, top customers)
 */
export const calculateCustomerInsights = (payments, profiles) => {
  const customerMap = new Map();

  payments.forEach((p) => {
    const isPaid = p.payment_status === 'paid' || p.status === 'active';
    const uid = p.user_id;

    if (!customerMap.has(uid)) {
      customerMap.set(uid, {
        userId: uid,
        name: p.customer_name,
        email: p.customer_email,
        avatarUrl: p.customer_avatar,
        isVip: p.is_vip,
        totalSpent: 0,
        purchasesCount: 0,
        lastPaymentDate: p.created_at
      });
    }

    const cust = customerMap.get(uid);
    cust.purchasesCount += 1;
    if (isPaid) {
      cust.totalSpent += Number(p.amount) || 0;
    }
    if (new Date(p.created_at) > new Date(cust.lastPaymentDate)) {
      cust.lastPaymentDate = p.created_at;
    }
  });

  const allPaying = Array.from(customerMap.values()).filter((c) => c.totalSpent > 0);
  const totalPayingCustomers = allPaying.length;
  const repeatCustomers = allPaying.filter((c) => c.purchasesCount > 1).length;
  const firstTimeCustomers = allPaying.filter((c) => c.purchasesCount === 1).length;
  const repeatRate =
    totalPayingCustomers > 0
      ? Math.round((repeatCustomers / totalPayingCustomers) * 100 * 10) / 10
      : 0;

  // Highest-value customers (top 5)
  const highestValueCustomers = [...allPaying]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  return {
    totalPayingCustomers,
    repeatCustomers,
    firstTimeCustomers,
    repeatRate,
    highestValueCustomers
  };
};

/**
 * Master method: Fetch all payment data and compute full analytics payload
 */
export const fetchPaymentAnalytics = async ({
  rangeKey = 'last_30_days',
  customStart = null,
  customEnd = null
} = {}) => {
  // 1. Fetch raw datasets from Supabase
  const { payments, plans, profiles, activeVipCount } = await fetchRawPaymentData();

  // 2. Get date bounds for active range & prior comparison range
  const bounds = getDateRangeBounds(rangeKey, customStart, customEnd);

  // 3. Filter payments for current and prior window
  const currentPayments = filterPaymentsByDate(payments, bounds.start, bounds.end);
  const priorPayments = filterPaymentsByDate(payments, bounds.priorStart, bounds.priorEnd);

  // 4. Compute KPIs
  const kpis = calculatePaymentKpis(currentPayments, priorPayments, activeVipCount);

  // 5. Compute Revenue Trend
  const trend = calculateRevenueTrend(currentPayments, bounds.start, bounds.end, rangeKey);

  // 6. Compute Payment Status distribution
  const statusDistribution = calculatePaymentStatusDistribution(currentPayments);

  // 7. Compute Revenue by Membership Plan
  const planRevenue = calculateRevenueByPlan(currentPayments, plans);

  // 8. Compute Customer Payment Insights
  const customerInsights = calculateCustomerInsights(currentPayments, profiles);

  return {
    kpis,
    trend,
    statusDistribution,
    planRevenue,
    customerInsights,
    payments: currentPayments,
    allPayments: payments,
    plans,
    bounds,
    rangeKey
  };
};

/**
 * Setup Supabase Realtime subscription to re-fetch when new payments or profile updates occur
 */
export const subscribeToPaymentUpdates = (onUpdate) => {
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('realtime_payment_analytics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memberships' },
        () => {
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[PaymentAdminService] Realtime subscription not available:', err);
    return () => {};
  }
};
