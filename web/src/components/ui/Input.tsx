import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  isSuccess?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      isSuccess = false,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    // Base styles
    const baseStyles = 'w-full px-4 py-3 text-base text-slate-900 bg-white border rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

    // State styles
    const stateStyles = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : isSuccess
      ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500'
      : 'border-slate-200 focus:border-violet-500 focus:ring-violet-500';

    // Icon padding
    const paddingStyles = leftIcon ? 'pl-11' : rightIcon || isPassword || error || isSuccess ? 'pr-11' : '';

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <div className={`${widthStyle} ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`${baseStyles} ${stateStyles} ${paddingStyles}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {/* Right Icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Success Icon */}
            {isSuccess && !error && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-label="Valid input" />
            )}

            {/* Error Icon */}
            {error && (
              <AlertCircle className="w-5 h-5 text-red-500" aria-label="Invalid input" />
            )}

            {/* Password Toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Custom Right Icon */}
            {rightIcon && !error && !isSuccess && !isPassword && (
              <div className="text-slate-400">{rightIcon}</div>
            )}
          </div>
        </div>

        {/* Helper Text / Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-slide-in-left"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-sm text-slate-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
