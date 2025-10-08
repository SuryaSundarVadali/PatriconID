import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizes[size]} border-violet-600 border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const FullPageSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-slate-600 font-medium">Loading...</p>
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-slate-200 rounded-lg ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-2" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  );
};

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  size = 'md',
  showPercentage = true,
}) => {
  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full" role="progressbar" aria-valuenow={clampedProgress} aria-valuemin={0} aria-valuemax={100}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-semibold text-slate-900">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className="bg-gradient-to-r from-violet-600 to-pink-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

interface ShimmerProps {
  className?: string;
}

export const Shimmer: React.FC<ShimmerProps> = ({ className = '' }) => {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200 ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};
