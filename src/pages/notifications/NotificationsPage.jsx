import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Send,
  RefreshCw,
  Trash2,
  Users,
  Crown,
  User,
  CheckCircle2,
  Sparkles,
  Video,
  Headphones,
  Calendar,
  ExternalLink
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import ActionMenu from '../../components/ui/ActionMenu';
import usePagination from '../../hooks/usePagination';
import {
  fetchAdminNotifications,
  sendNotification,
  deleteNotification
} from '../../services/notifications/notificationsAdminService';
import { fetchAdminUsers } from '../../services/users/usersAdminService';
import { fetchAdminSparks } from '../../services/sparks/sparksAdminService';
import { fetchAdminVideos } from '../../services/videos/videosAdminService';
import { fetchAdminAudios } from '../../services/audios/audiosAdminService';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';

// Valid notification types matching public.notifications CHECK constraint:
// CHECK (type IN ('spark', 'video', 'audio', 'vip', 'general', 'system', 'streak'))
const TYPE_OPTIONS = [
  { value: 'general', label: 'General Announcement' },
  { value: 'spark', label: 'Daily Spark Wisdom' },
  { value: 'video', label: 'Video Contemplation' },
  { value: 'audio', label: 'Audio Contemplation' },
  { value: 'vip', label: 'VIP Exclusive Notice' },
  { value: 'system', label: 'System Notice' },
  { value: 'streak', label: 'Practice Streak Reminder' }
];

const TARGET_AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users (All Registered Members)' },
  { value: 'vip', label: 'VIP Users (Active VIP Pass Holders)' },
  { value: 'specific', label: 'Specific Existing User' }
];

