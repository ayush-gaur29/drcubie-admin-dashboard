import React from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/formatters';

export const MediaPreviewModal = ({
  isOpen,
  onClose,
  item = null,
  type = 'spark' // 'spark' | 'video' | 'audio' | 'image'
}) => {
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Preview: ${item.title || item.name || 'Media Asset'}`}
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Media Player Area */}
        {(() => {
          const videoSrc = item.video_url || item.videos?.video_url;
          const audioSrc = item.audio_url || item.audios?.audio_url;
          const thumbSrc = item.thumbnail_url || item.publicUrl || item.videos?.thumbnail_url;

          return (
            <>
              {videoSrc && (
                <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#000' }}>
                  <video
                    src={videoSrc}
                    controls
                    poster={thumbSrc}
                    style={{ width: '100%', maxHeight: '320px', display: 'block' }}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              )}

              {audioSrc && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-muted)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {thumbSrc && (
                      <img
                        src={thumbSrc}
                        alt={item.title}
                        style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>
                        {item.audios?.title || `${item.title} (Audio)`}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        {item.audios?.speaker || item.speaker || 'Voice of Dr. Cubie'}
                      </p>
                    </div>
                  </div>
                  <audio src={audioSrc} controls style={{ width: '100%', height: '36px' }}>
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}

              {!videoSrc && thumbSrc && (
                <div style={{ textAlign: 'center', backgroundColor: '#0f172a', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  <img
                    src={thumbSrc}
                    alt={item.title || item.name}
                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                  />
                </div>
              )}
            </>
          );
        })()}

        {/* Metadata Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {item.category && <Badge variant="primary">{item.category}</Badge>}
            {item.status && (
              <Badge variant={item.status === 'published' ? 'success' : 'warning'}>
                {item.status}
              </Badge>
            )}
            {item.is_vip && <Badge variant="vip">VIP Only</Badge>}
            {item.duration && <Badge variant="muted">{item.duration}</Badge>}
          </div>

          {item.short_description && (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {item.short_description}
            </p>
          )}

          {item.reflection && (
            <div
              style={{
                backgroundColor: 'var(--bg-muted)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--primary)',
                fontStyle: 'italic',
                fontSize: '0.85rem'
              }}
            >
              "{item.reflection}"
            </div>
          )}

          {item.insight && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <strong>Core Insight:</strong> {item.insight}
            </div>
          )}

          {item.practice && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <strong>1-Minute Practice:</strong> {item.practice}
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '0.5rem' }}>
            ID: <code>{item.id}</code> • Created: {formatDate(item.created_at)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MediaPreviewModal;
