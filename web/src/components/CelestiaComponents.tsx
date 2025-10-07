import React, { ReactNode } from 'react';

interface CelestiaCardProps {
  children: ReactNode;
  className?: string;
}

export function CelestiaCard({ children, className = '' }: CelestiaCardProps) {
  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50 ${className}`}>
      {children}
    </div>
  );
}

interface CelestiaSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function CelestiaSection({ title, description, children, className = '' }: CelestiaSectionProps) {
  return (
    <div className={`mb-8 ${className}`}>
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">{title}</h2>
      )}
      {description && (
        <p className="text-base md:text-lg text-black/75 mb-6 max-w-2xl">{description}</p>
      )}
      <CelestiaCard>{children}</CelestiaCard>
    </div>
  );
}

interface CelestiaButtonProps {
  onClick?: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function CelestiaButton({ 
  onClick, 
  children, 
  variant = 'primary', 
  disabled = false,
  className = '',
  type = 'button'
}: CelestiaButtonProps) {
  const baseClasses = 'py-3 px-6 rounded-lg font-semibold text-base transition duration-200 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-black text-white hover:bg-[#222222]',
    secondary: 'bg-white text-black border border-gray-300 hover:bg-gray-100',
    outline: 'bg-transparent text-black border-2 border-black hover:bg-black hover:text-white'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

interface CelestiaInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
}

export function CelestiaInput({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  type = 'text',
  className = ''
}: CelestiaInputProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-black mb-2">{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#6B4EFF] focus:ring-2 focus:ring-[#6B4EFF]/20 outline-none transition duration-200 bg-white text-black"
      />
    </div>
  );
}

interface CelestiaSelectProps {
  label?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  className?: string;
}

export function CelestiaSelect({ 
  label, 
  value, 
  onChange, 
  options,
  className = ''
}: CelestiaSelectProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-black mb-2">{label}</label>
      )}
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#6B4EFF] focus:ring-2 focus:ring-[#6B4EFF]/20 outline-none transition duration-200 bg-white text-black"
      >
        {options.map((option) => (
          <option key={option.value.toString()} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
