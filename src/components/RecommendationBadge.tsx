import React from 'react';
import { RecommendationType, RiskScoreType, RewardScoreType } from '../types/index';

interface RecommendationBadgeProps {
  recommendation?: RecommendationType | string;
  size?: 'sm' | 'md' | 'lg';
}

const badgeConfig: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Strong Hire': {
    bg: 'var(--color-success-subtle)',
    text: '#15803d',
    border: 'var(--color-success-border)',
    dot: 'var(--color-success)',
  },
  'Shortlist': {
    bg: 'var(--color-info-subtle)',
    text: '#1d4ed8',
    border: 'var(--color-info-border)',
    dot: 'var(--color-info)',
  },
  'Consider': {
    bg: 'var(--color-warning-subtle)',
    text: '#92400e',
    border: 'var(--color-warning-border)',
    dot: 'var(--color-warning)',
  },
  'Reject': {
    bg: 'var(--color-error-subtle)',
    text: '#991b1b',
    border: 'var(--color-error-border)',
    dot: 'var(--color-error)',
  },
};

export const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({
  recommendation,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[11px]',
    md: 'px-2 py-[3px] text-xs',
    lg: 'px-3 py-1 text-[13px] font-semibold'
  }[size];

  if (!recommendation) {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-md ${sizeClasses}`}
        style={{
          background: 'var(--color-surface-subtle)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border)',
        }}
      >
        Pending
      </span>
    );
  }

  const config = badgeConfig[recommendation] || {
    bg: 'var(--color-surface-subtle)',
    text: 'var(--color-text-secondary)',
    border: 'var(--color-border)',
    dot: 'var(--color-text-muted)',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md ${sizeClasses}`}
      style={{
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 mr-1.5 rounded-full"
        style={{ background: config.dot }}
      />
      {recommendation}
    </span>
  );
};

const riskColors: Record<string, { bg: string; text: string; border: string }> = {
  Low: {
    bg: 'var(--color-success-subtle)',
    text: '#15803d',
    border: 'var(--color-success-border)',
  },
  Medium: {
    bg: 'var(--color-warning-subtle)',
    text: '#92400e',
    border: 'var(--color-warning-border)',
  },
  High: {
    bg: 'var(--color-error-subtle)',
    text: '#991b1b',
    border: 'var(--color-error-border)',
  },
};

const rewardColors: Record<string, { bg: string; text: string; border: string }> = {
  High: {
    bg: 'var(--color-success-subtle)',
    text: '#15803d',
    border: 'var(--color-success-border)',
  },
  Medium: {
    bg: 'var(--color-info-subtle)',
    text: '#1d4ed8',
    border: 'var(--color-info-border)',
  },
  Low: {
    bg: 'var(--color-surface-subtle)',
    text: 'var(--color-text-secondary)',
    border: 'var(--color-border-strong)',
  },
};

export const ScoreBadge: React.FC<{
  type: 'risk' | 'reward';
  score?: RiskScoreType | RewardScoreType | string;
}> = ({ type, score }) => {
  if (!score) {
    return (
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        N/A
      </span>
    );
  }

  const colors = type === 'risk'
    ? (riskColors[score] || riskColors.Low)
    : (rewardColors[score] || rewardColors.Low);

  return (
    <span
      className="inline-flex items-center px-2 py-[3px] rounded-md text-[11px] font-semibold"
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {score} {type === 'risk' ? 'Risk' : 'Reward'}
    </span>
  );
};
