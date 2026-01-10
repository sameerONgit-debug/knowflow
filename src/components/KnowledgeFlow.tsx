// src/components/KnowledgeFlow.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronRight,
  User,
  FileText,
  Lightbulb,
  ArrowLeft,
} from 'lucide-react';
import { flowSteps } from '../data/mockdata';
import { Button } from './ui/Button';

interface KnowledgeFlowProps {
  onBack: () => void;
}

export const KnowledgeFlow: React.FC<KnowledgeFlowProps> = ({ onBack }) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-[var(--accent-green)]" />;
      case 'in-progress':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Circle className="w-4 h-4 text-[var(--accent-cyan)]" />
          </motion.div>
        );
      default:
        return <Circle className="w-4 h-4 text-[var(--text-muted)]" />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-l-[var(--accent-green)]';
      case 'in-progress':
        return 'border-l-[var(--accent-cyan)]';
      default:
        return 'border-l-[var(--text-muted)]';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-green';
      case 'in-progress':
        return 'badge-cyan';
      default:
        return '';
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-[var(--depth-0)]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--depth-1)] border-b border-[var(--border-subtle)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-3 h-3" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">KnowFlow Implementation</h1>
              <p className="text-xs text-[var(--text-muted)]">Knowledge extraction timeline</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-cyan">In Progress</span>
            <span className="text-xs text-[var(--text-muted)] mono">60%</span>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-3xl mx-auto">
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="card mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-primary)]">Overall Progress</span>
            <span className="text-[10px] text-[var(--text-muted)] mono">3 of 5 steps</span>
          </div>
          <div className="h-1.5 bg-[var(--depth-2)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '60%' }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="h-full bg-[var(--accent-indigo)] rounded-full"
            />
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border-default)]" />

          {/* Steps */}
          <div className="space-y-3">
            {flowSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <div
                  className={`card-accent ${getStatusStyles(step.id)} cursor-pointer hover:bg-[var(--depth-2)] transition-colors ml-6`}
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                >
                  {/* Status Icon */}
                  <div className="absolute -left-6 top-4">
                    <div className="w-4 h-4 bg-[var(--depth-0)] flex items-center justify-center">
                      {getStatusIcon(step.status)}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="label">Step {step.id}</span>
                        <span className={`badge ${getStatusBadge(step.status)}`}>
                          {step.status.replace('-', ' ')}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-[var(--text-primary)]">{step.title}</h3>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedStep === step.id ? 180 : 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    </motion.div>
                  </div>

                  <p className="text-xs text-[var(--text-tertiary)] mb-3">{step.description}</p>

                  <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {step.owner}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {step.date}
                    </span>
                    <span className="flex items-center gap-1 mono">
                      <FileText className="w-3 h-3" />
                      {step.artifacts.length}
                    </span>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedStep === step.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-[var(--border-subtle)] mt-3 pt-3 overflow-hidden"
                      >
                        <div className="space-y-4">
                          {/* Insights */}
                          {step.insights.length > 0 && (
                            <div>
                              <h4 className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] mb-2">
                                <Lightbulb className="w-3 h-3 text-[var(--accent-amber)]" />
                                Key Insights
                              </h4>
                              <div className="space-y-1.5">
                                {step.insights.map((insight, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-start gap-2 text-xs text-[var(--text-tertiary)]"
                                  >
                                    <ChevronRight className="w-3 h-3 text-[var(--accent-indigo)] mt-0.5 flex-shrink-0" />
                                    {insight}
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Artifacts */}
                          <div>
                            <h4 className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] mb-2">
                              <FileText className="w-3 h-3 text-[var(--accent-cyan)]" />
                              Artifacts
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {step.artifacts.map((artifact, i) => (
                                <motion.span
                                  key={i}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: i * 0.03 }}
                                  className="px-2 py-1 text-[10px] bg-[var(--depth-2)] text-[var(--text-secondary)] rounded cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                                >
                                  {artifact}
                                </motion.span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};