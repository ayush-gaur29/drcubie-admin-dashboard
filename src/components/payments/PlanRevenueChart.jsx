import React from 'react';
import { Layers, Crown, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const PlanRevenueChart = ({ planRevenue = [] }) => {
  const totalRevenue = planRevenue.reduce((s, p) => s + p.revenue, 0);

  return (
    <div className="card payment-breakdown-card">
      <div className="card-header" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--accent-vip)" />
            <h3 className="card-title">Revenue by Membership Plan</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Real plan revenue & volume dynamically queried from Supabase
          </p>
        </div>
      </div>

      <div className="payment-plan-body">
        {planRevenue.length === 0 || planRevenue.every((p) => p.purchases === 0) ? (
          <div className="payment-empty-subcard">
            <span>No plan purchases recorded in this period.</span>
          </div>
        ) : (
          <div className="payment-plan-list">
            {planRevenue
              .filter((plan) => plan.purchases > 0)
              .map((plan) => {
                const barWidth = totalRevenue > 0 ? (plan.revenue / totalRevenue) * 100 : 0;

                return (
                  <div key={plan.planName} className="payment-plan-item">
                    <div className="payment-plan-item-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Crown size={14} color="var(--accent-vip)" />
                        <span className="payment-plan-name">{plan.planName}</span>
                        <span className="payment-plan-badge">{plan.billingPeriod || plan.planType}</span>
                      </div>

                      <div className="payment-plan-values">
                        <span className="payment-plan-rev">{formatCurrency(plan.revenue)}</span>
                        <span className="payment-plan-count">
                          {plan.purchases} {plan.purchases === 1 ? 'purchase' : 'purchases'}
                        </span>
                      </div>
                    </div>

                    {/* Relative contribution bar */}
                    <div className="payment-plan-progress-track">
                      <div
                        className="payment-plan-progress-fill"
                        style={{
                          width: `${Math.max(barWidth, plan.revenue > 0 ? 3 : 0)}%`
                        }}
                      />
                    </div>

                    <div className="payment-plan-item-bottom">
                      <span>Configured Price: {formatCurrency(plan.price)}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {plan.revenueShare}% of revenue
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanRevenueChart;
