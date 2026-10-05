import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Sparkles,
  Video,
  Headphones,
  Compass,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  ExternalLink
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import usePagination from '../../hooks/usePagination';
import {
  fetchDailyContentList,
  saveDailyContent,
  deleteDailyContent
} from '../../services/dailyContent/dailyContentAdminService';
import { fetchAdminSparks } from '../../services/sparks/sparksAdminService';
import { fetchAdminVideos } from '../../services/videos/videosAdminService';
import { fetchAdminAudios } from '../../services/audios/audiosAdminService';
import { fetchAdminRecommendations } from '../../services/recommendations/recommendationsAdminService';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatDateInput } from '../../utils/formatters';

export const DailyContentPage = () => {
  const [scheduleList, setScheduleList] = useState([]);
  const [sparksList, setSparksList] = useState([]);
  const [videosList, setVideosList] = useState([]);
  const [audiosList, setAudiosList] = useState([]);
  const [activeRecommendations, setActiveRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    content_date: formatDateInput(),
    spark_id: '',
    video_id: '',
    audio_id: '',
    status: 'published'
  });

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { showToast } = useToast();

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    totalItems,
    paginatedItems: paginatedSchedule
  } = usePagination(scheduleList, 10);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [list, sparks, videos, audios, recs] = await Promise.all([
        fetchDailyContentList(),
        fetchAdminSparks({ limit: 100 }),
        fetchAdminVideos({ limit: 100 }),
        fetchAdminAudios({ limit: 100 }),
        fetchAdminRecommendations().catch(() => [])
      ]);

      setScheduleList(list || []);
      setSparksList(sparks || []);
      setVideosList(videos || []);
      setAudiosList(audios || []);
      setActiveRecommendations((recs || []).filter((r) => r.is_active));

      if (isRefresh) {
        showToast('success', 'Daily programming schedule refreshed.');
      }
    } catch (err) {
      console.error('[DailyContentPage] Error loading data:', err);
      showToast('error', 'Failed to load daily programming.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When selected spark changes in modal, auto-fill linked video and audio
  const handleSparkChange = (selectedSparkId) => {
    const spark = sparksList.find((s) => s.id === selectedSparkId);
    setFormData((prev) => ({
      ...prev,
      spark_id: selectedSparkId,
      video_id: spark?.video_id || '',
      audio_id: spark?.audio_id || ''
    }));
  };

  const handleOpenSchedule = (dateStr = null) => {
    setEditingEntry(null);
    const initialSpark = sparksList[0];
    setFormData({
      content_date: dateStr || formatDateInput(),
      spark_id: initialSpark?.id || '',
      video_id: initialSpark?.video_id || '',
      audio_id: initialSpark?.audio_id || '',
      status: 'published'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      content_date: entry.content_date,
      spark_id: entry.spark_id,
      video_id: entry.sparks?.video_id || '',
      audio_id: entry.sparks?.audio_id || '',
      status: entry.status || 'published'
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.content_date || !formData.spark_id) {
      showToast('error', 'Date and Spark are required.');
      return;
    }

    setFormLoading(true);
    try {
      await saveDailyContent({
        content_date: formData.content_date,
        spark_id: formData.spark_id,
        video_id: formData.video_id || null,
        audio_id: formData.audio_id || null,
        status: formData.status
      });

      showToast('success', `Daily programming saved for ${formData.content_date}.`);
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Save schedule error:', err);
      showToast('error', err.message || 'Failed to save daily schedule.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteDailyContent(itemToDelete.id);
      showToast('success', `Removed scheduled programming for ${itemToDelete.content_date}.`);
      setDeleteOpen(false);
      setItemToDelete(null);
      loadData();
    } catch (err) {
      console.error('Delete schedule error:', err);
      showToast('error', err.message || 'Failed to remove schedule.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const todayStr = formatDateInput();
  const todayEntry = scheduleList.find((item) => item.content_date === todayStr);

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
            Daily Content
          </h2>
          <p className="page-header-subtitle" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Schedule and synchronize Today's Spark, Video, Audio, and Recommendations for the mobile application
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

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => handleOpenSchedule()}
          >
            Schedule Date
          </Button>
        </div>
      </div>

      {/* Today Status Banner */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          borderLeft: todayEntry ? '4px solid var(--success)' : '4px solid var(--warning)',
          backgroundColor: todayEntry ? 'var(--bg-surface)' : 'var(--warning-bg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {todayEntry ? (
              <CheckCircle2 size={24} color="var(--success)" />
            ) : (
              <AlertCircle size={24} color="var(--warning)" />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Today’s Content ({formatDate(todayStr)})
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {todayEntry ? (
                  <>
                    Live Spark: <strong>"{todayEntry.sparks?.title}"</strong> ({todayEntry.sparks?.category})
                    {todayEntry.sparks?.videos?.title && (
                      <span> • Video: {todayEntry.sparks.videos.title}</span>
                    )}
                    {todayEntry.sparks?.audios?.title && (
                      <span> • Audio: {todayEntry.sparks.audios.title}</span>
                    )}
                  </>
                ) : (
                  'No Spark is explicitly mapped to today. The app will fall back to default rotation.'
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {todayEntry ? (
              <Button
                variant="secondary"
                size="sm"
                icon={Edit2}
                onClick={() => handleOpenEdit(todayEntry)}
              >
                Edit Today's Content
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => handleOpenSchedule(todayStr)}
              >
                Assign Content for Today
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      {loading && !refreshing ? (
        <Spinner size={36} text="Loading Daily Schedules..." />
      ) : scheduleList.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CalendarDays}
            title="No dates scheduled"
            description="Assign daily Sparks to calendar dates so members have fresh contemplation every morning."
            actionLabel="Schedule First Date"
            onAction={() => handleOpenSchedule()}
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container daily-desktop-table" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Calendar Date</th>
                  <th>Today's Spark</th>
                  <th>Category</th>
                  <th>Today's Video</th>
                  <th>Today's Audio</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSchedule.map((entry) => {
                  const isToday = entry.content_date === todayStr;
                  const videoTitle = entry.sparks?.videos?.title;
                  const audioTitle = entry.sparks?.audios?.title;

                  return (
                    <tr
                      key={entry.id}
                      style={isToday ? { backgroundColor: 'rgba(239, 246, 255, 0.7)' } : {}}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            {entry.content_date}
                          </span>
                          {isToday && <Badge variant="primary">Today</Badge>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {entry.sparks?.title || 'Unknown Spark'}
                        </div>
                      </td>
                      <td>
                        <Badge variant="muted">
                          {entry.sparks?.category || 'Mindfulness'}
                        </Badge>
                      </td>
                      <td>
                        {videoTitle ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: '#0284c7' }}>
                            <Video size={14} />
                            <span>{videoTitle}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>None</span>
                        )}
                      </td>
                      <td>
                        {audioTitle ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: '#059669' }}>
                            <Headphones size={14} />
                            <span>{audioTitle}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>None</span>
                        )}
                      </td>
                      <td>
                        <Badge variant={entry.status === 'published' ? 'success' : 'warning'}>
                          {entry.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {formatDate(entry.updated_at || entry.created_at)}
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '0.25rem' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit2}
                            onClick={() => handleOpenEdit(entry)}
                            title="Edit daily schedule"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => {
                              setItemToDelete(entry);
                              setDeleteOpen(true);
                            }}
                            title="Remove scheduled date"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards for Tablet / Mobile (<= 768px) */}
          <div className="daily-mobile-cards" style={{ padding: '0.85rem' }}>
            {paginatedSchedule.map((entry) => {
              const isToday = entry.content_date === todayStr;
              const videoTitle = entry.sparks?.videos?.title;
              const audioTitle = entry.sparks?.audios?.title;

              return (
                <div
                  key={`m-daily-${entry.id}`}
                  className="admin-mobile-card daily-mobile-card"
                  style={isToday ? { borderLeft: '4px solid var(--primary)', backgroundColor: 'rgba(239, 246, 255, 0.4)' } : {}}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {entry.content_date}
                      </span>
                      {isToday && <Badge variant="primary">Today</Badge>}
                    </div>
                    <Badge variant={entry.status === 'published' ? 'success' : 'warning'}>
                      {entry.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      Featured Spark:
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                      {entry.sparks?.title || 'Unknown Spark'}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <Badge variant="muted">{entry.sparks?.category || 'Mindfulness'}</Badge>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.5rem 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Video</div>
                      {videoTitle ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#0284c7' }}>
                          <Video size={13} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{videoTitle}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>None</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Audio</div>
                      {audioTitle ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#059669' }}>
                          <Headphones size={13} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{audioTitle}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>None</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', paddingTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Updated {formatDate(entry.updated_at || entry.created_at)}
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit2}
                        onClick={() => handleOpenEdit(entry)}
                        style={{ minHeight: '36px' }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => {
                          setItemToDelete(entry);
                          setDeleteOpen(true);
                        }}
                        style={{ minHeight: '36px', color: 'var(--danger)' }}
                      >
                        Delete
                      </Button>
                    </div>
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

      {/* Programming Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEntry ? `Edit Daily Programming (${formData.content_date})` : 'Schedule Daily Content'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={formLoading}>
              Save Programming
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <Input
              label="Programming Date"
              name="content_date"
              type="date"
              value={formData.content_date}
              onChange={(e) => setFormData({ ...formData, content_date: e.target.value })}
              required
              helperText="Date for this Today screen feature"
            />

            <Select
              label="Publication Status"
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'published', label: 'Published (Active on Date)' },
                { value: 'draft', label: 'Draft (Admin Preview Only)' }
              ]}
            />
          </div>

          <Select
            label="Today's Spark"
            name="spark_id"
            value={formData.spark_id}
            onChange={(e) => handleSparkChange(e.target.value)}
            options={sparksList.map((s) => ({
              value: s.id,
              label: `${s.title} — ${s.category || 'General'} (${s.duration || '4 min'})`
            }))}
            required
            helperText="The hero wisdom card featured on the Today screen"
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <Select
              label="Today's Video"
              name="video_id"
              value={formData.video_id}
              onChange={(e) => setFormData({ ...formData, video_id: e.target.value })}
              options={[
                { value: '', label: 'None (No Video linked)' },
                ...videosList.map((v) => ({
                  value: v.id,
                  label: `${v.title} (${v.duration || '0:30'})`
                }))
              ]}
              helperText="Accompanies Today's reflection card"
            />

            <Select
              label="Today's Audio"
              name="audio_id"
              value={formData.audio_id}
              onChange={(e) => setFormData({ ...formData, audio_id: e.target.value })}
              options={[
                { value: '', label: 'None (No Audio linked)' },
                ...audiosList.map((a) => ({
                  value: a.id,
                  label: `${a.title} (${a.duration || '04:15'})`
                }))
              ]}
              helperText="Guided contemplation track"
            />
          </div>

          {/* Recommendations Preview Box */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Compass size={16} color="var(--primary)" />
                <span>Today's Active Recommendations ({activeRecommendations.length})</span>
              </div>
              <Link to="/recommendations" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>Manage recommendations</span>
                <ExternalLink size={12} />
              </Link>
            </div>
            {activeRecommendations.length === 0 ? (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                No recommendations currently active. Visit Recommendations to activate items.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {activeRecommendations.slice(0, 4).map((r) => (
                  <Badge key={r.id} variant="muted">
                    {r.title} ({r.content_type})
                  </Badge>
                ))}
                {activeRecommendations.length > 4 && (
                  <Badge variant="primary">+{activeRecommendations.length - 4} more</Badge>
                )}
              </div>
            )}
          </div>
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
        title="Remove Scheduled Date"
        message={`Are you sure you want to remove the scheduled programming for ${itemToDelete?.content_date}?`}
        confirmLabel="Remove"
        loading={deleteLoading}
      />
    </div>
  );
};

export default DailyContentPage;
