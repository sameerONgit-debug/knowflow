// src/components/ui/SkeletonLoader.tsx
import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card">
          {/* Badge skeleton */}
          <div className="flex items-center gap-2 mb-3">
            <div className="skeleton h-5 w-20" />
            <div className="skeleton h-4 w-12" />
          </div>

          {/* Title skeleton */}
          <div className="skeleton h-4 w-3/4 mb-2" />

          {/* Description skeleton */}
          <div className="skeleton h-3 w-full mb-1" />
          <div className="skeleton h-3 w-2/3 mb-3" />

          {/* Footer skeleton */}
          <div className="pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};