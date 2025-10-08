import React, { useState } from 'react';
import { Shield, Menu, X, ChevronDown } from 'lucide-react';
import Button from './Button';

interface NavLink {
  label: string;
  onClick: () => void;
  isActive?: boolean;
  icon?: React.ReactNode;
}

interface NavigationProps {
  logo?: React.ReactNode;
  logoText?: string;
  links: NavLink[];
  actions?: React.ReactNode;
  onLogoClick?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  logo,
  logoText = 'PATRICONID',
  links,
  actions,
  onLogoClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <button
            onClick={onLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg px-2 py-1 -ml-2"
            aria-label="Go to homepage"
          >
            {logo || <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-violet-600" />}
            <span className="font-bold text-lg sm:text-xl tracking-wide text-slate-900">
              {logoText}
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {links.map((link, index) => (
              <button
                key={index}
                onClick={link.onClick}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  link.isActive
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100 hover:scale-105'
                }`}
                aria-current={link.isActive ? 'page' : undefined}
              >
                {link.icon && <span className="flex-shrink-0">{link.icon}</span>}
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop Actions */}
          {actions && <div className="hidden md:flex items-center gap-3">{actions}</div>}

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t border-slate-200 py-4 animate-slide-down"
            role="menu"
          >
            <div className="flex flex-col gap-2">
              {links.map((link, index) => (
                <button
                  key={index}
                  onClick={() => {
                    link.onClick();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm font-medium rounded-xl transition-all duration-300 flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                    link.isActive
                      ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  role="menuitem"
                  aria-current={link.isActive ? 'page' : undefined}
                >
                  {link.icon && <span className="flex-shrink-0">{link.icon}</span>}
                  {link.label}
                </button>
              ))}
            </div>

            {/* Mobile Actions */}
            {actions && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-2">
                {actions}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

// Skip Navigation Link for Accessibility
export const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
    >
      Skip to content
    </a>
  );
};
