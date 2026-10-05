import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

/**
 * Reusable ActionMenu (three-dot menu) component for table rows.
 *
 * @param {Array} items - List of actions: [{ label, icon: Icon, onClick, danger, disabled, hidden }]
 * @param {string} ariaLabel - Accessible label for the three-dot button
 * @param {string} className - Optional container class
 */
export const ActionMenu = ({
  items = [],
  ariaLabel = 'Actions',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Filter visible items
  const activeItems = items.filter((item) => item && !item.hidden);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 160;
    const approxItemHeight = 36;
    const menuHeight = activeItems.length * approxItemHeight + 12;

    let top = rect.bottom + 4;
    let left = rect.right - menuWidth;

    // Flip upwards if overflows bottom of viewport
    if (top + menuHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - menuHeight - 4);
    }

    // Keep within horizontal screen bounds
    if (left < 8) {
      left = 8;
    } else if (left + menuWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - menuWidth - 8);
    }

    setCoords({ top, left });
  }, [activeItems.length]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      updatePosition();
      setIsOpen(true);
    }
  };

  const handleItemClick = (e, item) => {
    e.stopPropagation();
    if (item.disabled) return;
    setIsOpen(false);
    if (item.onClick) {
      item.onClick(e);
    }
  };

  // Close when clicking outside, scrolling, or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  if (activeItems.length === 0) return null;

  return (
    <div className={`action-menu-container ${className}`.trim()} style={{ display: 'inline-flex', position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        className={`btn-action-menu ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="More actions"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="action-menu-dropdown"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`
            }}
            role="menu"
            aria-label={ariaLabel}
            onClick={(e) => e.stopPropagation()}
          >
            {activeItems.map((item, idx) => {
              const Icon = item.icon;
              const isDanger = item.danger || item.variant === 'danger';

              return (
                <button
                  key={`action-${idx}-${item.label}`}
                  type="button"
                  className={`action-menu-item ${isDanger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
                  onClick={(e) => handleItemClick(e, item)}
                  role="menuitem"
                  disabled={item.disabled}
                >
                  {Icon && <Icon size={14} className="action-menu-icon" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

export default ActionMenu;
