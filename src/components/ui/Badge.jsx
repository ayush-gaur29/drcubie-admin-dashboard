import React from 'react';

export const Badge = ({
  children,
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'vip' | 'muted'
  className = '',
  icon: Icon
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

export default Badge;

// 'primary'