import React, { useState } from 'react';
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Tag,
  Calendar,
  Layers,
  Check
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import Pagination from '../ui/Pagination';
import ActionMenu from '../ui/ActionMenu';
import usePagination from '../../hooks/usePagination';
import { formatDate, formatCurrency } from '../../utils/formatters';

const MIGRATION_SQL = `-- Run this in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'Monthly' CHECK (plan_type IN ('Monthly', 'Annual', 'Custom')),
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  billing_period TEXT NOT NULL DEFAULT 'Monthly' CHECK (billing_period IN ('Monthly', 'Yearly', 'Custom')),
  description TEXT,
  discount_text TEXT,
  trial_days INTEGER DEFAULT 0 CHECK (trial_days >= 0),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membership_plans_display_order
  ON public.membership_plans (display_order ASC, created_at DESC);

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view membership plans" ON public.membership_plans;
CREATE POLICY "Public can view membership plans"
  ON public.membership_plans FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can insert membership plans" ON public.membership_plans;
CREATE POLICY "Admins can insert membership plans"
  ON public.membership_plans FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Admins can update membership plans" ON public.membership_plans;
CREATE POLICY "Admins can update membership plans"
  ON public.membership_plans FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Admins can delete membership plans" ON public.membership_plans;
CREATE POLICY "Admins can delete membership plans"
  ON public.membership_plans FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.role() = 'service_role'
  );`;

