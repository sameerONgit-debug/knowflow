// src/components/RisksPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    RefreshCw,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Network,
    Users,
    ChevronDown,
    ChevronRight,
    Shield,
    Activity,
} from 'lucide-react';
import { Button } from './ui/Button';
import { useApp } from '../context/AppContext';
import { risksApi, RiskFinding, RiskAnalysisResult } from '../services/api';

export const RisksPage: React.FC = () => {
    const { currentProcess } = useApp();
    const [risks, setRisks] = useState<RiskFinding[]>([]);
    const [analysisResult, setAnalysisResult] = useState<RiskAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState('');

    const fetchRisks = useCallback(async () => {
        if (!currentProcess) return;

        setIsLoading(true);
        setError(null);

        const result = await risksApi.get(currentProcess.id);
        if (result.data) {
            setRisks(result.data.findings);
            setAnalysisResult(result.data);
        } else {
            setError(result.error);
        }

        setIsLoading(false);
    }, [currentProcess]);

    useEffect(() => {
        fetchRisks();
    }, [fetchRisks]);

    const handleAnalyze = async () => {
        if (!currentProcess) return;

        setIsAnalyzing(true);
        setError(null);

        const result = await risksApi.analyze(currentProcess.id);
        if (result.data) {
            setAnalysisResult(result.data);
            setRisks(result.data.findings);
        } else {
            setError(result.error);
        }

        setIsAnalyzing(false);
    };

    const handleAcknowledge = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentProcess) return;

        const result = await risksApi.acknowledge(currentProcess.id, id);
        if (result.data) {
            // Update local state
            setRisks(prev => prev.map(r => r.id === id ? { ...r, acknowledged: true } : r));
        }
    };

    const handleResolve = async (id: string) => {
        if (!currentProcess) return;

        const result = await risksApi.resolve(currentProcess.id, id, resolutionNotes);
        if (result.data) {
            setRisks(prev => prev.map(r => r.id === id ? { ...r, resolved: true } : r));
            setResolvingId(null);
            setResolutionNotes('');
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-[var(--accent-red)] bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.2)]';
            case 'high': return 'text-[var(--accent-amber)] bg-[rgba(251,191,36,0.1)] border-[rgba(251,191,36,0.2)]';
            case 'medium': return 'text-[var(--accent-indigo)] bg-[rgba(129,140,248,0.1)] border-[rgba(129,140,248,0.2)]';
            default: return 'text-[var(--text-secondary)] bg-[var(--depth-2)] border-[var(--border-default)]';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertCircle className="w-4 h-4" />;
            case 'high': return <AlertTriangle className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    if (!currentProcess) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[var(--depth-0)]">
                <div className="text-center">
                    <Shield className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                    <p className="text-sm text-[var(--text-secondary)]">Select a process to view risks</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[var(--depth-0)]">
                <Loader2 className="w-8 h-8 text-[var(--accent-indigo)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto bg-[var(--depth-0)]">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[var(--depth-1)] border-b border-[var(--border-subtle)] px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Risk Analysis</h1>
                        <p className="text-xs text-[var(--text-muted)]">{currentProcess.name}</p>
                    </div>
                    <Button size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
                        {isAnalyzing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <RefreshCw className="w-3 h-3" />
                        )}
                        Run Analysis
                    </Button>
                </div>
            </header>

            <div className="p-6 max-w-5xl mx-auto">
                {error && (
                    <div className="mb-4 p-3 bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] rounded-lg">
                        <p className="text-xs text-[var(--accent-red)]">{error}</p>
                    </div>
                )}

                {/* Use analysis result if available, otherwise dummy empty state won't show initially */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="card">
                        <p className="stat-label mb-1">Total Risks</p>
                        <p className="stat-value">{analysisResult?.total_risks || 0}</p>
                    </div>
                    <div className="card">
                        <p className="stat-label mb-1 text-[var(--accent-red)]">Critical</p>
                        <p className="stat-value text-[var(--accent-red)]">{analysisResult?.critical || 0}</p>
                    </div>
                    <div className="card">
                        <p className="stat-label mb-1 text-[var(--accent-amber)]">High</p>
                        <p className="stat-value text-[var(--accent-amber)]">{analysisResult?.high || 0}</p>
                    </div>
                    <div className="card">
                        <p className="stat-label mb-1 text-[var(--text-muted)]">Resolved</p>
                        <p className="stat-value text-[var(--text-muted)]">
                            {risks.filter(r => r.resolved).length}
                        </p>
                    </div>
                </div>

                {/* Risk List */}
                <div className="space-y-4">
                    {risks.length > 0 ? (
                        risks.map((risk, index) => (
                            <motion.div
                                key={risk.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`border rounded-lg overflow-hidden transition-all ${risk.resolved ? 'opacity-60 bg-[var(--depth-1)] border-[var(--border-subtle)]' : 'bg-[var(--depth-1)] border-[var(--border-default)]'
                                    }`}
                            >
                                {/* Header */}
                                <div
                                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--depth-2)] transition-colors"
                                    onClick={() => setExpandedRisk(expandedRisk === risk.id ? null : risk.id)}
                                >
                                    <div className={`p-2 rounded-md border ${getSeverityColor(risk.severity)}`}>
                                        {getSeverityIcon(risk.severity)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={`text-sm font-medium ${risk.resolved ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                                                {risk.title}
                                            </h3>
                                            {risk.resolved && (
                                                <span className="badge badge-green">Resolved</span>
                                            )}
                                            {!risk.resolved && risk.acknowledged && (
                                                <span className="badge">Acknowledged</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--text-tertiary)] truncate">{risk.description}</p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Effort</p>
                                            <p className="text-xs font-medium text-[var(--text-secondary)]">{risk.effort_estimate}</p>
                                        </div>

                                        {!risk.resolved && !risk.acknowledged && (
                                            <Button variant="ghost" size="sm" onClick={(e) => handleAcknowledge(risk.id, e)}>
                                                Acknowledge
                                            </Button>
                                        )}

                                        <motion.div
                                            animate={{ rotate: expandedRisk === risk.id ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {expandedRisk === risk.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-[var(--border-subtle)] bg-[var(--depth-2)]"
                                        >
                                            <div className="p-4 space-y-4">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="label mb-2">Explanation</h4>
                                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                            {risk.explanation}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h4 className="label mb-2">Recommendation</h4>
                                                        <div className="p-3 rounded-md bg-[rgba(52,211,153,0.05)] border border-[rgba(52,211,153,0.1)]">
                                                            <p className="text-sm text-[var(--text-primary)] leading-relaxed flex gap-2">
                                                                <CheckCircle2 className="w-4 h-4 text-[var(--accent-green)] flex-shrink-0 mt-0.5" />
                                                                {risk.recommendation}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {risk.affected_node_ids.length > 0 && (
                                                    <div>
                                                        <h4 className="label mb-2">Affected Entities</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {risk.affected_node_ids.map(id => (
                                                                <span key={id} className="badge badge-indigo">
                                                                    <Network className="w-3 h-3" />
                                                                    {id}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {!risk.resolved && (
                                                    <div className="flex justify-end pt-2 border-t border-[var(--border-subtle)]">
                                                        {resolvingId === risk.id ? (
                                                            <div className="flex-1 flex gap-2 items-end">
                                                                <div className="flex-1">
                                                                    <label className="label mb-1">Resolution Notes</label>
                                                                    <input
                                                                        className="input w-full"
                                                                        placeholder="How was this fixed?"
                                                                        value={resolutionNotes}
                                                                        onChange={(e) => setResolutionNotes(e.target.value)}
                                                                    />
                                                                </div>
                                                                <Button variant="ghost" onClick={() => setResolvingId(null)}>Cancel</Button>
                                                                <Button onClick={() => handleResolve(risk.id)}>Confirm Resolution</Button>
                                                            </div>
                                                        ) : (
                                                            <Button onClick={() => setResolvingId(risk.id)}>
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                Mark as Resolved
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-16">
                            <Shield className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">No Risks Detected Yet</h3>
                            <p className="text-xs text-[var(--text-muted)] mb-4">
                                Run analysis to detect cycles, bottlenecks, and single points of failure
                            </p>
                            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                                {isAnalyzing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                Run Analysis
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
