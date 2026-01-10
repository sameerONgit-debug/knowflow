// src/components/KnowledgeCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  GitBranch,
  AlertTriangle,
  Lightbulb,
  MoreHorizontal,
  Clock,
  User,
} from 'lucide-react';

interface KnowledgeCardData {
  id: string;
  title: string;
  description: string;
  type: 'decision' | 'workflow' | 'risk' | 'insight';
  confidence: number;
  source: string;
  timestamp: string;
  tags?: string[];
}

interface KnowledgeCardProps {
  card: KnowledgeCardData;
  index: number;
}

const typeConfig = {
  decision: {
    icon: Check,
    label: 'Decision',
    accentClass: 'card-accent card-accent-green',
    badgeClass: 'badge-green',
  },
  workflow: {
    icon: GitBranch,
    label: 'Workflow',
    accentClass: 'card-accent',
    badgeClass: 'badge-indigo',
  },
  risk: {
    icon: AlertTriangle,
    label: 'Risk',
    accentClass: 'card-accent card-accent-amber',
    badgeClass: 'badge-amber',
  },
  insight: {
    icon: Lightbulb,
    label: 'Insight',
    accentClass: 'card-accent card-accent-cyan',
    badgeClass: 'badge-cyan',
  },
};

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ card, index }) => {
  const config = typeConfig[card.type];
  const Icon = config.icon;

  // Confidence opacity
  const confidenceClass = card.confidence >= 0.8
    ? 'confidence-high'
    : card.confidence >= 0.5
      ? 'confidence-medium'
      : 'confidence-low';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={`${config.accentClass} hover:bg-[var(--depth-2)] transition-colors cursor-pointer group`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`badge ${config.badgeClass}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
          <span className="mono text-[10px] text-[var(--text-muted)]">
            conf: {(card.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[rgba(255,255,255,0.06)] transition-all">
          <MoreHorizontal className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>

      {/* Content */}
      <h3 className={`text-sm font-medium text-[var(--text-primary)] mb-2 ${confidenceClass}`}>
        {card.title}
      </h3>
      <p className="text-xs text-[var(--text-tertiary)] leading-relaxed truncate-2 mb-3">
        {card.description}
      </p>

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {card.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 bg-[var(--depth-2)] rounded text-[var(--text-muted)]">
              {tag}
            </span>
          ))}
          {card.tags.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 text-[var(--text-muted)]">
              +{card.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {card.source}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {card.timestamp}
          </span>
        </div>
      </div>
    </motion.div>
  );
};