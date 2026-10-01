import React from 'react';
import { PieChart, CheckCircle2, AlertCircle, Clock, RotateCcw, XCircle } from 'lucide-react';
import Badge from '../ui/Badge';

export const PaymentStatusChart = ({ distribution = [] }) => {
  const total = distribution.reduce((sum, item) => sum + item.count, 0);

  const getStatusIcon = (statusKey) => {
    switch (statusKey) {
      case 'successful':
        return CheckCircle2;
      case 'pending':
        return Clock;
      case 'failed':
        return AlertCircle;
      case 'refunded':
        return RotateCcw;
      case 'cancelled':
        return XCircle;
      default:
        return CheckCircle2;
    }
  };

  return (
    <div className="card payment-breakdown-card">
      <div className="card-header" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={18} color="var(--primary)" />
            <h3 className="card-title">Payment Status Distribution</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Authoritative breakdown of real payment outcomes
          </p>
        </div>
      </div>

      <div className="payment-status-body">
        {distribution.length === 0 ? (
          <div className="payment-empty-subcard">
            <span>No payment records found in this date window.</span>
          </div>
        ) : (
          <>
            {/* Visual stacked percentage bar */}
            <div className="payment-stacked-bar">
              {distribution.map((item) => (
                <div
                  key={item.statusKey}
                  className="payment-stacked-segment"
                  style={{
                    width: `${Math.max(item.percentage, 2)}%`,
                    backgroundColor: item.color
                  }}
                  title={`${item.label}: ${item.count} (${item.percentage}%)`}
                />
              ))}
            </div>

            {/* Status rows list */}
            <div className="payment-status-list">
              {distribution.map((item) => {
                const StatusIcon = getStatusIcon(item.statusKey);
                return (
                  <div key={item.statusKey} className="payment-status-row">
                    <div className="payment-status-name">
                      <span
                        className="status-color-dot"
                        style={{ backgroundColor: item.color }}
                      />
                      <StatusIcon size={14} color={item.color} />
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        {item.label}
                      </span>
                    </div>

                    <div className="payment-status-metrics">
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {item.count}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '45px', textAlign: 'right' }}>
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusChart;