export const MembershipPlansSection = ({
  plans = [],
  loading = false,
  tableMissing = false,
  onCreatePlan,
  onEditPlan,
  onToggleStatus,
  onDeletePlan
}) => {
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedPlans,
    goToPage
  } = usePagination(plans, 10, [plans]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(MIGRATION_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const toggleExpandFeatures = (id) => {
    setExpandedPlanId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      {/* Section Header */}
      <div
        className="card-header"
        style={{
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--accent-vip)" />
            <h3 className="card-title">Membership Plans</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Configure and manage subscription tiers, pricing, trial periods, and privileges stored in public.
          </p>
        </div>


      </div>

      {/* Database Setup Helper Banner (shown only if table is not yet in Supabase schema cache) */}
      {tableMissing && (
        <div
          style={{
            margin: '1rem',
            padding: '1.25rem',
            backgroundColor: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                Supabase Table Setup Required
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '0.75rem' }}>
                The <code>public.membership_plans</code> table is not yet present in your Supabase schema. Execute the migration script in your Supabase SQL Editor to enable dynamic database persistence.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={copiedSql ? Check : Copy}
                  onClick={handleCopySql}
                  style={{ backgroundColor: '#ffffff' }}
                >
                  {copiedSql ? 'SQL Copied!' : 'Copy Migration SQL'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSql(!showSql)}
                  style={{ fontSize: '0.8rem' }}
                >
                  {showSql ? 'Hide SQL Code' : 'View SQL Code'}
                </Button>
              </div>

              {showSql && (
                <div style={{ marginTop: '0.75rem' }}>
                  <pre
                    style={{
                      backgroundColor: 'var(--bg-sidebar)',
                      color: 'var(--text-on-sidebar)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.76rem',
                      overflowX: 'auto',
                      maxHeight: '220px'
                    }}
                  >
                    {MIGRATION_SQL}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Rendering: Loading / Empty / Data Table */}
      {loading ? (
        <Spinner size={36} text="Loading membership plans from database..." />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={Crown}
          title="No membership plans created yet."
          description="Create your first membership plan to define recurring pricing, billing cycles, trial days, and exclusive member features."
          actionLabel="Create Plans"
          onAction={onCreatePlan}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container recommendations-desktop-table" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Plan Name</th>
                  <th>Type</th>
                  <th>Price & Billing</th>
                  <th>Trial Period</th>
                  <th>Features</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlans.map((plan) => {
                  const features = Array.isArray(plan.features) ? plan.features : [];
                  const isExpanded = expandedPlanId === plan.id;

                  return (
                    <React.Fragment key={plan.id}>
                      <tr style={!plan.is_active ? { opacity: 0.75 } : {}}>
                        {/* Plan Name */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                {plan.name}
                              </span>
                              {plan.discount_text && (
                                <Badge variant="warning" icon={Tag}>
                                  {plan.discount_text}
                                </Badge>
                              )}
                            </div>
                            {plan.description && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  maxWidth: '260px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                title={plan.description}
                              >
                                {plan.description}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Plan Type */}
                        <td>
                          <Badge
                            variant={
                              plan.plan_type === 'Annual'
                                ? 'vip'
                                : plan.plan_type === 'Monthly'
                                  ? 'primary'
                                  : 'muted'
                            }
                          >
                            {plan.plan_type || 'Monthly'}
                          </Badge>
                        </td>

                        {/* Price & Billing */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                              {formatCurrency(plan.price)}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              / {plan.billing_period?.toLowerCase() || 'month'}
                            </span>
                          </div>
                        </td>

                        {/* Trial Days */}
                        <td>
                          {plan.trial_days && plan.trial_days > 0 ? (
                            <Badge variant="success">
                              {plan.trial_days}d Trial
                            </Badge>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</span>
                          )}
                        </td>

                        {/* Features Count & Toggle */}
                        <td>
                          {features.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => toggleExpandFeatures(plan.id)}
                              className="btn-ghost"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8rem',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-xs)',
                                border: '1px solid var(--border-subtle)',
                                background: isExpanded ? 'var(--bg-muted)' : 'transparent',
                                cursor: 'pointer',
                                color: 'var(--text-main)'
                              }}
                              title="Click to view benefits list"
                            >
                              <span>{features.length} benefits</span>
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          <button
                            type="button"
                            onClick={() => onToggleStatus(plan)}
                            className={`badge ${plan.is_active ? 'badge-success' : 'badge-muted'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                            title="Click to toggle status in database"
                          >
                            {plan.is_active ? (
                              <>
                                <CheckCircle2 size={12} />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={12} />
                                <span>Inactive</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Display Order */}
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '24px',
                              height: '24px',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: 'var(--bg-muted)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {plan.display_order ?? 0}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDate(plan.created_at)}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '0.25rem' }}>
                            <ActionMenu
                              items={[
                                {
                                  label: 'Edit Plan',
                                  icon: Edit2,
                                  onClick: () => onEditPlan(plan)
                                },
                                {
                                  label: 'Delete Plan',
                                  icon: Trash2,
                                  danger: true,
                                  onClick: () => onDeletePlan(plan)
                                }
                              ]}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Features Row */}
                      {isExpanded && features.length > 0 && (
                        <tr style={{ backgroundColor: 'var(--bg-muted)' }}>
                          <td colSpan={9} style={{ padding: '0.75rem 1.5rem' }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                              Included Benefits for {plan.name}:
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.5rem' }}>
                              {features.map((feat, fIdx) => (
                                <div
                                  key={fIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-main)',
                                    backgroundColor: 'var(--bg-card)',
                                    padding: '4px 8px',
                                    borderRadius: 'var(--radius-xs)',
                                    border: '1px solid var(--border-subtle)'
                                  }}
                                >
                                  <CheckCircle2 size={13} color="var(--accent-vip)" style={{ flexShrink: 0 }} />
                                  <span style={{ wordBreak: 'break-word' }}>{feat}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards for Plans */}
          <div className="recommendations-mobile-cards" style={{ padding: '0.5rem 0' }}>
            {paginatedPlans.map((plan) => {
              const features = Array.isArray(plan.features) ? plan.features : [];

              return (
                <div key={`m-plan-${plan.id}`} className="admin-mobile-card">
                  {/* Top: Name & Badges */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                        {plan.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '3px', flexWrap: 'wrap' }}>
                        <Badge
                          variant={
                            plan.plan_type === 'Annual'
                              ? 'vip'
                              : plan.plan_type === 'Monthly'
                                ? 'primary'
                                : 'muted'
                          }
                        >
                          {plan.plan_type || 'Monthly'}
                        </Badge>
                        {plan.discount_text && (
                          <Badge variant="warning" icon={Tag}>
                            {plan.discount_text}
                          </Badge>
                        )}
                        {plan.trial_days > 0 && (
                          <Badge variant="success">
                            {plan.trial_days}d Free
                          </Badge>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleStatus(plan)}
                      className={`badge ${plan.is_active ? 'badge-success' : 'badge-muted'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {formatCurrency(plan.price)}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      / {plan.billing_period?.toLowerCase() || 'month'}
                    </span>
                  </div>

                  {plan.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                      {plan.description}
                    </p>
                  )}

                  {/* Features */}
                  {features.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Features ({features.length}):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {features.slice(0, 3).map((f, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-main)' }}>
                            <CheckCircle2 size={12} color="var(--accent-vip)" />
                            <span>{f}</span>
                          </div>
                        ))}
                        {features.length > 3 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            +{features.length - 3} more privileges
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.5rem'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Order: #{plan.display_order ?? 0}
                    </span>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Edit2}
                        onClick={() => onEditPlan(plan)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => onDeletePlan(plan)}
                        style={{ color: 'var(--danger)' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={plans.length}
            pageSize={10}
            onPageChange={goToPage}
          />
        </>
      )}
    </div>
  );
};

export default MembershipPlansSection;
