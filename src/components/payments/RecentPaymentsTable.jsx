import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  CreditCard,
  Crown
} from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const RecentPaymentsTable = ({
  payments = [],
  plans = [],
  onSelectPayment
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Sorting state
  const [sortField, setSortField] = useState('created_at'); // 'created_at' | 'amount' | 'customer_name' | 'payment_status'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Copied ID state
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'paid', label: 'Successful / Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  // Dynamic plan options
  const planOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'All Plans' }];
    plans.forEach((p) => {
      opts.push({ value: p.name, label: p.name });
    });
    return opts;
  }, [plans]);

  // Filtering & Sorting
  const filteredPayments = useMemo(() => {
    let result = [...payments];

    // 1. Text Search (customer name, email, payment ID)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.customer_name?.toLowerCase().includes(q) ||
          p.customer_email?.toLowerCase().includes(q) ||
          p.payment_id?.toLowerCase().includes(q)
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((p) => {
        const s = (p.payment_status || p.status || '').toLowerCase();
        if (statusFilter === 'paid') return s === 'paid' || s === 'active' || s === 'successful';
        if (statusFilter === 'pending') return s === 'pending';
        if (statusFilter === 'failed') return s === 'failed';
        if (statusFilter === 'refunded') return s === 'refunded';
        return s === statusFilter;
      });
    }

    // 3. Plan Filter
    if (planFilter !== 'all') {
      result = result.filter((p) => p.plan_name === planFilter);
    }

    // 4. Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'created_at') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else if (sortField === 'amount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [payments, searchQuery, statusFilter, planFilter, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Reset page when filter changes
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handlePlanFilterChange = (val) => {
    setPlanFilter(val);
    setCurrentPage(1);
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} style={{ opacity: 0.35, marginLeft: '4px' }} />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={12} style={{ color: 'var(--primary)', marginLeft: '4px' }} />
    ) : (
      <ArrowDown size={12} style={{ color: 'var(--primary)', marginLeft: '4px' }} />
    );
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid' || s === 'active' || s === 'successful') {
      return (
        <Badge variant="success" icon={CheckCircle2}>
          Paid
        </Badge>
      );
    }
    if (s === 'pending') {
      return (
        <Badge variant="warning" icon={Clock}>
          Pending
        </Badge>
      );
    }
    if (s === 'failed') {
      return (
        <Badge variant="danger" icon={AlertCircle}>
          Failed
        </Badge>
      );
    }
    if (s === 'refunded') {
      return (
        <Badge variant="vip" icon={RotateCcw}>
          Refunded
        </Badge>
      );
    }
    return <Badge variant="muted">{status || 'Recorded'}</Badge>;
  };

  return (
    <div className="card payment-table-card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} color="var(--primary)" />
            <h3 className="card-title">Recent Payments</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Authoritative transactional logs from Stripe payments and Supabase memberships
          </p>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredPayments.length}</strong> {filteredPayments.length === 1 ? 'record' : 'records'}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ padding: '1rem 1.25rem 0' }}>
        <div className="toolbar-bar" style={{ marginBottom: '1rem' }}>
          <div className="toolbar-search">
            <Search size={16} className="toolbar-search-icon" />
            <input
              type="text"
              className="form-input toolbar-search-input"
              placeholder="Search by customer name, email, or Payment ID..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <div className="toolbar-actions">
            <Select
              name="statusFilter"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              options={statusOptions}
              style={{ marginBottom: 0, minWidth: '150px' }}
            />

            <Select
              name="planFilter"
              value={planFilter}
              onChange={(e) => handlePlanFilterChange(e.target.value)}
              options={planOptions}
              style={{ marginBottom: 0, minWidth: '160px' }}
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      {filteredPayments.length === 0 ? (
        <div style={{ padding: '2.5rem 1rem' }}>
          <EmptyState
            icon={CreditCard}
            title={payments.length === 0 ? 'No payments found' : 'No payments match filter'}
            description={
              payments.length === 0
                ? 'No transactions have been recorded in this selected period yet. New Stripe checkouts will appear automatically.'
                : 'Try adjusting your search criteria or resetting filters to see results.'
            }
            actionLabel={payments.length > 0 ? 'Clear Filters' : null}
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setPlanFilter('all');
            }}
          />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container payments-desktop-table" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('customer_name')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Customer {renderSortIndicator('customer_name')}
                    </div>
                  </th>
                  <th>Email</th>
                  <th>Membership / Plan</th>
                  <th onClick={() => toggleSort('amount')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Amount {renderSortIndicator('amount')}
                    </div>
                  </th>
                  <th>Currency</th>
                  <th onClick={() => toggleSort('payment_status')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Status {renderSortIndicator('payment_status')}
                    </div>
                  </th>
                  <th onClick={() => toggleSort('created_at')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Payment Date {renderSortIndicator('created_at')}
                    </div>
                  </th>
                  <th>Payment ID</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((p) => {
                  const isCopied = copiedId === p.payment_id;
                  const truncatedId = p.payment_id
                    ? p.payment_id.length > 18
                      ? `${p.payment_id.slice(0, 10)}...${p.payment_id.slice(-6)}`
                      : p.payment_id
                    : '—';

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectPayment(p)}
                      style={{ cursor: 'pointer' }}
                      className="payment-row-clickable"
                    >
                      {/* Customer */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div className="user-avatar-circle" style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}>
                            {p.customer_avatar ? (
                              <img src={p.customer_avatar} alt={p.customer_name} />
                            ) : (
                              (p.customer_name || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                              {p.customer_name}
                            </div>
                            {p.is_vip && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--accent-vip)', fontWeight: 600 }}>
                                VIP Member
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td>
                        <code style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {p.customer_email}
                        </code>
                      </td>

                      {/* Plan */}
                      <td>
                        <Badge variant="primary" icon={Crown}>
                          {p.plan_name}
                        </Badge>
                      </td>

                      {/* Amount */}
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {formatCurrency(p.amount)}
                        </span>
                      </td>

                      {/* Currency */}
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {p.currency || 'USD'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>{getStatusBadge(p.payment_status || p.status)}</td>

                      {/* Date */}
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(p.created_at)}
                      </td>

                      {/* Payment ID with copy */}
                      <td>
                        <div
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          onClick={(e) => handleCopy(p.payment_id, e)}
                          title="Click to copy full ID"
                        >
                          <code className="detail-meta-code-table">{truncatedId}</code>
                          <button
                            type="button"
                            className="btn-ghost-icon-sm"
                            aria-label="Copy ID"
                          >
                            {isCopied ? (
                              <Check size={12} color="var(--success)" />
                            ) : (
                              <Copy size={12} color="var(--text-faint)" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPayment(p);
                          }}
                          title="View Payment Details"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List for screens < 768px */}
          <div className="payments-mobile-cards">
            {paginatedPayments.map((p) => (
              <div
                key={`mobile-${p.id}`}
                className="payment-mobile-card"
                onClick={() => onSelectPayment(p)}
              >
                <div className="payment-mobile-card-header">
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      {p.customer_name}
                    </span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {p.customer_email}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
                      {formatCurrency(p.amount)}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.currency}</span>
                  </div>
                </div>

                <div className="payment-mobile-card-row">
                  <Badge variant="primary" icon={Crown}>
                    {p.plan_name}
                  </Badge>
                  {getStatusBadge(p.payment_status || p.status)}
                </div>

                <div className="payment-mobile-card-footer">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                    {formatDate(p.created_at)}
                  </span>
                  <code style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {p.payment_id?.slice(0, 14)}...
                  </code>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="payment-table-pagination">
            <div className="pagination-info">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredPayments.length)} of{' '}
              {filteredPayments.length} entries
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="btn-page"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <span className="pagination-page-indicator">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                className="btn-page"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RecentPaymentsTable;
