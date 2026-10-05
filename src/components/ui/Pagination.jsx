import React from 'react';

/**
 * Reusable Pagination controls component.
 * Adheres strictly to the Dr. Cubie design system tokens and responsive layouts.
 *
 * @param {number} currentPage - Currently active page (1-indexed).
 * @param {number} totalPages - Total calculated pages.
 * @param {number} totalItems - Total count of records in current filtered set.
 * @param {number} pageSize - Maximum records per page (default: 10).
 * @param {function} onPageChange - Callback when user clicks page, Previous, or Next.
 */
export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange
}) => {
  // If there are 10 or fewer records, hide pagination controls completely
  if (totalItems <= pageSize) {
    return null;
  }

  const startEntry = (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="table-pagination" aria-label="Table pagination navigation">
      <div className="pagination-info">
        Showing <strong>{startEntry}</strong> to <strong>{endEntry}</strong> of <strong>{totalItems}</strong> entries
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="btn-page"
          onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          Previous
        </button>

        {getPageNumbers().map((p, idx) => (
          <button
            key={`page-${idx}-${p}`}
            type="button"
            className={`btn-page ${currentPage === p ? 'active' : ''}`}
            onClick={() => typeof p === 'number' && onPageChange && onPageChange(p)}
            disabled={p === '...'}
            aria-current={currentPage === p ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          className="btn-page"
          onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
