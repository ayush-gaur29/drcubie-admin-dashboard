import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Crown,
  Shield,
  Eye,
  Mail,
  CheckCircle2
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import usePagination from '../../hooks/usePagination';
import UserProfileModal from '../../components/users/UserProfileModal';
import {
  fetchAdminUsers,
  toggleUserVip
} from '../../services/users/usersAdminService';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin Only' },
  { value: 'user', label: 'User' }
];

const VIP_OPTIONS = [
  { value: '', label: 'All Tiers' },
  { value: 'true', label: 'VIP Members' },
  { value: 'false', label: 'Standard Users' }
];

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isVip, setIsVip] = useState('');

  // Profile modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const { showToast } = useToast();

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    totalItems,
    paginatedItems: paginatedUsers
  } = usePagination(users, 10, [search, role, isVip]);

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchAdminUsers({
        search,
        role,
        isVip,
        limit: 500
      });
      setUsers(data || []);
      if (isRefresh) {
        showToast('success', 'User directory refreshed.');
      }
    } catch (err) {
      console.error('[UsersPage] Error loading users:', err);
      showToast('error', 'Failed to load user directory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, role, isVip, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const handleToggleVip = async (u) => {
    setToggleLoading(true);
    try {
      const newVip = !u.is_vip;
      await toggleUserVip(u.id, newVip);
      showToast(
        'success',
        `VIP status for "${u.full_name || u.email}" ${newVip ? 'granted' : 'revoked'}.`
      );
      if (selectedUser && selectedUser.id === u.id) {
        setSelectedUser((prev) => ({ ...prev, is_vip: newVip }));
      }
      loadUsers();
    } catch (err) {
      console.error('Toggle VIP error:', err);
      showToast('error', 'Failed to update VIP status.');
    } finally {
      setToggleLoading(false);
    }
  };

  const handleViewProfile = (u) => {
    setSelectedUser(u);
    setProfileModalOpen(true);
  };

  return (
    <div>
      {/* Top Action Header */}
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
          <h2 className="page-header-title" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
            User Management
          </h2>
          <p className="page-header-subtitle" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Manage registered member profiles, administrator roles, and VIP pass entitlements
          </p>
        </div>

        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadUsers(true)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="toolbar-bar">
        <div className="toolbar-search">
          <Search size={16} className="toolbar-search-icon" />
          <input
            type="text"
            className="form-input toolbar-search-input"
            placeholder="Search by full name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          <Select
            options={ROLE_OPTIONS}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '150px', marginBottom: 0 }}
          />

          <Select
            options={VIP_OPTIONS}
            value={isVip}
            onChange={(e) => setIsVip(e.target.value)}
            style={{ width: '150px', marginBottom: 0 }}
          />
        </div>
      </div>

      {/* Main Content Table or Empty State */}
      {loading && !refreshing ? (
        <Spinner size={36} text="Loading Registered Users..." />
      ) : users.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No users match your criteria"
            description="Adjust your search or filters to locate specific member accounts."
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container users-desktop-table" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Avatar</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>VIP Status</th>
                  <th>Joined Date</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => {
                  const displayName = u.full_name || 'Anonymous Member';
                  const initial = displayName.charAt(0).toUpperCase();

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-avatar-circle">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={displayName} />
                          ) : (
                            initial
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {displayName}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <Mail size={14} color="var(--text-muted)" />
                          <span>{u.email || 'No email on profile'}</span>
                        </div>
                      </td>
                      <td>
                        {u.is_vip ? (
                          <Badge variant="vip" icon={Crown}>
                            VIP Pass Active
                          </Badge>
                        ) : (
                          <Badge variant="muted">Standard</Badge>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(u.created_at)}
                      </td>
                      <td>
                        {u.role === 'admin' ? (
                          <Badge variant="primary" icon={Shield}>
                            Administrator
                          </Badge>
                        ) : (
                          <Badge variant="muted">Member</Badge>
                        )}
                      </td>
                      <td>
                        <Badge variant="success" icon={CheckCircle2}>
                          Active
                        </Badge>
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={() => handleViewProfile(u)}
                            title="View Profile Details"
                          >
                            View Profile
                          </Button>
                          <Button
                            variant={u.is_vip ? 'secondary' : 'primary'}
                            size="sm"
                            icon={Crown}
                            onClick={() => handleToggleVip(u)}
                            title={u.is_vip ? 'Revoke VIP' : 'Grant VIP'}
                          >
                            {u.is_vip ? 'Revoke VIP' : 'Grant VIP'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (<= 768px) */}
          <div className="users-mobile-cards" style={{ padding: '0.85rem' }}>
            {paginatedUsers.map((u) => {
              const displayName = u.full_name || 'Anonymous Member';
              const initial = displayName.charAt(0).toUpperCase();

              return (
                <div key={`m-user-${u.id}`} className="admin-mobile-card user-mobile-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <div className="user-avatar-circle" style={{ flexShrink: 0 }}>
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={displayName} />
                        ) : (
                          initial
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {displayName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Joined {formatDate(u.created_at)}
                        </div>
                      </div>
                    </div>
                    {u.role === 'admin' ? (
                      <Badge variant="primary" icon={Shield}>Admin</Badge>
                    ) : (
                      <Badge variant="muted">Member</Badge>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.65rem', wordBreak: 'break-all' }}>
                    <Mail size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span>{u.email || 'No email on profile'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px solid var(--border-subtle)', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>VIP Access:</span>
                    {u.is_vip ? (
                      <Badge variant="vip" icon={Crown}>VIP Pass Active</Badge>
                    ) : (
                      <Badge variant="muted">Standard</Badge>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingTop: '0.25rem' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={() => handleViewProfile(u)}
                      style={{ minHeight: '38px', justifyContent: 'center' }}
                    >
                      Profile
                    </Button>
                    <Button
                      variant={u.is_vip ? 'secondary' : 'primary'}
                      size="sm"
                      icon={Crown}
                      onClick={() => handleToggleVip(u)}
                      style={{ minHeight: '38px', justifyContent: 'center' }}
                    >
                      {u.is_vip ? 'Revoke VIP' : 'Grant VIP'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* User Profile Details Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={selectedUser}
        onToggleVip={handleToggleVip}
        toggleLoading={toggleLoading}
      />
    </div>
  );
};

export default UsersPage;
