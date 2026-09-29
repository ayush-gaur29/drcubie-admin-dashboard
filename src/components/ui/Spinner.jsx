import React from 'react';

export const Spinner = ({ size = 24, text = '' }) => {
  return (
    <div className="loading-box">
      <div className="spinner" style={{ width: `${size}px`, height: `${size}px` }} />
      {text && <span style={{ fontSize: '0.85rem' }}>{text}</span>}
    </div>
  );
};

export default Spinner;
