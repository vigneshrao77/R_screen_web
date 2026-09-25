"use client";

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar, ActiveTab } from '../components/Navbar';
import { Dashboard } from '../components/Dashboard';
import { ScreenResumes } from '../components/ScreenResumes';
import { CandidateList } from '../components/CandidateList';
import { CandidateDetail } from '../components/CandidateDetail';
import { JobCriteria } from '../components/JobCriteria';
import { ScreeningHistory } from '../components/ScreeningHistory';
import { WorkflowSettings } from '../components/WorkflowSettings';
import { AuditLogView } from '../components/AuditLogView';
import { LoginView } from '../components/LoginView';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--color-text-muted)' }}>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Verifying authorization…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
  };

  const handleBackFromDetail = () => {
    setSelectedCandidateId(null);
  };

  const handleNavigateTab = (tab: ActiveTab) => {
    setSelectedCandidateId(null);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        selectedCandidateId={selectedCandidateId}
      />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {selectedCandidateId ? (
          <CandidateDetail
            screeningId={selectedCandidateId}
            onBack={handleBackFromDetail}
            onDeleted={handleBackFromDetail}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                onSelectCandidate={handleSelectCandidate}
                onNavigateToScreen={() => setActiveTab('screen')}
                onNavigateToCandidates={() => setActiveTab('candidates')}
              />
            )}

            {activeTab === 'screen' && (
              <ScreenResumes
                onScreeningComplete={(id) => {
                  setSelectedCandidateId(id);
                }}
                onViewCandidate={(id) => {
                  setSelectedCandidateId(id);
                }}
              />
            )}

            {activeTab === 'candidates' && (
              <CandidateList
                onSelectCandidate={handleSelectCandidate}
                onNavigateToScreen={() => setActiveTab('screen')}
              />
            )}

            {activeTab === 'jobs' && <JobCriteria />}

            {activeTab === 'history' && (
              <ScreeningHistory onSelectCandidate={handleSelectCandidate} />
            )}

            {activeTab === 'settings' && <WorkflowSettings />}

            {/* Default to settings for old audit routing temporarily if caught */}
            {activeTab === 'audit' as any && <WorkflowSettings />}
          </>
        )}
      </main>

      <footer
        className="mt-auto"
        style={{
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            TalentScreen Platform
          </span>
          <span
            className="text-[10px] font-medium uppercase tracking-[0.15em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            v2.0 Beta
          </span>
        </div>
      </footer>
    </div>
  );
}
