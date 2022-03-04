import React from 'react';

export default function LoadingSkeleton({ itemCount = 4 }) {
  return (
    <div className="loading-skeleton">
      {Array(itemCount).fill({}).map((_, i) => (
        <div key={i} className="loading-skeleton-item">
          <span className="loading-box" />
          <span className="loading-text-heading"/>
          <span className="loading-text-right"/>
          <span className="loading-text-sub"/>
        </div>
      ))}
    </div>
  );
}