const DESTINATION_OPTIONS = [
  { value: 'general', label: 'General App / Inbox' },
  { value: 'today', label: 'Today Screen' },
  { value: 'spark', label: 'Specific Spark' },
  { value: 'video', label: 'Specific Video' },
  { value: 'audio', label: 'Specific Audio' },
  { value: 'vip', label: 'VIP Pass Page' }
];

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [sparksList, setSparksList] = useState([]);
  const [videosList, setVideosList] = useState([]);
  const [audiosList, setAudiosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Broadcast modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'general',
    targetAudience: 'all',
    specificUserId: '',
    destination: 'today',
    selectedContentId: ''
  });

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { showToast } = useToast();

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedNotifications,
    goToPage
  } = usePagination(notifications, 10, [notifications]);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [notifs, users, sparks, videos, audios] = await Promise.all([
        fetchAdminNotifications(100),
        fetchAdminUsers().catch(() => []),
        fetchAdminSparks({ limit: 100 }).catch(() => []),
        fetchAdminVideos({ limit: 100 }).catch(() => []),
        fetchAdminAudios({ limit: 100 }).catch(() => [])
      ]);

      setNotifications(notifs || []);
      setUsersList(users || []);
      setSparksList(sparks || []);
      setVideosList(videos || []);
      setAudiosList(audios || []);

      if (isRefresh) {
        showToast('success', 'Notifications feed refreshed.');
      }
    } catch (err) {
      console.error('[NotificationsPage] Error loading notifications:', err);
      showToast('error', 'Failed to load notifications history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleOpenSend = () => {
    setFormData({
      title: 'Your Daily Spark is Ready',
      message: 'Take a moment for today\'s reflection.',
      type: 'spark',
      targetAudience: 'all',
      specificUserId: usersList[0]?.id || '',
      destination: 'today',
      selectedContentId: ''
    });
    setModalOpen(true);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      showToast('error', 'Notification title and message are required.');
      return;
    }

    if (formData.targetAudience === 'specific' && !formData.specificUserId) {
      showToast('error', 'Please select an existing target user.');
      return;
    }

    setFormLoading(true);
    try {
      let relType = formData.destination;
      let relId = formData.selectedContentId;
      let route = null;

      if (formData.destination === 'general') {
        relType = null;
        relId = null;
        route = 'notifications';
      } else if (formData.destination === 'today') {
        relId = null;
        route = 'today';
      } else if (formData.destination === 'vip') {
        relId = null;
        route = 'vip-pass';
      } else if (formData.destination === 'spark') {
        route = relId ? `spark/${relId}` : 'today';
      } else if (formData.destination === 'video') {
        route = relId ? `videos/${relId}` : 'videos';
      } else if (formData.destination === 'audio') {
        route = relId ? `audios/${relId}` : 'audios';
      }

      const result = await sendNotification({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        targetAudience: formData.targetAudience,
        specificUserId: formData.specificUserId,
        relatedContentType: relType,
        relatedContentId: relId,
        route
      });

      const sentCount = result?.pushResult?.sentCount;
      let toastMsg = `Broadcast dispatched to ${result.count} member(s).`;
      if (typeof sentCount === 'number') {
        toastMsg += ` (${sentCount} push delivered)`;
      }
      showToast('success', toastMsg);
      setModalOpen(false);
      loadNotifications();
    } catch (err) {
      console.error('Send error:', err);
      showToast('error', err.message || 'Failed to dispatch notification.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteNotification(itemToDelete.id);
      showToast('success', 'Notification removed.');
      setDeleteOpen(false);
      setItemToDelete(null);
      loadNotifications();
    } catch (err) {
      console.error('Delete error:', err);
      showToast('error', err.message || 'Failed to delete notification.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'spark':
        return <Badge variant="primary" icon={Sparkles}>Spark</Badge>;
      case 'video':
        return <Badge variant="primary" icon={Video}>Video</Badge>;
      case 'audio':
        return <Badge variant="success" icon={Headphones}>Audio</Badge>;
      case 'vip':
        return <Badge variant="vip" icon={Crown}>VIP</Badge>;
      case 'system':
        return <Badge variant="danger">System</Badge>;
      default:
        return <Badge variant="muted">General</Badge>;
    }
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
            Notification Broadcasting Center
          </h2>
          <p className="page-header-subtitle" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Dispatch targeted announcements, Daily Spark alerts, and VIP notices to registered members
          </p>
        </div>

        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadNotifications(true)}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Send}
            onClick={handleOpenSend}
          >
            Send Notification
          </Button>
        </div>
      </div>

      {/* Main Table or Empty State */}
      {loading && !refreshing ? (
        <Spinner size={36} text="Loading Notifications feed..." />
      ) : notifications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Bell}
            title="No notifications dispatched yet"
            description="Send your first in-app notification to all members or VIP pass holders."
            actionLabel="Broadcast Notification"
            onAction={handleOpenSend}
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container notifications-desktop-table" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title & Message</th>
                  <th>Type</th>
                  <th>Destination / Action</th>
                  <th>Recipient ID</th>
                  <th>Status</th>
                  <th>Dispatched</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNotifications.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {n.message}
                        </div>
                      </div>
                    </td>
                    <td>{getTypeBadge(n.type)}</td>
                    <td>
                      {n.related_content_type ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 500 }}>
                          {n.related_content_type.toUpperCase()}
                          {n.related_content_id ? ` (${n.related_content_id.substring(0, 8)}...)` : ''}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Inbox / General</span>
                      )}
                    </td>
                    <td>
                      <code style={{ fontSize: '0.74rem' }}>
                        {n.user_id ? `${n.user_id.substring(0, 8)}...` : 'All'}
                      </code>
                    </td>
                    <td>
                      <Badge variant={n.is_read ? 'muted' : 'primary'}>
                        {n.is_read ? 'Read' : 'Delivered / Unread'}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(n.created_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <ActionMenu
                          items={[
                            {
                              label: 'Delete',
                              icon: Trash2,
                              danger: true,
                              onClick: () => {
                                setItemToDelete(n);
                                setDeleteOpen(true);
                              }
                            }
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards for Tablet / Mobile (<= 768px) */}
          <div className="notifications-mobile-cards" style={{ padding: '0.85rem' }}>
            {paginatedNotifications.map((n) => (
              <div key={`m-notif-${n.id}`} className="admin-mobile-card notif-mobile-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {getTypeBadge(n.type)}
                    <Badge variant={n.is_read ? 'muted' : 'primary'}>
                      {n.is_read ? 'Read' : 'Delivered'}
                    </Badge>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {formatDate(n.created_at)}
                  </span>
                </div>

                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem', marginBottom: '2px' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {n.message}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Target: <code style={{ fontSize: '0.72rem' }}>{n.user_id ? `${n.user_id.substring(0, 8)}...` : 'All Members'}</code>
                  </div>
                  {n.related_content_type && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 600 }}>
                      opens {n.related_content_type.toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.35rem' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => {
                      setItemToDelete(n);
                      setDeleteOpen(true);
                    }}
                    style={{ color: 'var(--danger)', minHeight: '36px' }}
                  >
                    Delete Notification
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={notifications.length}
            pageSize={10}
            onPageChange={goToPage}
          />
        </div>
      )}

      {/* Compose Notification Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Broadcast In-App Notification"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="primary" icon={Send} onClick={handleSend} loading={formLoading}>
              Send Notification
            </Button>
          </>
        }
      >
        <form onSubmit={handleSend}>
          <Input
            label="Notification Title"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Your Daily Spark is Ready"
            required
          />

          <Textarea
            label="Message Body"
            name="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="e.g. Take a moment for today's reflection."
            rows={3}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            <Select
              label="Notification Category"
              name="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={TYPE_OPTIONS}
            />

            <Select
              label="Target Audience"
              name="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              options={TARGET_AUDIENCE_OPTIONS}
            />
          </div>

          {/* Specific User selector if targetAudience === 'specific' */}
          {formData.targetAudience === 'specific' && (
            <div style={{ marginTop: '0.75rem' }}>
              <Select
                label="Target Existing User"
                name="specificUserId"
                value={formData.specificUserId}
                onChange={(e) => setFormData({ ...formData, specificUserId: e.target.value })}
                options={usersList.map((u) => ({
                  value: u.id,
                  label: `${u.full_name || 'Anonymous'} (${u.email || u.id.substring(0, 8)}) — ${u.is_vip ? 'VIP' : 'Standard'}`
                }))}
                required
              />
            </div>
          )}

          {/* Destination / Action */}
          <div style={{ marginTop: '0.75rem' }}>
            <Select
              label="Tap Action / Destination"
              name="destination"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value, selectedContentId: '' })}
              options={DESTINATION_OPTIONS}
              helperText="Determines which view opens when the member interacts with this notification"
            />
          </div>

          {/* Specific content pickers */}
          {formData.destination === 'spark' && (
            <div style={{ marginTop: '0.75rem' }}>
              <Select
                label="Select Target Spark"
                name="selectedContentId"
                value={formData.selectedContentId}
                onChange={(e) => setFormData({ ...formData, selectedContentId: e.target.value })}
                options={sparksList.map((s) => ({
                  value: s.id,
                  label: `${s.title} (${s.category})`
                }))}
                required
              />
            </div>
          )}

          {formData.destination === 'video' && (
            <div style={{ marginTop: '0.75rem' }}>
              <Select
                label="Select Target Video"
                name="selectedContentId"
                value={formData.selectedContentId}
                onChange={(e) => setFormData({ ...formData, selectedContentId: e.target.value })}
                options={videosList.map((v) => ({
                  value: v.id,
                  label: `${v.title} (${v.duration || '0:30'})`
                }))}
                required
              />
            </div>
          )}

          {formData.destination === 'audio' && (
            <div style={{ marginTop: '0.75rem' }}>
              <Select
                label="Select Target Audio"
                name="selectedContentId"
                value={formData.selectedContentId}
                onChange={(e) => setFormData({ ...formData, selectedContentId: e.target.value })}
                options={audiosList.map((a) => ({
                  value: a.id,
                  label: `${a.title} (${a.duration || '04:15'})`
                }))}
                required
              />
            </div>
          )}
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Remove Notification Record"
        message={`Are you sure you want to delete notification "${itemToDelete?.title}"?`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  );
};

export default NotificationsPage;
