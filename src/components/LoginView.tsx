import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('recruiter@company.com');
  const [password, setPassword] = useState('Recruiter2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your work email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (type: 'lead' | 'senior') => {
    if (type === 'lead') {
      setEmail('recruiter@company.com');
      setPassword('Recruiter2026!');
    } else {
      setEmail('sarah.jenkins@company.com');
      setPassword('Recruiter2026!');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--color-bg)' }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px]"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div
            className="w-10 h-10 mx-auto flex items-center justify-center font-serif italic text-sm rounded-lg mb-4"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-primary-text)',
            }}
          >
            TS
          </div>
          <h1
            className="text-xl font-semibold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Sign in to TalentScreen
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            AI-powered resume screening platform
          </p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-xl p-6 sm:p-8"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {error && (
            <div
              className="mb-5 p-3 rounded-lg text-sm flex items-start gap-2"
              style={{
                background: 'var(--color-error-subtle)',
                border: '1px solid var(--color-error-border)',
                color: 'var(--color-error)',
              }}
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg transition-colors"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg transition-colors"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-primary-text)',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--color-primary-hover)' }}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
            >
              <span>{loading ? 'Signing in…' : 'Sign in'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </motion.button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider block mb-3"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFillDemo('lead')}
                className="p-2.5 text-left rounded-lg transition-colors"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
              >
                <div className="text-[12px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Lead Recruiter
                </div>
                <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  recruiter@company.com
                </div>
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFillDemo('senior')}
                className="p-2.5 text-left rounded-lg transition-colors"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
              >
                <div className="text-[12px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Sarah Jenkins
                </div>
                <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  sarah.jenkins@…
                </div>
              </motion.button>
            </div>
            <p className="text-[11px] mt-2.5 text-center" style={{ color: 'var(--color-text-muted)' }}>
              Password: <code
                className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)' }}
              >Recruiter2026!</code>
            </p>
          </div>
        </div>

        {/* Security note */}
        <div className="text-center mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Encrypted session authentication
          </span>
        </div>
      </motion.div>
    </div>
  );
};
