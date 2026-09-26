import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Users,
  LayoutDashboard,
  Briefcase,
  History,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ActiveTab =
  | 'dashboard'
  | 'screen'
  | 'candidates'
  | 'jobs'
  | 'history'
  | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedCandidateId?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" strokeWidth={1.8} /> },
    { id: 'screen', label: 'Screen', icon: <FileText className="w-4 h-4" strokeWidth={1.8} /> },
    { id: 'candidates', label: 'Candidates', icon: <Users className="w-4 h-4" strokeWidth={1.8} /> },
    { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-4 h-4" strokeWidth={1.8} /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" strokeWidth={1.8} /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" strokeWidth={1.8} /> }
  ];

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2.5 group"
              onClick={() => handleNavClick('dashboard')}
              aria-label="Go to Dashboard"
            >
              <motion.div
                whileHover={{ rotate: 5 }}
                className="w-8 h-8 flex items-center justify-center font-serif italic text-sm transition-transform group-hover:scale-105"
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--color-primary-text)',
                }}
              >
                TS
              </motion.div>
              <div className="hidden sm:block">
                <span
                  className="font-serif font-semibold tracking-wide text-base block leading-none"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  TalentScreen
                </span>
              </div>
            </motion.button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavClick(item.id)}
                    className="relative flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors"
                    style={{
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      background: isActive ? 'var(--color-surface-subtle)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'var(--color-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-md"
                        style={{ borderBottom: '2px solid var(--color-primary)', opacity: 0.5 }}
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </div>

          {/* Right side: CTA + User + Logout */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavClick('screen')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold rounded-md transition-colors"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-primary-text)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Screen Resume</span>
            </motion.button>

            <div className="hidden lg:flex items-center gap-2 pl-3" style={{ borderLeft: '1px solid var(--color-border)' }}>
              <div className="text-right">
                <div className="text-[13px] font-medium leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                  {user?.name || 'Recruiter'}
                </div>
                <div
                  className="text-[10px] font-medium uppercase tracking-wider mt-0.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {user?.role === 'admin' ? 'Admin' : 'Recruiter'}
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: "var(--color-surface-hover)" }}
              whileTap={{ scale: 0.9 }}
              onClick={logout}
              title="Log out"
              className="p-1.5 rounded-md transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-muted)';
              }}
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.8} />
            </motion.button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1.5 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
            style={{
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
            }}
          >
            <nav className="max-w-[1280px] mx-auto px-4 py-2 space-y-0.5" role="navigation" aria-label="Mobile navigation">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-[13px] font-medium rounded-md transition-colors"
                    style={{
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      background: isActive ? 'var(--color-surface-subtle)' : 'transparent',
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
