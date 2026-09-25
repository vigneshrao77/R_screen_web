import React, { useState, useEffect } from 'react';
import { JobDescription } from '../types/index';
import { api } from '../services/api';
import {
  Plus,
  AlertCircle,
  RefreshCw,
  MapPin,
  Clock,
  Layers
} from 'lucide-react';

export const JobCriteria: React.FC = () => {
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Job Form State
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('Remote / Hybrid');
  const [newExp, setNewExp] = useState('2-5 Years');
  const [newOverview, setNewOverview] = useState('');
  const [newRequiredSkills, setNewRequiredSkills] = useState('');
  const [newPreferredSkills, setNewPreferredSkills] = useState('');
  const [newResponsibilities, setNewResponsibilities] = useState('');
  const [newEducation, setNewEducation] = useState("Bachelor's degree in CS, IT, or equivalent experience.");
  const [saving, setSaving] = useState(false);

  const fetchJobs = async () => {
    try {
      setError(null);
      const data = await api.getJobs();
      setJobs(data);
      if (data.length > 0 && !selectedJob) {
        setSelectedJob(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load job descriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Job title is required');
      return;
    }

    setSaving(true);
    try {
      const created = await api.createJob({
        title: newTitle.trim(),
        location: newLocation.trim(),
        experienceLevel: newExp.trim(),
        roleOverview: newOverview.trim(),
        requiredSkills: newRequiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        preferredSkills: newPreferredSkills.split(',').map(s => s.trim()).filter(Boolean),
        responsibilities: newResponsibilities.split('\n').map(r => r.trim()).filter(Boolean),
        education: newEducation.trim(),
        active: true
      });

      setJobs(prev => [created, ...prev]);
      setSelectedJob(created);
      setShowCreateModal(false);
      // Reset form
      setNewTitle('');
      setNewOverview('');
      setNewRequiredSkills('');
      setNewPreferredSkills('');
      setNewResponsibilities('');
    } catch (err: any) {
      alert('Failed to save job description: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyles: React.CSSProperties = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
    outline: 'none',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--color-text-muted)' }}>
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm">Loading job criteria…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Job Criteria
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Define role requirements and skills used by the AI screening agent.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-colors self-start sm:self-auto"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-primary-text)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Job</span>
        </button>
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

      {/* Grid: Roles List + Detail */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Roles Sidebar */}
        <div
          className="rounded-lg overflow-hidden self-start"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            className="px-4 py-2.5"
            style={{
              background: 'var(--color-surface-subtle)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Roles ({jobs.length})
            </span>
          </div>

          <div className="divide-y max-h-[600px] overflow-y-auto" style={{ borderColor: 'var(--color-border-subtle)' }}>
            {jobs.map(j => {
              const isSelected = selectedJob?.id === j.id;
              return (
                <div
                  key={j.id}
                  onClick={() => setSelectedJob(j)}
                  className="p-3.5 cursor-pointer transition-colors"
                  style={{
                    background: isSelected ? 'var(--color-surface-subtle)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--color-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{j.title}</div>
                  <div className="text-[12px] mt-1 flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    <span>{j.experienceLevel}</span>
                    <span>·</span>
                    <span>{j.location}</span>
                  </div>
                  <div className="text-[11px] mt-1.5 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                    {j.roleOverview}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Job Details */}
        <div className="md:col-span-2">
          {selectedJob ? (
            <div
              className="rounded-lg p-5 space-y-5"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {selectedJob.title}
                  </h2>
                  <span
                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
                    style={{
                      background: 'var(--color-success-subtle)',
                      color: '#15803d',
                      border: '1px solid var(--color-success-border)',
                    }}
                  >
                    Active
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-2 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedJob.location}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedJob.experienceLevel}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span className="font-mono text-[11px]">{selectedJob.id.slice(0, 8)}…</span>
                  </span>
                </div>
              </div>

              {/* Role Overview */}
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Overview
                </h3>
                <p
                  className="text-[13px] leading-relaxed p-3 rounded-md"
                  style={{
                    background: 'var(--color-surface-subtle)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                >
                  {selectedJob.roleOverview}
                </p>
              </div>

              {/* Responsibilities */}
              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Key Responsibilities
                  </h3>
                  <ul className="space-y-1.5 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedJob.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span style={{ color: 'var(--color-text-muted)' }}>•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Required Skills */}
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.requiredSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-[12px] font-medium rounded-md"
                      style={{
                        background: 'var(--color-surface-subtle)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferred Skills */}
              {selectedJob.preferredSkills && selectedJob.preferredSkills.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Preferred Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.preferredSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-[12px] font-medium rounded-md"
                        style={{
                          background: 'var(--color-surface)',
                          color: 'var(--color-text-muted)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        + {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education & Mindset */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    Education
                  </h3>
                  <p className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedJob.education || 'CS / IT Degree or equivalent'}
                  </p>
                </div>
                {selectedJob.whatWeLookFor && (
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      Ideal Profile
                    </h3>
                    <p className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                      {selectedJob.whatWeLookFor}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="rounded-lg p-8 text-center"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
            >
              Select a job to view its specifications
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <div
            className="rounded-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            style={{
              background: 'var(--color-surface)',
              boxShadow: 'var(--shadow-lg)',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-job-title"
          >
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 id="create-job-title" className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Add Job Criteria
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[13px] font-semibold transition-colors p-1"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <FormField label="Job Title *" required>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Senior Machine Learning Engineer"
                  className="w-full px-3 py-2 text-[13px] rounded-md"
                  style={inputStyles}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Location">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] rounded-md"
                    style={inputStyles}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  />
                </FormField>
                <FormField label="Experience Level">
                  <input
                    type="text"
                    value={newExp}
                    onChange={(e) => setNewExp(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] rounded-md"
                    style={inputStyles}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  />
                </FormField>
              </div>

              <FormField label="Role Overview">
                <textarea
                  rows={2}
                  value={newOverview}
                  onChange={(e) => setNewOverview(e.target.value)}
                  placeholder="Brief description of the position…"
                  className="w-full px-3 py-2 text-[13px] rounded-md resize-none"
                  style={inputStyles}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
              </FormField>

              <FormField label="Required Skills (comma-separated) *">
                <input
                  type="text"
                  required
                  value={newRequiredSkills}
                  onChange={(e) => setNewRequiredSkills(e.target.value)}
                  placeholder="Python, PyTorch, Docker, SQL, FastAPI"
                  className="w-full px-3 py-2 text-[13px] rounded-md"
                  style={inputStyles}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
              </FormField>

              <FormField label="Preferred Skills (comma-separated)">
                <input
                  type="text"
                  value={newPreferredSkills}
                  onChange={(e) => setNewPreferredSkills(e.target.value)}
                  placeholder="Kubernetes, AWS, LangChain"
                  className="w-full px-3 py-2 text-[13px] rounded-md"
                  style={inputStyles}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
              </FormField>

              <FormField label="Key Responsibilities (one per line)">
                <textarea
                  rows={3}
                  value={newResponsibilities}
                  onChange={(e) => setNewResponsibilities(e.target.value)}
                  placeholder={"Build production models\nDeploy REST APIs\nCollaborate with product team"}
                  className="w-full px-3 py-2 text-[13px] rounded-md resize-none"
                  style={inputStyles}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
              </FormField>

              <div className="pt-3 flex items-center justify-end gap-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-colors"
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors disabled:opacity-50"
                  style={{
                    background: 'var(--color-primary)',
                    color: 'var(--color-primary-text)',
                  }}
                  onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = 'var(--color-primary-hover)' }}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
                >
                  {saving ? 'Saving…' : 'Save Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Helper ───────────────────────────────────────────────────── */

const FormField: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div>
    <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
      {label}
    </label>
    {children}
  </div>
);
