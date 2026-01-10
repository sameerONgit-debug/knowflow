// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Filter,
  Grid,
  List,
  RefreshCw,
  Bell,
  Search,
  MoreHorizontal,
} from 'lucide-react';
import { knowledgeCards, stats } from '../data/mockdata';
import { KnowledgeCard } from './Knowledgecard';
import { SkeletonLoader } from './ui/SkeletonLoader';
import { Button } from './ui/Button';

interface DashboardProps {
  onCapture: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onCapture }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredCards = filter === 'all'
    ? knowledgeCards
    : knowledgeCards.filter(card => card.type === filter);

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'decision', label: 'Decisions' },
    { id: 'workflow', label: 'Workflows' },
    { id: 'risk', label: 'Risks' },
  ];

  return (
    <div className="flex-1 overflow-auto bg-[var(--depth-0)]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--depth-1)] border-b border-[var(--border-subtle)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Dashboard</h1>
            <p className="text-xs text-[var(--text-muted)]">Welcome back, Sarah</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-md hover:bg-[rgba(255,255,255,0.04)] transition-colors">
              <Bell className="w-4 h-4 text-[var(--text-tertiary)]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--accent-red)] rounded-full" />
            </button>
            <Button onClick={onCapture} size="sm">
              <RefreshCw className="w-3 h-3" />
              Sync
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Grid - Denser */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label mb-1">{stat.label}</p>
                  <p className="stat-value">{stat.value}</p>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${stat.trend === 'up'
                    ? 'bg-[rgba(52,211,153,0.1)] text-[var(--accent-green)]'
                    : 'bg-[rgba(248,113,113,0.1)] text-[var(--accent-red)]'
                  }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters & View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[var(--depth-1)] border border-[var(--border-subtle)] rounded-md p-1">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFilter(option.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filter === option.id
                      ? 'bg-[rgba(129,140,248,0.15)] text-[var(--accent-indigo)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm">
              <Filter className="w-3 h-3" />
              Filters
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[var(--depth-1)] border border-[var(--border-subtle)] rounded-md p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid'
                    ? 'bg-[rgba(255,255,255,0.08)] text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)]'
                  }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'list'
                    ? 'bg-[rgba(255,255,255,0.08)] text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)]'
                  }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Knowledge Cards */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SkeletonLoader count={4} />
            </motion.div>
          ) : filteredCards.length > 0 ? (
            <motion.div
              key="cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={viewMode === 'grid'
                ? 'grid grid-cols-1 lg:grid-cols-2 gap-3'
                : 'space-y-3'
              }
            >
              {filteredCards.map((card, index) => (
                <KnowledgeCard key={card.id} card={card} index={index} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-12 h-12 rounded-lg bg-[var(--depth-2)] flex items-center justify-center mx-auto mb-4">
                <Search className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">No knowledge found</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Try adjusting your filters or capture new knowledge.
              </p>
              <Button onClick={onCapture} size="sm">Capture Knowledge</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};