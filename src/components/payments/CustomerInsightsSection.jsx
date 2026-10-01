import React from 'react';
import { Users, UserCheck, Repeat, Award, Crown, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Badge from '../ui/Badge';

export const CustomerInsightsSection = ({ insights }) => {
  if (!insights) return null;

  const {
    totalPayingCustomers,
    repeatCustomers,
    firstTimeCustomers,
    repeatRate,
    highestValueCustomers = []
  } = insights;

  return (
    <div className="card payment-customer-insights-card">
      <div className="card-header" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--primary)" />
            <h3 className="card-title">Customer Payment Insights</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Customer lifetime value and repeat purchase dynamics
          </p>
        </div>
      </div>

      <div className="payment-insights-body">
        {/* KPI Mini-cards row */}
        <div className="payment-insights-mini-grid">
          <div className="payment-insight-mini-card">
            <span className="mini-card-label">Paying Customers</span>
            <span className="mini-card-value">{totalPayingCustomers}</span>
            <span className="mini-card-desc">With verified paid transactions</span>
          </div>

          <div className="payment-insight-mini-card">
            <span className="mini-card-label">Repeat Customers</span>
            <span className="mini-card-value" style={{ color: 'var(--accent-vip)' }}>
              {repeatCustomers}
            </span>
            <span className="mini-card-desc">&gt; 1 completed purchase</span>
          </div>

          <div className="payment-insight-mini-card">
            <span className="mini-card-label">First-Time Customers</span>
            <span className="mini-card-value">{firstTimeCustomers}</span>
            <span className="mini-card-desc">1 completed purchase</span>
          </div>

          <div className="payment-insight-mini-card">
            <span className="mini-card-label">Repeat Purchase Rate</span>
            <span className="mini-card-value" style={{ color: 'var(--success)' }}>
              {repeatRate}%
            </span>
            <span className="mini-card-desc">Ratio of repeat to paying users</span>
          </div>
        </div>

        {/* Highest-value customers table */}
        <div className="payment-top-customers-wrap">
          <div className="payment-top-customers-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={15} color="var(--warning)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Highest-Value Customers
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Top contributors by total payment volume
            </span>
          </div>

          {highestValueCustomers.length === 0 ? (
            <div className="payment-empty-subcard" style={{ padding: '1.25rem' }}>
              <span>No paying customer records found in this window.</span>
            </div>
          ) : (
            <div className="payment-top-customers-list">
              {highestValueCustomers.map((cust, idx) => (
                <div key={cust.userId} className="payment-top-customer-row">
                  <div className="customer-rank-badge">#{idx + 1}</div>

                  <div className="customer-meta-col">
                    <div className="customer-avatar-box">
                      {cust.avatarUrl ? (
                        <img src={cust.avatarUrl} alt={cust.name} />
                      ) : (
                        (cust.name || cust.email || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="customer-display-name">
                        <span>{cust.name}</span>
                        {cust.isVip && (
                          <Badge variant="vip" icon={Crown}>
                            VIP ACTIVE
                          </Badge>
                        )}
                      </div>
                      <div className="customer-email-text">{cust.email}</div>
                    </div>
                  </div>

                  <div className="customer-stats-col">
                    <div className="customer-total-spend">{formatCurrency(cust.totalSpent)}</div>
                    <div className="customer-orders-count">
                      {cust.purchasesCount} {cust.purchasesCount === 1 ? 'order' : 'orders'} • Last:{' '}
                      {formatDate(cust.lastPaymentDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerInsightsSection;
