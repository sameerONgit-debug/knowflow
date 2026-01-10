// src/components/InsightsPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    Clock,
    Users,
    BarChart3,
    ArrowUpRight,
    Zap,
} from 'lucide-react';
import { Button } from './ui/Button';

interface InsightsPageProps {
    onCapture: () => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ onCapture }) => {
    const insights = [
        {
            id: 1,
            type: 'pattern',
            title: 'Recurring Decision Pattern Detected',
            description: 'Similar pricing decisions have been made 3 times in the last month. Consider creating a standardized pricing policy.',
            impact: 'high',
            icon: <TrendingUp className="w-4 h-4" />,
            badgeClass: 'badge-indigo',
            timestamp: '2 hours ago',
        },
        {
            id: 2,
            type: 'risk',
            title: 'Knowledge Gap: Deployment Process',
            description: 'Only 1 team member has documented knowledge about the production deployment flow. This creates a single point of failure.',
            impact: 'critical',
            icon: <AlertTriangle className="w-4 h-4" />,
            badgeClass: 'badge-amber',
            timestamp: '5 hours ago',
        },
        {
            id: 3,
            type: 'opportunity',
            title: 'Onboarding Time Reduction',
            description: 'New hires are asking 40% fewer repeat questions since KnowFlow was implemented.',
            impact: 'positive',
            icon: <Zap className="w-4 h-4" />,
            badgeClass: 'badge-green',
            timestamp: '1 day ago',
        },
        {
            id: 4,
            type: 'pattern',
            title: 'Peak Knowledge Capture Hours',
            description: 'Most knowledge is captured between 2-4 PM during team standups. Consider scheduling important discussions during this window.',
            impact: 'medium',
            icon: <Clock className="w-4 h-4" />,
            badgeClass: 'badge-cyan',
            timestamp: '2 days ago',
        },
    ];

    const metrics = [
        { label: 'Active Insights', value: '12', change: '+3', trend: 'up' },
        { label: 'Patterns Found', value: '8', change: '+2', trend: 'up' },
        { label: 'Risks Identified', value: '4', change: '-1', trend: 'down' },
        { label: 'Recommendations', value: '6', change: '+1', trend: 'up' },
    ];

    return (
        <div className="flex-1 overflow-auto bg-[var(--depth-0)]">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[var(--depth-1)] border-b border-[var(--border-subtle)] px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-[var(--text-primary)]">AI Insights</h1>
                        <p className="text-xs text-[var(--text-muted)]">Patterns, risks, and recommendations from your knowledge base</p>
                    </div>
                    <Button size="sm" onClick={onCapture}>
                        <Lightbulb className="w-3 h-3" />
                        Generate Report
                    </Button>
                </div>
            </header>

            <div className="p-6">
                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {metrics.map((metric, index) => (
                        <motion.div
                            key={metric.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="card"
                        >
                            <p className="stat-label mb-1">{metric.label}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="stat-value">{metric.value}</span>
                                <span className={`text-xs font-medium ${metric.trend === 'up' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                                    }`}>
                                    {metric.change}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Insights List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-medium text-[var(--text-primary)]">Recent Insights</h2>
                        <Button variant="ghost" size="sm">
                            <BarChart3 className="w-3 h-3" />
                            View All
                        </Button>
                    </div>

                    {insights.map((insight, index) => (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className={`card-accent ${insight.impact === 'critical' ? 'card-accent-amber' :
                                    insight.impact === 'positive' ? 'card-accent-green' : ''
                                } hover:bg-[var(--depth-2)] transition-colors cursor-pointer`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <span className={`badge ${insight.badgeClass}`}>
                                    {insight.icon}
                                    {insight.type}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)]">{insight.timestamp}</span>
                            </div>
                            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">{insight.title}</h3>
                            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">{insight.description}</p>
                            <div className="mt-3 flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                    View Details
                                    <ArrowUpRight className="w-3 h-3" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
