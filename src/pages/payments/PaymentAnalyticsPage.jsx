import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CreditCard, ShieldCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import DateRangeFilter from '../../components/payments/DateRangeFilter';
import PaymentKpisSection from '../../components/payments/PaymentKpisSection';
import RevenueOverviewChart from '../../components/payments/RevenueOverviewChart';
import PaymentStatusChart from '../../components/payments/PaymentStatusChart';
import PlanRevenueChart from '../../components/payments/PlanRevenueChart';
import CustomerInsightsSection from '../../components/payments/CustomerInsightsSection';
import RecentPaymentsTable from '../../components/payments/RecentPaymentsTable';
import PaymentDetailModal from '../../components/payments/PaymentDetailModal';
import {
  fetchPaymentAnalytics,
  subscribeToPaymentUpdates
} from '../../services/payments/paymentAdminService';
import { useToast } from '../../context/ToastContext';

export const PaymentAnalyticsPage = () => {
  // Date range filter state
  const [rangeKey, setRangeKey] = useState('last_30_days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Analytics data state
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const { showToast } = useToast();

  const loadData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setRefreshing(true);
      } else if (!analytics) {
        setLoading(true);
      }

      try {
        const data = await fetchPaymentAnalytics({
          rangeKey,
          customStart,
          customEnd
        });
        setAnalytics(data);

        if (isManualRefresh) {
          showToast('success', 'Payment analytics synchronized.');
        }
      } catch (err) {
        console.error('[PaymentAnalyticsPage] Error loading payment analytics:', err);
        showToast('error', 'Failed to synchronize payment analytics.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [rangeKey, customStart, customEnd, showToast, analytics]
  );

  // Initial load and on date range change
  useEffect(() => {
    loadData();
  }, [rangeKey, customStart, customEnd]);

  // Realtime updates subscription
  useEffect(() => {
    const unsubscribe = subscribeToPaymentUpdates(() => {
      loadData(false);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadData]);

  if (loading && !analytics) {
    return <Spinner size={36} text="Loading live payment analytics..." />;
  }

  const kpis = analytics?.kpis;
  const trend = analytics?.trend;
  const statusDistribution = analytics?.statusDistribution || [];
  const planRevenue = analytics?.planRevenue || [];
  const customerInsights = analytics?.customerInsights;
  const payments = analytics?.payments || [];
  const plans = analytics?.plans || [];

  return (
    <div className="animate-fade-in">
      {/* 1. Header & Actions */}
      <div
        className="page-header-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={22} color="var(--primary)" />
            <h2 className="page-header-title" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Payment Analytics
            </h2>
          </div>
          <p className="page-header-subtitle" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Real-time Stripe transaction logs, revenue volume, customer lifetime metrics, and membership breakdown
          </p>
        </div>

        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadData(true)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Date Range Filter Toolbar */}
      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem' }}>
        <DateRangeFilter
          selectedRange={rangeKey}
          onRangeChange={(newKey) => setRangeKey(newKey)}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={(val) => setCustomStart(val)}
          onCustomEndChange={(val) => setCustomEnd(val)}
          disabled={refreshing}
        />
      </div>

      {/* 3. Top Dynamic KPI Cards */}
      <PaymentKpisSection kpis={kpis} />

      {/* 4. Large Revenue Overview Trend Chart */}
      <div style={{ marginBottom: '1.75rem' }}>
        <RevenueOverviewChart trend={trend} />
      </div>

      {/* 5. Middle Grid: Payment Status + Revenue by Plan */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem'
        }}
      >
        <PaymentStatusChart distribution={statusDistribution} />
        <PlanRevenueChart planRevenue={planRevenue} />
      </div>

      {/* 6. Customer Payment Analytics */}
      <div style={{ marginBottom: '1.75rem' }}>
        <CustomerInsightsSection insights={customerInsights} />
      </div>

      {/* 7. Recent Payments Table */}
      <div style={{ marginBottom: '2.5rem' }}>
        <RecentPaymentsTable
          payments={payments}
          plans={plans}
          onSelectPayment={(p) => setSelectedPayment(p)}
        />
      </div>

      {/* 8. Payment Detail Modal */}
      {selectedPayment && (
        <PaymentDetailModal
          isOpen={Boolean(selectedPayment)}
          onClose={() => setSelectedPayment(null)}
          payment={selectedPayment}
        />
      )}
    </div>
  );
};

export default PaymentAnalyticsPage;
