import React from 'react';
import { User, Mail, Shield, Crown, Calendar, Clock, KeyRound } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/formatters';

export const UserProfileModal = ({
  isOpen,
  onClose,
  user,
  onToggleVip,
  toggleLoading = false
}) => {
  if (!user) return null;

  const displayName = user.full_name || 'Anonymous User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Member Profile Details"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant={user.is_vip ? 'secondary' : 'primary'}
            icon={Crown}
            loading={toggleLoading}
            onClick={() => onToggleVip(user)}
          >
            {user.is_vip ? 'Revoke VIP Pass' : 'Grant VIP Pass'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* User Card Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            className="user-avatar-circle"
            style={{ width: '56px', height: '56px', fontSize: '1.35rem' }}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={displayName} />
            ) : (
              initial
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
              {displayName}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              <Mail size={14} color="var(--text-muted)" />
              <span>{user.email || 'No email associated with profile'}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '6px' }}>
              {user.role === 'admin' ? (
                <Badge variant="primary" icon={Shield}>
                  Administrator
                </Badge>
              ) : (
                <Badge variant="muted">Member</Badge>
              )}
              {user.is_vip ? (
                <Badge variant="vip" icon={Crown}>
                  VIP Pass Active
                </Badge>
              ) : (
                <Badge variant="muted">Standard Tier</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={14} /> Profile ID (UUID):
            </span>
            <code style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>{user.id}</code>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Account Created:
            </span>
            <span>{formatDate(user.created_at)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> Last Profile Update:
            </span>
            <span>{formatDate(user.updated_at || user.created_at)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
            <span style={{ color: 'var(--text-muted)' }}>Status:</span>
            <Badge variant="success">Active Account</Badge>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Note: User authentication and passwords are securely managed by Supabase Auth and never accessible by administrator clients.
        </div>
      </div>
    </Modal>
  );
};

export default UserProfileModal;
