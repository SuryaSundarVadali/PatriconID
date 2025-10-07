import React, { ReactNode } from 'react';

interface PageWrapperProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  icon?: ReactNode;
}

export default function PageWrapper({ title, subtitle, children, icon }: PageWrapperProps) {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8 text-center">
        {icon && (
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            {icon}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-3">{title}</h1>
        {subtitle && (
          <p className="text-base md:text-lg text-black/70 max-w-2xl mx-auto">{subtitle}</p>
        )}
      </div>

      {/* Page Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ title, subtitle, children, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`bg-white/95 backdrop-blur-xl rounded-3xl shadow-lg border border-black/5 hover:shadow-xl transition-all duration-300 ${className}`}>
      {(title || subtitle) && (
        <div className="px-8 pt-8 pb-4">
          {title && <h2 className="text-2xl font-bold text-black mb-2">{title}</h2>}
          {subtitle && <p className="text-black/70 text-sm">{subtitle}</p>}
        </div>
      )}
      <div className={noPadding ? '' : 'px-8 pb-8'}>
        {children}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
  badge?: string;
}

export function Section({ title, children, badge }: SectionProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-bold text-black">{title}</h3>
        {badge && (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'purple' | 'pink' | 'cyan' | 'green';
}

export function StatsCard({ label, value, icon, color = 'purple' }: StatsCardProps) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-rose-600',
    cyan: 'from-cyan-500 to-blue-600',
    green: 'from-emerald-500 to-green-600',
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-black/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-black/70 font-medium">{label}</span>
        {icon && (
          <div className={`w-10 h-10 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-md`}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-black">{value}</div>
    </div>
  );
}

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info';
  children: ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const statusClasses = {
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${statusClasses[status]}`}>
      {children}
    </span>
  );
}
