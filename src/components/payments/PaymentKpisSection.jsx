import React from 'react';
import {
  DollarSign,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Crown,
  TrendingUp,
  TrendingDown,
  Percent,
  Minus
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const PaymentKpisSection = ({ kpis }) => {
  if (!kpis) return null;

  const {
    totalRevenue,
    totalPayments,
    successfulPayments,
    failedPayments,
    activeVipMembers,
    avgPaymentValue
  } = kpis;

  const renderComparison = (comparison, diffLabel) => {
    if (!comparison || !comparison.hasComparison) {
      return (
        <span className="kpi-compare-neutral" title="No previous period data available for comparison">
          <Minus size={12} />
          <span>vs previous period: —</span>
        </span>
      );
    }

    const { changePct, isPositive } = comparison;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const trendClass = isPositive ? 'kpi-compare-positive' : 'kpi-compare-negative';

    return (
      <span className={`kpi-compare-badge ${trendClass}`}>
        <TrendIcon size={12} />
        <span>
          {isPositive ? '+' : '-'}
          {changePct}% {diffLabel || 'vs previous period'}
        </span>
      </span>
    );
  };

  return (
    <div className="kpi-grid">
      {/* 1. Total Revenue */}
      <div className="kpi-card">
        <div className="kpi-card-content">
          <span className="kpi-title">Total Revenue</span>
          <span className="kpi-value" style={{ color: 'var(--primary)' }}>
            {formatCurrency(totalRevenue?.value ?? 0)}
          </span>
          <div className="kpi-compare-row">
            {renderComparison(totalRevenue?.comparison)}
          </div>
        </div>
        <div
          className="kpi-icon-box"
          style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}
        >
          <DollarSign size={22} />
        </div>
      </div>

      {/* 2. Total Payments */}
      <div className="kpi-card">
        <div className="kpi-card-content">
          <span className="kpi-title">Total Payments</span>
          <span className="kpi-value">{totalPayments?.value ?? 0}</span>
          <div className="kpi-compare-row">
            {totalPayments?.diffCount !== undefined && totalPayments.comparison?.hasComparison ? (
              <span
                className={`kpi-compare-badge ${
                  totalPayments.diffCount >= 0 ? 'kpi-compare-positive' : 'kpi-compare-negative'
                }`}
              >
                {totalPayments.diffCount >= 0 ? '+' : ''}
                {totalPayments.diffCount} vs prev ({totalPayments.comparison.changePct}%)
              </span>
            ) : (
              renderComparison(totalPayments?.comparison)
            )}
          </div>
        </div>
        <div
          className="kpi-icon-box"
          style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}
        >
          <CreditCard size={22} />
        </div>
      </div>

      {/* 3. Successful Payments */}
      <div className="kpi-card">
        <div className="kpi-card-content">
          <span className="kpi-title">Successful Payments</span>
          <span className="kpi-value" style={{ color: 'var(--success)' }}>
            {successfulPayments?.value ?? 0}
          </span>
          <div className="kpi-compare-row">
            {renderComparison(successfulPayments?.comparison)}
          </div>
        </div>
        <div
          className="kpi-icon-box"
          style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
        >
          <CheckCircle2 size={22} />
        </div>
      </div>

      {/* 4. Failed Payments */}
      <div className="kpi-card">
        <div className="kpi-card-content">
          <span className="kpi-title">Failed Payments</span>
          <span
            className="kpi-value"
            style={{ color: failedPayments?.value > 0 ? 'var(--danger)' : 'var(--text-main)' }}
          >
            {failedPayments?.value ?? 0}
          </span>
          <div className="kpi-compare-row">
            {failedPayments?.value > 0 ? (
              <span className="kpi-compare-badge kpi-compare-negative">
                <AlertCircle size={12} />
                <span>Requires attention</span>
              </span>
            ) : (
              <span className="kpi-compare-badge kpi-compare-positive">
                <CheckCircle2 size={12} />
                <span>0 failures</span>
              </span>
            )}
          </div>
        </div>
        <div
          className="kpi-icon-box"
          style={{
            backgroundColor: failedPayments?.value > 0 ? 'var(--danger-bg)' : 'var(--bg-muted)',
            color: failedPayments?.value > 0 ? 'var(--danger)' : 'var(--text-muted)'
          }}
        >
          <AlertCircle size={22} />
        </div>
      </div>

      {/* 5. Active VIP Members */}
      <div
        className="kpi-card"
        style={{
          backgroundColor: 'var(--accent-vip-bg)',
          borderColor: 'var(--accent-vip-border)'
        }}
      >
        <div className="kpi-card-content">
          <span className="kpi-title" style={{ color: 'var(--accent-vip)' }}>
            Active VIP Members
          </span>
          <span className="kpi-value" style={{ color: 'var(--accent-vip)' }}>
            {activeVipMembers?.value ?? 0}
          </span>
          <div className="kpi-compare-row">
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-vip)', opacity: 0.85 }}>
              profiles with is_vip = true
            </span>
          </div>
        </div>
        <div
          className="kpi-icon-box"
          style={{ backgroundColor: '#ffffff', color: 'var(--accent-vip)' }}
        >
          <Crown size={22} />
        </div>
      </div>

      {/* 6. Average Payment Value */}
      <div className="kpi-card">
        <div className="kpi-card-content">
          <span className="kpi-title">Average Payment Value</span>
          <span className="kpi-value">
            {formatCurrency(avgPaymentValue?.value ?? 0)}
          </span>
          <div className="kpi-compare-row">
            {renderComparison(avgPaymentValue?.comparison)}
          </div>
        </div>
        <div
          className="kpi-icon-box"
          style={{ backgroundColor: '#fef3c7', color: '#b45309' }}
        >
          <Percent size={22} />
        </div>
      </div>
    </div>
  );
};

export default PaymentKpisSection;
