import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${sizeStyles[size]} ${className}`}>
      {children}
    </div>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  noPadding = false,
}) => {
  const hoverStyles = hover
    ? 'hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]'
    : '';
  const paddingStyles = noPadding ? '' : 'p-6 sm:p-8';

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 ${hoverStyles} ${paddingStyles} ${className}`}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 p-2 bg-gradient-to-br from-violet-100 to-pink-100 rounded-xl">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 1,
  gap = 'md',
  className = '',
}) => {
  const colStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapStyles = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <div className={`grid ${colStyles[cols]} ${gapStyles[gap]} ${className}`}>
      {children}
    </div>
  );
};

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  children,
  title,
  description,
  className = '',
}) => {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 ${className}`}>
      {(title || description) && (
        <div className="mb-8 sm:mb-12 text-center">
          {title && (
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
};
