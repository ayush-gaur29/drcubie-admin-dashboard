import React, { useState, useEffect, useCallback } from 'react';
import {
  Headphones,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Crown,
  Upload,
  Play,
  Volume2,
  Music,
  Clock,
  AlertCircle
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
  fetchAdminAudios,
  createAudio,
  updateAudio,
  deleteAudio,
  uploadAudioFile,
  uploadAudioCover,
  checkAudioReferences
} from '../../services/audios/audiosAdminService';
import { detectAudioDuration } from '../../services/media/storageAdminService';
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

export const AudiosPage = () => {
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [isVip, setIsVip] = useState('');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAudio, setEditingAudio] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isDetectingDuration, setIsDetectingDuration] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [audioFileError, setAudioFileError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audio_url: '',
    thumbnail_url: '',
    duration: '',
    category: 'Mindfulness',
    speaker: 'Voice of Dr. Cubie',
    is_vip: false,
    status: 'published'
  });

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewAudio, setPreviewAudio] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [audioToDelete, setAudioToDelete] = useState(null);
  const [deleteWarning, setDeleteWarning] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { showToast } = useToast();

  const loadAudios = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchAdminAudios({
        search,
        category,
        status,
        isVip
      });
      setAudios(data || []);
      if (isRefresh) {
        showToast('success', 'Audio contemplation catalog synchronized.');
      }
    } catch (err) {
      console.error('[AudiosPage] Error loading audios:', err);
      showToast('error', 'Failed to load audio sessions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, category, status, isVip, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAudios();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadAudios]);

  const handleOpenCreate = () => {
    setEditingAudio(null);
    setSelectedFileName('');
    setIsDetectingDuration(false);
    setAudioFileError('');
    setFormData({
      title: '',
      description: '',
      audio_url: '',
      thumbnail_url: '',
      duration: '',
      category: 'Mindfulness',
      speaker: 'Voice of Dr. Cubie',
      is_vip: false,
      status: 'published'
    });
    setFormModalOpen(true);
  };

  const handleOpenEdit = (a) => {
    setEditingAudio(a);
    let existingFileName = '';
    if (a.audio_url) {
      try {
        const parts = a.audio_url.split('/');
        const raw = parts[parts.length - 1]?.split('?')[0] || '';
        existingFileName = decodeURIComponent(raw.replace(/^\d+_/, ''));
      } catch {
        existingFileName = 'Uploaded audio file';
      }
    }
    setSelectedFileName(existingFileName);
    setIsDetectingDuration(false);
    setAudioFileError('');
    setFormData({
      title: a.title || '',
      description: a.description || '',
      audio_url: a.audio_url || '',
      thumbnail_url: a.thumbnail_url || '',
      duration: a.duration || '',
      category: a.category || 'Mindfulness',
      speaker: a.speaker || 'Voice of Dr. Cubie',
      is_vip: Boolean(a.is_vip),
      status: a.status || 'published'
    });
    setFormModalOpen(true);
  };

  const handleOpenPreview = (a) => {
    setPreviewAudio(a);
    setPreviewModalOpen(true);
  };

  const handleOpenDelete = async (a) => {
    setAudioToDelete(a);
    setDeleteWarning('');
    try {
      const refs = await checkAudioReferences(a.id);
      if (refs.length > 0) {
        setDeleteWarning(
          `This audio is currently linked to ${refs.length} Spark(s): ${refs
            .map((r) => `"${r.title}"`)
            .join(', ')}. Deleting it will detach the audio player from these Sparks.`
        );
      }
    } catch (err) {
      console.warn('Error checking audio refs:', err);
    }
    setDeleteConfirmOpen(true);
  };

  const handleAudioFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset native input so choosing the same file again triggers onChange
    e.target.value = '';

    setAudioFileError('');
    setSelectedFileName(file.name);
    setIsDetectingDuration(true);

    try {
      // 1. Locally detect duration before uploading
      const detectionResult = await detectAudioDuration(file);

      // 2. Display detected duration immediately
      setFormData((prev) => ({
        ...prev,
        duration: detectionResult.formatted
      }));
      setIsDetectingDuration(false);

      // 3. Upload audio to Supabase Storage
      setUploadingAudio(true);
      const url = await uploadAudioFile(file);
      setFormData((prev) => ({
        ...prev,
        audio_url: url
      }));
      showToast('success', `Audio uploaded. Detected duration: ${detectionResult.formatted}`);
    } catch (err) {
      console.error('[AudiosPage] Audio file processing error:', err);
      const msg = err.message || 'Unable to detect the audio duration. Please select a valid audio file.';
      setAudioFileError(msg);
      showToast('error', msg);
    } finally {
      setIsDetectingDuration(false);
      setUploadingAudio(false);
    }
  };

  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const url = await uploadAudioCover(file);
      setFormData((prev) => ({ ...prev, thumbnail_url: url }));
      showToast('success', 'Artwork uploaded to Supabase Storage.');
    } catch (err) {
      console.error('Cover upload error:', err);
      showToast('error', err.message || 'Failed to upload artwork.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast('error', 'Audio Title is required.');
      return;
    }

    if (!formData.audio_url.trim()) {
      showToast('error', 'Audio file is required.');
      return;
    }

    if (isDetectingDuration) {
      showToast('error', 'Please wait for audio duration detection to complete.');
      return;
    }

    if (uploadingAudio) {
      showToast('error', 'Please wait for the audio upload to complete.');
      return;
    }

    // Validation: ensure readable duration metadata
    const cleanDuration = formData.duration?.trim();
    if (
      !cleanDuration ||
      cleanDuration === 'Detecting duration...' ||
      cleanDuration.includes('NaN') ||
      cleanDuration === 'Infinity'
    ) {
      showToast('error', 'Unable to detect the audio duration. Please select a valid audio file.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingAudio) {
        await updateAudio(editingAudio.id, formData);
        showToast('success', `Audio "${formData.title}" updated.`);
      } else {
        await createAudio(formData);
        showToast('success', `Audio "${formData.title}" created.`);
      }
      setFormModalOpen(false);
      loadAudios();
    } catch (err) {
      console.error('Save audio error:', err);
      showToast('error', err.message || 'Failed to save audio.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!audioToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteAudio(audioToDelete.id);
      showToast('success', `Audio "${audioToDelete.title}" deleted.`);
      setDeleteConfirmOpen(false);
      setAudioToDelete(null);
      loadAudios();
    } catch (err) {
      console.error('Delete audio error:', err);
      showToast('error', err.message || 'Failed to delete audio.');
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
            Audio Contemplations
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Curate spoken reflections, binaural ambient tracks, and voice guidance
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadAudios(true)}
          >
            Refresh
          </Button>

          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreate}>
            New Audio
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
            placeholder="Search by title, speaker, or description..."
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
        <Spinner size={36} text="Loading Audio tracks..." />
      ) : audios.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Volume2}
            title="No Audio tracks found"
            description="Upload MP3 or AAC sound files to provide soothing voice or binaural sessions for users."
            actionLabel="Upload Audio"
            onAction={handleOpenCreate}
          />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container audios-desktop-table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '56px' }}>Artwork</th>
                  <th>Title & Speaker</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Access</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {audios.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.thumbnail_url ? (
                        <img
                          src={a.thumbnail_url}
                          alt={a.title}
                          className="table-thumbnail"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          className="table-thumbnail"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#ecfdf5',
                            color: '#059669'
                          }}
                        >
                          <Headphones size={20} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {a.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Speaker: {a.speaker || 'Voice of Dr. Cubie'}
                      </div>
                      {a.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '320px' }}>
                          {a.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge variant="primary">{a.category || 'Mindfulness'}</Badge>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {a.duration || '04:15'}
                      </span>
                    </td>
                    <td>
                      <Badge
                        variant={
                          a.status === 'published'
                            ? 'success'
                            : a.status === 'draft'
                              ? 'warning'
                              : 'muted'
                        }
                      >
                        {a.status || 'published'}
                      </Badge>
                    </td>
                    <td>
                      {a.is_vip ? (
                        <Badge variant="vip" icon={Crown}>
                          VIP
                        </Badge>
                      ) : (
                        <Badge variant="muted">All Users</Badge>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(a.created_at)}
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenPreview(a)}
                          title="Preview Audio"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleOpenEdit(a)}
                          title="Edit Audio"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleOpenDelete(a)}
                          style={{ color: 'var(--danger)' }}
                          title="Delete Audio"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Responsive Mobile Cards View */}
          <div className="audios-mobile-cards">
            {audios.map((a) => (
              <div key={`m-aud-${a.id}`} className="admin-mobile-card">
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                  {a.thumbnail_url ? (
                    <img
                      src={a.thumbnail_url}
                      alt={a.title}
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <Headphones size={22} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <Badge variant="primary">{a.category || 'Mindfulness'}</Badge>
                      <Badge
                        variant={
                          a.status === 'published'
                            ? 'success'
                            : a.status === 'draft'
                              ? 'warning'
                              : 'muted'
                        }
                      >
                        {a.status || 'published'}
                      </Badge>
                      {a.is_vip && <Badge variant="vip">VIP</Badge>}
                    </div>

                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: 1.3 }}>
                      {a.title}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Speaker: {a.speaker || 'Voice of Dr. Cubie'}
                    </div>
                  </div>
                </div>

                {a.description && (
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
                    {a.description}
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
                    <span>⏱ {a.duration || '04:15'}</span>
                    <span>•</span>
                    <span>{formatDate(a.created_at)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={() => handleOpenPreview(a)}
                      title="Preview Audio"
                      style={{ minHeight: '38px', minWidth: '38px' }}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit2}
                      onClick={() => handleOpenEdit(a)}
                      title="Edit Audio"
                      style={{ minHeight: '38px', padding: '0.35rem 0.65rem' }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleOpenDelete(a)}
                      style={{ color: 'var(--danger)', minHeight: '38px', minWidth: '38px' }}
                      title="Delete Audio"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Audio Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingAudio ? 'Edit Audio Session' : 'New Audio Session'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormModalOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveForm} loading={formLoading}>
              {editingAudio ? 'Save Changes' : 'Create Audio'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveForm}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <Input
              label="Audio Title"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. 5-Minute Midday Stillness"
              required
            />

            <Input
              label="Speaker / Narrator"
              name="speaker"
              value={formData.speaker}
              onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
              placeholder="e.g. Dr. Cubie, Ambient Bell, etc."
            />
          </div>

          {/* Audio File / URL */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">
              Audio File / URL <span className="required-star">*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="https://.../storage/v1/object/public/audio/..."
                value={formData.audio_url}
                onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                required
              />
              <label
                className={`btn btn-secondary ${uploadingAudio || isDetectingDuration ? 'disabled' : ''}`}
                style={{ cursor: 'pointer', flexShrink: 0 }}
              >
                <Upload size={16} />
                <span>
                  {isDetectingDuration
                    ? 'Detecting...'
                    : uploadingAudio
                      ? 'Uploading...'
                      : 'Upload File'}
                </span>
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/aac,audio/ogg,audio/x-m4a,audio/m4a,.mp3,.wav,.aac,.ogg,.m4a"
                  onChange={handleAudioFileUpload}
                  disabled={uploadingAudio || isDetectingDuration}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <span className="form-helper-text">Direct MP3, WAV, AAC, OGG, or M4A file (max 50MB).</span>

            {/* Small File Information Section */}
            {(selectedFileName || formData.duration) && (
              <div className="audio-file-info-box">
                <div className="audio-file-info-header">
                  <div className="audio-file-info-row">
                    <span className="audio-file-info-label">Audio:</span>
                    <span className="audio-file-info-val" title={selectedFileName || 'Uploaded audio'}>
                      <Music size={13} style={{ flexShrink: 0, color: 'var(--primary)' }} />
                      <span className="audio-file-name-text">{selectedFileName || 'Uploaded audio'}</span>
                    </span>
                  </div>

                  <div className="audio-file-info-row">
                    <span className="audio-file-info-label">Duration:</span>
                    <span
                      className={`audio-duration-badge ${isDetectingDuration ? 'detecting' : ''}`}
                    >
                      <Clock size={13} style={{ flexShrink: 0 }} />
                      <span>{isDetectingDuration ? 'Detecting duration...' : (formData.duration || '—')}</span>
                    </span>
                  </div>
                </div>

                {formData.audio_url && !uploadingAudio && (
                  <div style={{ width: '100%', marginTop: '0.25rem' }}>
                    <audio
                      src={formData.audio_url}
                      controls
                      style={{ width: '100%', height: '32px' }}
                    >
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}
              </div>
            )}

            {audioFileError && (
              <div className="audio-file-error-box">
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{audioFileError}</span>
              </div>
            )}
          </div>

          {/* Artwork File / URL */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Cover Artwork (Optional)</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="https://.../thumbnails/..."
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              />
              <label
                className={`btn btn-secondary ${uploadingCover ? 'disabled' : ''}`}
                style={{ cursor: 'pointer', flexShrink: 0 }}
              >
                <Upload size={16} />
                <span>{uploadingCover ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverFileUpload}
                  disabled={uploadingCover}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
              value={isDetectingDuration ? 'Detecting duration...' : formData.duration}
              readOnly
              placeholder="Auto-detected on file upload"
              helperText="Automatically detected from uploaded audio file"
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
            label="Audio Session Description"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Atmospheric cues, breathing pacing, or guidance notes..."
          />

          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="audio_is_vip"
              checked={formData.is_vip}
              onChange={(e) => setFormData({ ...formData, is_vip: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-vip)', cursor: 'pointer' }}
            />
            <label htmlFor="audio_is_vip" style={{ fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
              VIP Audio Experience (Gated for subscribers)
            </label>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <MediaPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewAudio}
        type="audio"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setAudioToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Audio Track"
        message={`Are you sure you want to delete "${audioToDelete?.title}"?`}
        warningNote={deleteWarning}
        confirmLabel="Delete Audio"
        loading={deleteLoading}
      />
    </div>
  );
};

export default AudiosPage;
