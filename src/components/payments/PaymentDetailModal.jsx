import React, { useState } from 'react';
import {
  CreditCard,
  User,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Layers
} from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PaymentDetailModal = ({ isOpen, onClose, payment }) => {
  const [copied, setCopied] = useState(false);

  if (!payment) return null;

  const handleCopyId = () => {
    if (!payment.payment_id) return;
    navigator.clipboard?.writeText(payment.payment_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid' || s === 'active' || s === 'successful') {
      return (
        <Badge variant="success" icon={CheckCircle2}>
          Payment Succeeded
        </Badge>
      );
    }
    if (s === 'pending') {
      return (
        <Badge variant="warning" icon={AlertCircle}>
          Processing / Pending
        </Badge>
      );
    }
    if (s === 'failed') {
      return (
        <Badge variant="danger" icon={AlertCircle}>
          Payment Failed
        </Badge>
      );
    }
    return <Badge variant="muted">{status || 'Recorded'}</Badge>;
  };

  const formattedDateTime = payment.created_at
    ? new Date(payment.created_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      })
    : '—';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Record Details"
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="payment-detail-container">
        {/* Top Header Card */}
        <div className="payment-detail-banner">
          <div>
            <span className="payment-detail-amount font-title-lg">
              {formatCurrency(payment.amount)}
            </span>
            <span className="payment-detail-currency">{payment.currency || 'USD'}</span>
          </div>
          <div>{getStatusBadge(payment.payment_status || payment.status)}</div>
        </div>

        {/* Transaction Reference & Copy */}
        <div className="payment-detail-ref-box">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span className="detail-meta-label">Payment / Transaction ID</span>
            <code className="detail-meta-code">{payment.payment_id || 'N/A'}</code>
          </div>
          <button
            type="button"
            className="btn-copy-id"
            onClick={handleCopyId}
            title="Copy Transaction ID to clipboard"
          >
            {copied ? (
              <>
                <Check size={14} color="var(--success)" />
                <span style={{ color: 'var(--success)' }}>Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy ID</span>
              </>
            )}
          </button>
        </div>

        {/* Customer Information Section */}
        <div className="detail-section-block">
          <div className="detail-section-header">
            <User size={15} color="var(--primary)" />
            <span>Customer Profile</span>
          </div>
          <div className="detail-grid-two">
            <div className="detail-item">
              <span className="detail-label">Name</span>
              <span className="detail-value">{payment.customer_name || 'Anonymous User'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{payment.customer_email || '—'}</span>
            </div>
          </div>
        </div>

        {/* Membership Plan Association */}
        <div className="detail-section-block">
          <div className="detail-section-header">
            <Layers size={15} color="var(--accent-vip)" />
            <span>Membership & Plan Details</span>
          </div>
          <div className="detail-grid-two">
            <div className="detail-item">
              <span className="detail-label">Membership Plan</span>
              <span className="detail-value" style={{ fontWeight: 600 }}>
                {payment.plan_name || 'VIP Sanctuary Pass'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Billing Period</span>
              <span className="detail-value">{payment.billing_period || payment.plan_type || 'Monthly'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Coverage Starts</span>
              <span className="detail-value">{formatDate(payment.start_date)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Coverage Ends / Renewal</span>
              <span className="detail-value">
                {payment.end_date ? formatDate(payment.end_date) : 'Continuous (Auto-renew)'}
              </span>
            </div>
          </div>
        </div>

        {/* Gateway & Payment Details */}
        <div className="detail-section-block">
          <div className="detail-section-header">
            <CreditCard size={15} color="var(--primary)" />
            <span>Payment & Gateway</span>
          </div>
          <div className="detail-grid-two">
            <div className="detail-item">
              <span className="detail-label">Payment Gateway</span>
              <span className="detail-value">
                {payment.gateway || 'Stripe'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Payment Date</span>
              <span className="detail-value">{formattedDateTime}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentDetailModal;
