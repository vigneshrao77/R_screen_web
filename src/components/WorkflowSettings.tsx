import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../types/index';
import { api } from '../services/api';
import {
  GitBranch,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Bot,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const WorkflowSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'architecture' | 'webhook' | 'schema'>('architecture');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
        setWebhookUrl(data.n8nWebhookUrl || '');
        setEnabled(data.n8nEnabled);
      } catch (err: any) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTestResult(null);
    try {
      const updated = await api.updateSettings({
        n8nWebhookUrl: webhookUrl.trim(),
        n8nEnabled: enabled
      });
      setSettings(updated);
      alert('Workflow configuration saved successfully.');
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!webhookUrl.trim()) {
      alert('Please enter an n8n webhook URL to test.');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testN8nConnection(webhookUrl.trim());
      setTestResult({
        success: res.success,
        message: res.message
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const tabItems = [
    { id: 'architecture' as const, label: 'Architecture' },
    { id: 'webhook' as const, label: 'Webhook' },
    { id: 'schema' as const, label: 'Schema' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--color-text-muted)' }}>
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm">Loading configuration…</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Settings & Integration
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            n8n workflow configuration and integration architecture.
          </p>
        </div>

        {/* Tab toggle */}
        <div
          className="flex rounded-lg p-0.5 self-start sm:self-auto"
          style={{
            background: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
          }}
        >
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors"
              style={{
                background: activeTab === tab.id ? 'var(--color-surface)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                boxShadow: activeTab === tab.id ? 'var(--shadow-xs)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB: Architecture */}
      <AnimatePresence mode="wait">
        {activeTab === 'architecture' && (
          <motion.div
            key="architecture"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div
              className="rounded-lg p-5 space-y-4"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
            <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Execution Pipeline
            </h2>

            <div
              className="p-3 rounded-md font-mono text-[12px] leading-relaxed overflow-x-auto"
              style={{
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Recruiter → Website → Backend → Database → n8n → PDF extraction → Gemini AI → Structured Output → Database → Website
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <PipelineCard
                icon={<Server className="w-4 h-4" />}
                title="1. Recruiter & Backend"
                description="Recruiter uploads PDF resume and target criteria. Backend checks duplicates, secures files, and creates persistent screening records."
              />
              <PipelineCard
                icon={<GitBranch className="w-4 h-4" />}
                title="2. n8n Workflow"
                description="n8n handles applicant notification via Gmail and writes candidate profiles directly to the Notion database."
              />
              <PipelineCard
                icon={<Bot className="w-4 h-4" />}
                title="3. Gemini AI Agent"
                description="Server invokes Gemini 3.8 Flash using the n8n system prompt and JSON Schema parser to generate ATS score, fit rating, and risk analysis."
              />
            </div>
          </div>

          {/* Workflow nodes */}
          <div
            className="rounded-lg p-5 space-y-4"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <h2 className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              n8n Nodes & Credentials
            </h2>

            <div className="space-y-0">
              <NodeRow
                name="On form submission"
                detail="n8n-nodes-base.formTrigger (webhookId: bd7c0530-…)"
                tag="Fullname, Email, Phone, Resume"
              />
              <NodeRow
                name="Job application (Google Drive)"
                detail="fileId: 1dGbWK9lEBzbqTcGOsO9zfYbV1sMvNja-"
                tag="AI Engineer Job Description"
              />
              <NodeRow
                name="AI Agent & Gemini Chat Model"
                detail="@n8n/n8n-nodes-langchain.agent"
                tag="Structured Output (17 fields)"
              />
              <NodeRow
                name="Send a message (Gmail)"
                detail="Kept inside n8n as requested"
                tag="To: candidate email"
              />
              <NodeRow
                name="Create database page (Notion)"
                detail="Database: 39d18f57-c856-80e8-…"
                tag="Job applicants table"
                isLast
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB: Webhook */}
      {activeTab === 'webhook' && (
        <motion.div
          key="webhook"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-lg p-5 space-y-5"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              n8n Webhook Configuration
            </h2>
            <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Configure your n8n webhook URL to receive candidate submissions, trigger emails, and sync Notion.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Webhook URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-n8n-instance.com/webhook/…"
                  className="flex-1 px-3 py-2.5 text-[13px] font-mono rounded-md transition-colors"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-3.5 py-2.5 rounded-md text-[13px] font-medium transition-colors disabled:opacity-50"
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-subtle)',
                    color: 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={(e) => { if (!testing) e.currentTarget.style.background = 'var(--color-surface-hover)' }}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                >
                  {testing ? 'Testing…' : 'Test Connection'}
                </motion.button>
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Webhook ID: <code className="font-mono text-[10px]">bd7c0530-5e43-4c40-ac51-e8c1c087e6ec</code>
              </p>
            </div>

            {testResult && (
              <div
                className="p-3 rounded-lg text-[13px] flex items-center gap-2"
                style={{
                  background: testResult.success ? 'var(--color-success-subtle)' : 'var(--color-error-subtle)',
                  border: `1px solid ${testResult.success ? 'var(--color-success-border)' : 'var(--color-error-border)'}`,
                  color: testResult.success ? '#15803d' : 'var(--color-error)',
                }}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                id="n8nEnabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{
                  accentColor: 'var(--color-primary)',
                }}
              />
              <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Trigger n8n webhook on each resume screening
              </span>
            </label>

            <div className="pt-4 flex justify-end" style={{ borderTop: '1px solid var(--color-border)' }}>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={saving}
                className="px-4 py-2 rounded-md text-[13px] font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--color-primary-text)',
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = 'var(--color-primary-hover)' }}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
              >
                {saving ? 'Saving…' : 'Save Configuration'}
              </motion.button>
            </div>
          </form>
        </motion.div>
        )}

        {/* TAB: Schema */}
        {activeTab === 'schema' && (
          <motion.div
            key="schema"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg p-5 space-y-4"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Structured Output Schema
              </h2>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                The 17-field JSON schema used by the Structured Output Parser node.
              </p>
            </div>
            <span
              className="px-2 py-1 text-[11px] font-mono rounded-md"
              style={{
                background: 'var(--color-surface-subtle)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              17 Fields
            </span>
          </div>

          <pre
            className="p-4 rounded-lg text-[12px] font-mono overflow-x-auto max-h-[500px] leading-relaxed"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-primary-text)',
            }}
          >
{`{
  "candidate_name": "string (Full name extracted from resume)",
  "job_title": "string (Job title from job description)",
  "candidate_summary": "string (2-3 sentences summary)",
  "matched_skills": ["string (Skills in BOTH resume and job)"],
  "missing_skills": ["string (Skills required by job but missing)"],
  "additional_skills": ["string (Extra skills in resume)"],
  "strengths": ["string (Top qualifications supported by evidence)"],
  "weaknesses": ["string (Genuine gaps without inventing)"],
  "experience_match": "string (Years of experience & alignment)",
  "education_match": "string (Degree and coursework satisfaction)",
  "risk_assessment": {
    "risk_score": "Low | Medium | High",
    "reason": "string (Worst-case scenario explanation)"
  },
  "reward_assessment": {
    "reward_score": "Low | Medium | High",
    "reason": "string (Potential value unlocked)"
  },
  "overall_fit_rating": "integer (0 to 10)",
  "ats_score": "integer (0 to 100)",
  "recommendation": "Reject | Consider | Shortlist | Strong Hire",
  "interview_questions": ["string (5 targeted interview questions)"],
  "justification": "string (Evidence-based rating explanation)"
}`}
          </pre>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

/* ── Helper Components ────────────────────────────────────────── */

const PipelineCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div
    className="p-4 rounded-md space-y-2"
    style={{
      background: 'var(--color-surface-subtle)',
      border: '1px solid var(--color-border-subtle)',
    }}
  >
    <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{icon}</span>
      <span>{title}</span>
    </div>
    <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
      {description}
    </p>
  </div>
);

const NodeRow: React.FC<{
  name: string;
  detail: string;
  tag: string;
  isLast?: boolean;
}> = ({ name, detail, tag, isLast }) => (
  <div
    className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 text-[12px]"
    style={{
      borderBottom: isLast ? 'none' : '1px solid var(--color-border-subtle)',
    }}
  >
    <div>
      <span className="font-medium block" style={{ color: 'var(--color-text-primary)' }}>{name}</span>
      <span style={{ color: 'var(--color-text-muted)' }}>{detail}</span>
    </div>
    <span
      className="font-mono text-[11px] px-2 py-0.5 rounded-md shrink-0"
      style={{
        background: 'var(--color-surface-subtle)',
        color: 'var(--color-text-muted)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      {tag}
    </span>
  </div>
);
