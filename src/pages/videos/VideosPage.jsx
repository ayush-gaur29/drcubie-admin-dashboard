import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Crown,
  Upload,
  Play,
  Film
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
import MediaPreviewModal from '../../components/content/MediaPreviewModal';
import {
  fetchAdminVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  uploadVideoFile,
  uploadThumbnailFile,
  checkVideoReferences
} from '../../services/videos/videosAdminService';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'Mindfulness', label: 'Mindfulness' },
  { value: 'Focus', label: 'Focus' },
  { value: 'Confidence', label: 'Confidence' },
  { value: 'Reflection', label: 'Reflection' },
  { value: 'Clarity', label: 'Clarity' },
  { value: 'Resilience', label: 'Resilience' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' }
];

const VIP_OPTIONS = [
  { value: '', label: 'All Access' },
  { value: 'true', label: 'VIP Only' },
  { value: 'false', label: 'Standard (Free)' }
];

export const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [isVip, setIsVip] = useState('');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration: '0:30',
    duration_seconds: 30,
    category: 'Mindfulness',
    is_vip: false,
    status: 'published'
  });

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [deleteWarning, setDeleteWarning] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { showToast } = useToast();

  const loadVideos = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchAdminVideos({
        search,
        category,
        status,
        isVip
      });
      setVideos(data || []);
      if (isRefresh) {
        showToast('success', 'Videos catalog synchronized with database.');
      }
    } catch (err) {
      console.error('[VideosPage] Error loading videos:', err);
      showToast('error', 'Failed to load video assets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, category, status, isVip, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadVideos();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadVideos]);

  const handleOpenCreate = () => {
    setEditingVideo(null);
    setFormData({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      duration: '0:30',
      duration_seconds: 30,
      category: 'Mindfulness',
      is_vip: false,
      status: 'published'
    });
    setFormModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVideo(v);
    setFormData({
      title: v.title || '',
      description: v.description || '',
      video_url: v.video_url || '',
      thumbnail_url: v.thumbnail_url || '',
      duration: v.duration || '0:30',
      duration_seconds: v.duration_seconds || 30,
      category: v.category || 'Mindfulness',
      is_vip: Boolean(v.is_vip),
      status: v.status || 'published'
    });
    setFormModalOpen(true);
  };

  const handleOpenPreview = (v) => {
    setPreviewVideo(v);
    setPreviewModalOpen(true);
  };

  const handleOpenDelete = async (v) => {
    setVideoToDelete(v);
    setDeleteWarning('');
    try {
      const refs = await checkVideoReferences(v.id);
      if (refs.length > 0) {
        setDeleteWarning(
          `This video is currently attached to ${refs.length} Spark(s): ${refs
            .map((r) => `"${r.title}"`)
            .join(', ')}. Deleting it will detach the video.`
        );
      }
    } catch (err) {
      console.warn('Error checking video refs:', err);
    }
    setDeleteConfirmOpen(true);
  };

  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const url = await uploadVideoFile(file);
      setFormData((prev) => ({ ...prev, video_url: url }));
      showToast('success', 'Video asset uploaded to Supabase Storage.');
    } catch (err) {
      console.error('Video upload error:', err);
      showToast('error', err.message || 'Failed to upload video.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumb(true);
    try {
      const url = await uploadThumbnailFile(file);
      setFormData((prev) => ({ ...prev, thumbnail_url: url }));
      showToast('success', 'Thumbnail uploaded to Supabase Storage.');
    } catch (err) {
      console.error('Thumb upload error:', err);
      showToast('error', err.message || 'Failed to upload thumbnail.');
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.video_url.trim()) {
      showToast('error', 'Title and Video URL are required.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingVideo) {
        await updateVideo(editingVideo.id, formData);
        showToast('success', `Video "${formData.title}" updated.`);
      } else {
        await createVideo(formData);
        showToast('success', `Video "${formData.title}" created.`);
      }
      setFormModalOpen(false);
      loadVideos();
    } catch (err) {
      console.error('Save video error:', err);
      showToast('error', err.message || 'Failed to save video.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!videoToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteVideo(videoToDelete.id);
      showToast('success', `Video "${videoToDelete.title}" deleted.`);
      setDeleteConfirmOpen(false);
      setVideoToDelete(null);
      loadVideos();
    } catch (err) {
      console.error('Delete video error:', err);
      showToast('error', err.message || 'Failed to delete video.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      {/* Top Action Header */}
      <div
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
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Video Management
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Upload video media (up to 100MB) directly to Supabase Storage & manage playback cards
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadVideos(true)}
          >
            Refresh
          </Button>

          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreate}>
            New Video
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
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          <Select
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: '160px', marginBottom: 0 }}
          />

          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '140px', marginBottom: 0 }}
          />

          <Select
            options={VIP_OPTIONS}
            value={isVip}
            onChange={(e) => setIsVip(e.target.value)}
            style={{ width: '140px', marginBottom: 0 }}
          />
        </div>
      </div>

      {/* Main Content Table or Empty State */}
      {loading && !refreshing ? (
        <Spinner size={36} text="Loading Video assets..." />
      ) : videos.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Film}
            title="No Video assets found"
            description="Upload an MP4 or WebM video file to include contemplative visual scenes in your Sparks."
            actionLabel="Upload New Video"
            onAction={handleOpenCreate}
          />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container videos-desktop-table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '56px' }}>Media</th>
                  <th>Title & Description</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Access</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id}>
                    <td>
                      {v.thumbnail_url ? (
                        <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                          <img
                            src={v.thumbnail_url}
                            alt={v.title}
                            className="table-thumbnail"
                            style={{ width: '48px', height: '48px' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(0,0,0,0.3)',
                              borderRadius: 'var(--radius-sm)',
                              color: '#ffffff'
                            }}
                          >
                            <Play size={14} fill="#ffffff" />
                          </div>
                        </div>
                      ) : (
                        <div
                          className="table-thumbnail"
                          style={{
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#ecfeff',
                            color: '#0891b2'
                          }}
                        >
                          <Video size={20} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {v.title}
                      </div>
                      {v.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '320px' }}>
                          {v.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge variant="primary">{v.category || 'Mindfulness'}</Badge>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {v.duration || '0:30'}
                      </span>
                    </td>
                    <td>
                      <Badge
                        variant={
                          v.status === 'published'
                            ? 'success'
                            : v.status === 'draft'
                              ? 'warning'
                              : 'muted'
                        }
                      >
                        {v.status || 'published'}
                      </Badge>
                    </td>
                    <td>
                      {v.is_vip ? (
                        <Badge variant="vip" icon={Crown}>
                          VIP
                        </Badge>
                      ) : (
                        <Badge variant="muted">All Users</Badge>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(v.created_at)}
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenPreview(v)}
                          title="Preview Video"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleOpenEdit(v)}
                          title="Edit Video"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleOpenDelete(v)}
                          style={{ color: 'var(--danger)' }}
                          title="Delete Video"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Responsive Mobile Cards View */}
          <div className="videos-mobile-cards">
            {videos.map((v) => (
              <div key={`m-vid-${v.id}`} className="admin-mobile-card">
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                  {v.thumbnail_url ? (
                    <div style={{ position: 'relative', width: '54px', height: '54px', flexShrink: 0 }}>
                      <img
                        src={v.thumbnail_url}
                        alt={v.title}
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: 'var(--radius-sm)',
                          objectFit: 'cover'
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#ffffff'
                        }}
                      >
                        <Play size={16} fill="#ffffff" />
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#ecfeff',
                        color: '#0891b2',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <Video size={22} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <Badge variant="primary">{v.category || 'Mindfulness'}</Badge>
                      <Badge
                        variant={
                          v.status === 'published'
                            ? 'success'
                            : v.status === 'draft'
                              ? 'warning'
                              : 'muted'
                        }
                      >
                        {v.status || 'published'}
                      </Badge>
                      {v.is_vip && <Badge variant="vip">VIP</Badge>}
                    </div>

                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: 1.3 }}>
                      {v.title}
                    </div>
                  </div>
                </div>

                {v.description && (
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.65rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.4
                    }}
                  >
                    {v.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.6rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>⏱ {v.duration || '0:30'}</span>
                    <span>•</span>
                    <span>{formatDate(v.created_at)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={() => handleOpenPreview(v)}
                      title="Preview Video"
                      style={{ minHeight: '38px', minWidth: '38px' }}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit2}
                      onClick={() => handleOpenEdit(v)}
                      title="Edit Video"
                      style={{ minHeight: '38px', padding: '0.35rem 0.65rem' }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleOpenDelete(v)}
                      style={{ color: 'var(--danger)', minHeight: '38px', minWidth: '38px' }}
                      title="Delete Video"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Video Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingVideo ? 'Edit Video Asset' : 'New Video Asset'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormModalOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveForm} loading={formLoading}>
              {editingVideo ? 'Save Changes' : 'Create Video'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveForm}>
          <Input
            label="Video Title"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Dawn Reflections on Water"
            required
          />

          {/* Video File / URL */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">
              Video File / URL <span className="required-star">*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="https://.../storage/v1/object/public/videos/..."
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                required
              />
              <label
                className={`btn btn-secondary ${uploadingVideo ? 'disabled' : ''}`}
                style={{ cursor: 'pointer', flexShrink: 0 }}
              >
                <Upload size={16} />
                <span>{uploadingVideo ? 'Uploading...' : 'Upload File'}</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleVideoFileUpload}
                  disabled={uploadingVideo}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <span className="form-helper-text">Direct MP4 or WebM video (max 100MB).</span>
          </div>

          {/* Thumbnail File / URL */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Thumbnail Poster Image (Optional)</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="https://.../thumbnails/..."
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              />
              <label
                className={`btn btn-secondary ${uploadingThumb ? 'disabled' : ''}`}
                style={{ cursor: 'pointer', flexShrink: 0 }}
              >
                <Upload size={16} />
                <span>{uploadingThumb ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleThumbFileUpload}
                  disabled={uploadingThumb}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <Select
              label="Category"
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={CATEGORY_OPTIONS.filter((c) => c.value !== '')}
            />

            <Input
              label="Duration String"
              name="duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="0:30"
            />

            <Input
              label="Duration Seconds"
              name="duration_seconds"
              type="number"
              value={formData.duration_seconds}
              onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value, 10) || 0 })}
            />

            <Select
              label="Publication Status"
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={STATUS_OPTIONS.filter((s) => s.value !== '')}
            />
          </div>

          <Textarea
            label="Video Description"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Atmospheric context or summary of the visual sequence..."
          />

          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="video_is_vip"
              checked={formData.is_vip}
              onChange={(e) => setFormData({ ...formData, is_vip: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-vip)', cursor: 'pointer' }}
            />
            <label htmlFor="video_is_vip" style={{ fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
              VIP Content Only (Requires active membership)
            </label>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <MediaPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewVideo}
        type="video"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setVideoToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Video"
        message={`Are you sure you want to delete "${videoToDelete?.title}"?`}
        warningNote={deleteWarning}
        confirmLabel="Delete Video"
        loading={deleteLoading}
      />
    </div>
  );
};

export default VideosPage;
