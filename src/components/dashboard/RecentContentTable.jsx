import React from 'react';
import { Sparkles, Video, Headphones, Eye, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';
import Pagination from '../ui/Pagination';
import usePagination from '../../hooks/usePagination';
import { formatDate } from '../../utils/formatters';

export const RecentContentTable = ({ items = [] }) => {
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    totalItems,
    paginatedItems
  } = usePagination(items, 10);

  if (items.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No recent content found.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="table-container recent-desktop-table" style={{ border: 'none', boxShadow: 'none' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Access</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => {
              let TypeIcon = Sparkles;
              let typeLabel = 'Spark';
              let linkTarget = '/sparks';

              if (item.type === 'video') {
                TypeIcon = Video;
                typeLabel = 'Video';
                linkTarget = '/videos';
              } else if (item.type === 'audio') {
                TypeIcon = Headphones;
                typeLabel = 'Audio';
                linkTarget = '/audios';
              }

              return (
                <tr key={`${item.type}-${item.id}`}>
                  <td>
                    <Badge variant="primary" icon={TypeIcon}>
                      {typeLabel}
                    </Badge>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {item.title}
                  </td>
                  <td>{item.category || 'General'}</td>
                  <td>
                    <Badge
                      variant={
                        item.status === 'published'
                          ? 'success'
                          : item.status === 'draft'
                            ? 'warning'
                            : 'muted'
                      }
                    >
                      {item.status || 'published'}
                    </Badge>
                  </td>
                  <td>
                    {item.is_vip ? (
                      <Badge variant="vip">VIP Only</Badge>
                    ) : (
                      <Badge variant="muted">All Users</Badge>
                    )}
                  </td>
                  <td>{formatDate(item.created_at)}</td>
                  <td>
                    <Link
                      to={linkTarget}
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Manage</span>
                      <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="recent-mobile-cards" style={{ padding: '0.85rem' }}>
        {paginatedItems.map((item) => {
          let TypeIcon = Sparkles;
          let typeLabel = 'Spark';
          let linkTarget = '/sparks';

          if (item.type === 'video') {
            TypeIcon = Video;
            typeLabel = 'Video';
            linkTarget = '/videos';
          } else if (item.type === 'audio') {
            TypeIcon = Headphones;
            typeLabel = 'Audio';
            linkTarget = '/audios';
          }

          return (
            <div key={`m-recent-${item.type}-${item.id}`} className="admin-mobile-card" style={{ padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Badge variant="primary" icon={TypeIcon}>
                    {typeLabel}
                  </Badge>
                  <Badge variant="muted">{item.category || 'General'}</Badge>
                </div>
                {item.is_vip ? (
                  <Badge variant="vip">VIP Only</Badge>
                ) : (
                  <Badge variant="muted">All Users</Badge>
                )}
              </div>

              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem', marginBottom: '0.4rem' }}>
                {item.title}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {formatDate(item.created_at)}
                </span>
                <Link
                  to={linkTarget}
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', minHeight: '36px' }}
                >
                  <span>Manage</span>
                  <ArrowUpRight size={14} />
                </Link>
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
  );
};

export default RecentContentTable;
