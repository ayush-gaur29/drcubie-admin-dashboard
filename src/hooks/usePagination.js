import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook for table/list pagination.
 *
 * @param {Array} items - The source items to paginate (dynamic dataset).
 * @param {number} pageSize - Maximum items per page (default: 10).
 * @param {Array} resetDeps - Dependency array; whenever any value changes (search, filters), resets to page 1.
 * @returns {object} { currentPage, setCurrentPage, totalPages, pageSize, totalItems, paginatedItems }
 */
export const usePagination = (items = [], pageSize = 10, resetDeps = []) => {
  const [currentPage, setCurrentPage] = useState(1);

  // When search/filter criteria change, automatically reset pagination to Page 1
  useEffect(() => {
    setCurrentPage(1);
  }, resetDeps); // eslint-disable-line react-hooks/exhaustive-deps

  const totalItems = items?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // When records are deleted/updated and the current page becomes invalid, automatically move to the nearest valid page
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    currentPage,
    setCurrentPage,
    goToPage: setCurrentPage,
    totalPages,
    pageSize,
    totalItems,
    paginatedItems
  };
};

export default usePagination;
