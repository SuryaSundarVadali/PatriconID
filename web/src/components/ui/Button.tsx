import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

    // Variant styles
    const variantStyles = {
      primary: 'bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:shadow-lg hover:scale-105 active:scale-100 focus:ring-violet-500',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 hover:shadow-md focus:ring-slate-400',
      outline: 'border-2 border-violet-600 text-violet-600 hover:bg-violet-50 hover:scale-105 active:scale-100 focus:ring-violet-500',
      ghost: 'text-slate-700 hover:bg-slate-100 hover:scale-105 active:scale-100 focus:ring-slate-400',
      danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:scale-105 active:scale-100 focus:ring-red-500',
    };

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm min-h-[36px]',
      md: 'px-4 py-2.5 text-base min-h-[44px]',
      lg: 'px-6 py-3 text-lg min-h-[52px]',
      xl: 'px-8 py-4 text-xl min-h-[60px]',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
