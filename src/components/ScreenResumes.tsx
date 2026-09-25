import React, { useState, useEffect, useRef } from 'react';
import { JobDescription } from '../types/index';
import { api } from '../services/api';
import {
  ArrowRight,
  Upload,
  FileText,
  AlertTriangle,
  Check,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';

interface ScreenResumesProps {
  onScreeningComplete: (screeningId: string) => void;
  onViewCandidate: (screeningId: string) => void;
}

export const ScreenResumes: React.FC<ScreenResumesProps> = ({
  onScreeningComplete,
  onViewCandidate
}) => {
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [duplicateWarning, setDuplicateWarning] = useState<{
    message: string;
    existingCandidate: any;
    existingScreeningId?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await api.getJobs();
        setJobs(data);
        if (data.length > 0) {
          setSelectedJobId(data[0].id);
        }
      } catch (err: any) {
        setError('Failed to load job descriptions: ' + err.message);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf') && selected.type !== 'application/pdf') {
        setError('Please select a valid PDF resume (.pdf).');
        return;
      }
      setFile(selected);
      setError(null);

      if (!fullName) {
        const suggestedName = selected.name
          .replace(/\.pdf$/i, '')
          .replace(/[-_]/g, ' ')
          .replace(/resume|cv/gi, '')
          .trim();
        if (suggestedName) {
          setFullName(suggestedName);
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (!dropped.name.toLowerCase().endsWith('.pdf') && dropped.type !== 'application/pdf') {
        setError('Only PDF resumes (.pdf) are supported.');
        return;
      }
      setFile(dropped);
      setError(null);
      if (!fullName) {
        const suggestedName = dropped.name
          .replace(/\.pdf$/i, '')
          .replace(/[-_]/g, ' ')
          .replace(/resume|cv/gi, '')
          .trim();
        if (suggestedName) {
          setFullName(suggestedName);
        }
      }
    }
  };

  const loadSampleCandidate = (sampleType: 'senior' | 'mid' | 'junior') => {
    let name = 'Alex Morgan';
    let sampleEmail = 'alex.morgan@example.com';
    let samplePhone = '+1 (415) 890-2341';
    let resumeContent = '';

    if (sampleType === 'senior') {
      name = 'David Chen';
      sampleEmail = 'david.chen.ai@example.com';
      samplePhone = '+1 (650) 432-8899';
      resumeContent = `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n4 0 obj << /Length 620 >> stream\nBT\n/F1 12 Tf\n40 750 Td (David Chen - Senior Generative AI Engineer) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000280 00000 n \n0000000214 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n950\n%%EOF`;
    } else if (sampleType === 'mid') {
      name = 'Elena Rostova';
      sampleEmail = 'elena.rostova@example.com';
      samplePhone = '+1 (206) 555-0192';
      resumeContent = `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n4 0 obj << /Length 580 >> stream\nBT\n/F1 12 Tf\n40 750 Td (Elena Rostova - Python Backend Developer) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000280 00000 n \n0000000214 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n910\n%%EOF`;
    } else {
      name = 'Marcus Taylor';
      sampleEmail = 'marcus.taylor.dev@example.com';
      samplePhone = '+1 (512) 887-3310';
      resumeContent = `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n4 0 obj << /Length 520 >> stream\nBT\n/F1 12 Tf\n40 750 Td (Marcus Taylor - Frontend Junior Developer) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000280 00000 n \n0000000214 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n850\n%%EOF`;
    }

    const blob = new Blob([resumeContent], { type: 'application/pdf' });
    const sampleFile = new File([blob], `${name.replace(/\s+/g, '_')}_Resume.pdf`, {
      type: 'application/pdf'
    });

    setFullName(name);
    setEmail(sampleEmail);
    setPhone(samplePhone);
    setFile(sampleFile);
    setError(null);
    setDuplicateWarning(null);
  };

  const handleStartScreening = async (allowDuplicate = false) => {
    if (!file) {
      setError('A candidate PDF resume is required.');
      return;
    }
    if (!email.trim()) {
      setError('An email address is required.');
      return;
    }
    if (!selectedJobId) {
      setError('A target job role must be selected.');
      return;
    }

    setError(null);
    setDuplicateWarning(null);
    setProcessing(true);
    setCurrentStep(1);

    const timer1 = setTimeout(() => setCurrentStep(2), 1200);
    const timer2 = setTimeout(() => setCurrentStep(3), 2800);
    const timer3 = setTimeout(() => setCurrentStep(4), 4500);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('fullName', fullName.trim());
    formData.append('email', email.trim());
    formData.append('phone', phone.trim());
    formData.append('jobId', selectedJobId);
    if (allowDuplicate) {
      formData.append('allowDuplicate', 'true');
    }

    try {
      const result = await api.uploadAndScreen(formData);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setCurrentStep(5);

      setTimeout(() => {
        onScreeningComplete(result.id);
      }, 700);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setProcessing(false);
      setCurrentStep(0);

      if (err.status === 409 && err.data?.duplicate) {
        setDuplicateWarning({
          message: err.data.message || 'Candidate already exists',
          existingCandidate: err.data.existingCandidate,
          existingScreeningId: err.data.existingScreeningId
        });
      } else {
        setError(err.message || 'Screening failed. Please check the file and try again.');
      }
    }
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  /* ── Processing state ───────────────────────────────────────── */
  if (processing) {
    const steps = [
      'Ingesting document & validating structure',
      'Extracting semantic context & timeline',
      'Initiating automated workflows',
      'Synthesizing evaluation & preparing report',
    ];

    return (
      <div className="max-w-lg mx-auto py-16">
        <div
          className="rounded-xl p-8"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div className="flex items-start gap-4">
            <RefreshCw className="w-5 h-5 animate-spin shrink-0 mt-0.5" style={{ color: 'var(--color-text-primary)' }} />
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Evaluating candidate
              </h2>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Screening against {selectedJob?.title || 'selected role'}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4 pl-2" style={{ borderLeft: '2px solid var(--color-border)' }}>
            {steps.map((label, i) => {
              const stepNum = i + 1;
              const isDone = currentStep > stepNum;
              const isActive = currentStep >= stepNum;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 pl-4 transition-opacity duration-300"
                  style={{ opacity: isActive ? 1 : 0.3 }}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ border: '1.5px solid var(--color-border-strong)' }}
                    />
                  )}
                  <span
                    className="text-[13px]"
                    style={{
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ── Main upload form ───────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div
          className="mb-6 p-3 rounded-lg text-sm flex items-center gap-2"
          style={{
            background: 'var(--color-error-subtle)',
            border: '1px solid var(--color-error-border)',
            color: 'var(--color-error)',
          }}
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {duplicateWarning && (
        <div
          className="mb-6 p-5 rounded-lg"
          style={{
            background: 'var(--color-warning-subtle)',
            border: '1px solid var(--color-warning-border)',
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
            <div className="flex-1">
              <h4 className="text-[14px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Candidate already exists
              </h4>
              <p className="text-[13px] mt-1 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                A candidate with email <strong>{email}</strong> ({duplicateWarning.existingCandidate?.fullName}) is already in the system.
              </p>
              <div className="flex items-center gap-3">
                {duplicateWarning.existingScreeningId && (
                  <button
                    onClick={() => onViewCandidate(duplicateWarning.existingScreeningId!)}
                    className="px-4 py-2 rounded-md text-[13px] font-semibold transition-colors"
                    style={{
                      background: 'var(--color-primary)',
                      color: 'var(--color-primary-text)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
                  >
                    View Existing Record
                  </button>
                )}
                <button
                  onClick={() => handleStartScreening(true)}
                  className="px-4 py-2 rounded-md text-[13px] font-semibold transition-colors"
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                >
                  Screen Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="grid grid-cols-1 lg:grid-cols-12 rounded-xl overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Left Column: Context */}
        <div
          className="lg:col-span-4 p-6 lg:p-8 flex flex-col"
          style={{
            background: 'var(--color-surface-subtle)',
            borderRight: 'none',
          }}
        >
          <div className="mb-8">
            <h1 className="text-xl font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              Screen Candidate
            </h1>
            <p className="text-[13px] mt-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              Upload a resume to generate an AI-powered evaluation against the selected role.
            </p>
          </div>

          <div className="mb-8">
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Target Position
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full py-2 px-0 text-[15px] font-medium bg-transparent appearance-none cursor-pointer transition-colors"
              style={{
                color: 'var(--color-text-primary)',
                borderBottom: '2px solid var(--color-border)',
                outline: 'none',
                borderRadius: 0,
              }}
              onFocus={(e) => e.currentTarget.style.borderBottomColor = 'var(--color-primary)'}
              onBlur={(e) => e.currentTarget.style.borderBottomColor = 'var(--color-border)'}
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>

            {selectedJob && (
              <div className="mt-3 space-y-1">
                <div className="text-[12px] flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="w-1 h-1 rounded-full" style={{ background: 'var(--color-text-muted)' }} />
                  <span>{selectedJob.experienceLevel}</span>
                </div>
                <div className="text-[12px] flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="w-1 h-1 rounded-full" style={{ background: 'var(--color-text-muted)' }} />
                  <span>{selectedJob.location}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sample Candidates */}
          <div
            className="mt-auto pt-6"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
              <Zap className="w-3 h-3" />
              <span>Sample Candidates</span>
            </div>
            <div className="space-y-1">
              {[
                { type: 'senior' as const, label: 'David Chen — AI Engineer' },
                { type: 'mid' as const, label: 'Elena Rostova — Backend' },
                { type: 'junior' as const, label: 'Marcus Taylor — Frontend' },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => loadSampleCandidate(type)}
                  className="w-full text-left px-3 py-2 text-[13px] font-medium rounded-md flex justify-between items-center transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{label}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100" style={{ opacity: 0 }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Upload & Form */}
        <div className="lg:col-span-8 p-6 lg:p-8 flex flex-col" style={{ borderLeft: '1px solid var(--color-border)' }}>
          <div className="space-y-6 flex-1">
            {/* Dropzone */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Resume Upload
                </label>
                <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  PDF only
                </span>
              </div>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg p-8 text-center cursor-pointer transition-all duration-200"
                style={{
                  border: `2px dashed ${file ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: file ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: file ? 'var(--color-primary-text)' : 'var(--color-text-primary)',
                }}
                onMouseEnter={(e) => {
                  if (!file) e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                }}
                onMouseLeave={(e) => {
                  if (!file) e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
                role="button"
                tabIndex={0}
                aria-label="Upload resume PDF"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-hidden="true"
                />

                {file ? (
                  <div className="flex flex-col items-center">
                    <FileText className="w-10 h-10 mb-3 opacity-80" strokeWidth={1.5} />
                    <div className="text-[15px] font-semibold truncate max-w-[80%]">{file.name}</div>
                    <div className="text-[12px] mt-1 opacity-60">
                      {(file.size / 1024).toFixed(1)} KB · Ready
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-10 h-10 mb-3 opacity-30" strokeWidth={1.5} />
                    <div className="text-[15px] font-medium">
                      Drop resume here or click to browse
                    </div>
                    <div className="text-[12px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      PDF files only
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Candidate Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div className="sm:col-span-2">
                <label
                  className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Full Name <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full py-2 text-[15px] bg-transparent transition-colors"
                  style={{
                    color: 'var(--color-text-primary)',
                    borderBottom: '1.5px solid var(--color-border)',
                    outline: 'none',
                    borderRadius: 0,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderBottomColor = 'var(--color-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderBottomColor = 'var(--color-border)'}
                  placeholder="Candidate name"
                />
              </div>

              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Email <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-2 text-[15px] bg-transparent transition-colors"
                  style={{
                    color: 'var(--color-text-primary)',
                    borderBottom: '1.5px solid var(--color-border)',
                    outline: 'none',
                    borderRadius: 0,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderBottomColor = 'var(--color-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderBottomColor = 'var(--color-border)'}
                  placeholder="name@domain.com"
                />
              </div>

              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full py-2 text-[15px] bg-transparent transition-colors"
                  style={{
                    color: 'var(--color-text-primary)',
                    borderBottom: '1.5px solid var(--color-border)',
                    outline: 'none',
                    borderRadius: 0,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderBottomColor = 'var(--color-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderBottomColor = 'var(--color-border)'}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Action footer */}
          <div
            className="mt-10 pt-5 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <div className="hidden sm:flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              <Info className="w-3.5 h-3.5" />
              <span>Evaluation takes approximately 5 seconds.</span>
            </div>

            <button
              type="button"
              onClick={() => handleStartScreening(false)}
              disabled={!file || !email.trim()}
              className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold rounded-md transition-all"
              style={{
                background: file && email.trim() ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                color: file && email.trim() ? 'var(--color-primary-text)' : 'var(--color-text-muted)',
                cursor: file && email.trim() ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => {
                if (file && email.trim()) e.currentTarget.style.background = 'var(--color-primary-hover)';
              }}
              onMouseLeave={(e) => {
                if (file && email.trim()) e.currentTarget.style.background = 'var(--color-primary)';
              }}
            >
              <span>Start Screening</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
