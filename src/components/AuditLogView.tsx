import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types/index';
import { api } from '../services/api';
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setError(null);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Audit Log
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Activity trail of recruiter actions and candidate evaluations.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors self-start sm:self-auto"
          style={{
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </motion.button>
      </div>

      {error && (
        <div
          className="p-3 rounded-lg text-sm flex items-center gap-2"
          style={{
            background: 'var(--color-error-subtle)',
            border: '1px solid var(--color-error-border)',
            color: 'var(--color-error)',
          }}
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--color-text-muted)' }}>
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">Loading audit trail…</span>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)' }}>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Timestamp</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>User</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Action</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Entity</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Details</th>
                </tr>
              </thead>
              <motion.tbody
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 }
                  }
                }}
              >
                {logs.map(log => (
                  <motion.tr
                    key={log.id}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      show: { opacity: 1, x: 0 }
                    }}
                    className="transition-colors text-[12px]"
                    style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="py-2.5 px-4 whitespace-nowrap font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {log.recruiterEmail}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className="inline-block px-1.5 py-0.5 rounded-md font-mono text-[11px] font-medium"
                        style={{
                          background: 'var(--color-surface-subtle)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 uppercase font-mono text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      {log.entityType}
                    </td>
                    <td className="py-2.5 px-4 max-w-md truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {log.details}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <ShieldCheck className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-border-strong)' }} />
            <p className="text-[14px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              No audit activity yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
