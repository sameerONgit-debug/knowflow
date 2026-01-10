// src/components/SOPPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Download,
    RefreshCw,
    Loader2,
    ChevronDown,
    Check,
    AlertCircle,
    User,
    GitBranch,
} from 'lucide-react';
import { Button } from './ui/Button';
import { useApp } from '../context/AppContext';
import { sopApi, SOPVersion } from '../services/api';

export const SOPPage: React.FC = () => {
    const { currentProcess } = useApp();
    const [sop, setSop] = useState<SOPVersion | null>(null);
    const [markdown, setMarkdown] = useState<string>('');
    const [versions, setVersions] = useState<SOPVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showVersions, setShowVersions] = useState(false);
    const [viewMode, setViewMode] = useState<'structured' | 'markdown'>('structured');

    const fetchSOP = useCallback(async () => {
        if (!currentProcess) return;

        setIsLoading(true);
        setError(null);

        const result = await sopApi.getLatest(currentProcess.id);
        if (result.data) {
            setSop(result.data);
            setMarkdown(result.data.markdown || '');
        } else if (result.error?.includes('No SOP')) {
            // No SOP generated yet, that's ok
            setSop(null);
        } else {
            setError(result.error);
        }

        // Fetch versions
        const versionsResult = await sopApi.getVersions(currentProcess.id);
        if (versionsResult.data) {
            setVersions(versionsResult.data);
        }

        setIsLoading(false);
    }, [currentProcess]);

    useEffect(() => {
        fetchSOP();
    }, [fetchSOP]);

    const handleGenerate = async () => {
        if (!currentProcess) return;

        setIsGenerating(true);
        setError(null);

        const result = await sopApi.generate(currentProcess.id, {
            include_exceptions: true,
            detail_level: 'detailed',
        });

        if (result.data) {
            await fetchSOP();
        } else {
            setError(result.error);
        }

        setIsGenerating(false);
    };

    const handleDownload = () => {
        if (!markdown) return;

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentProcess?.name || 'SOP'}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!currentProcess) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[var(--depth-0)]">
                <div className="text-center">
                    <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                    <p className="text-sm text-[var(--text-secondary)]">Select a process to view its SOP</p>
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
                        <h1 className="text-lg font-semibold text-[var(--text-primary)]">SOP Document</h1>
                        <p className="text-xs text-[var(--text-muted)]">{currentProcess.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {sop && (
                            <>
                                {/* Version Selector */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowVersions(!showVersions)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--depth-2)] border border-[var(--border-default)] rounded-md text-xs"
                                    >
                                        <span className="mono">v{sop.version}</span>
                                        <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
                                    </button>
                                    {showVersions && versions.length > 0 && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowVersions(false)} />
                                            <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--depth-2)] border border-[var(--border-default)] rounded-lg shadow-xl z-50 py-1">
                                                {versions.map((v) => (
                                                    <button
                                                        key={v.version}
                                                        className="w-full px-3 py-2 text-left text-xs hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                                                    >
                                                        <span className="mono">v{v.version}</span>
                                                        <span className="text-[var(--text-muted)] ml-2">
                                                            {new Date(v.generated_at).toLocaleDateString()}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <Button variant="secondary" size="sm" onClick={handleDownload}>
                                    <Download className="w-3 h-3" />
                                    Export MD
                                </Button>
                            </>
                        )}

                        <Button size="sm" onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <RefreshCw className="w-3 h-3" />
                            )}
                            {sop ? 'Regenerate' : 'Generate SOP'}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="p-6 max-w-4xl mx-auto">
                {error && (
                    <div className="mb-4 p-3 bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] rounded-lg">
                        <p className="text-xs text-[var(--accent-red)]">{error}</p>
                    </div>
                )}

                {sop ? (
                    <>
                        {/* View Toggle */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="flex items-center bg-[var(--depth-1)] border border-[var(--border-subtle)] rounded-md p-1">
                                <button
                                    onClick={() => setViewMode('structured')}
                                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'structured'
                                        ? 'bg-[rgba(129,140,248,0.15)] text-[var(--accent-indigo)]'
                                        : 'text-[var(--text-tertiary)]'
                                        }`}
                                >
                                    Structured
                                </button>
                                <button
                                    onClick={() => setViewMode('markdown')}
                                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'markdown'
                                        ? 'bg-[rgba(129,140,248,0.15)] text-[var(--accent-indigo)]'
                                        : 'text-[var(--text-tertiary)]'
                                        }`}
                                >
                                    Markdown
                                </button>
                            </div>
                            <div className="flex-1" />
                            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                                <span>Coverage: <span className="mono text-[var(--text-primary)]">{(sop.coverage_score * 100).toFixed(0)}%</span></span>
                                <span>Confidence: <span className="mono text-[var(--text-primary)]">{(sop.confidence_score * 100).toFixed(0)}%</span></span>
                            </div>
                        </div>

                        {viewMode === 'structured' ? (
                            <div className="space-y-4">
                                {/* Header Section */}
                                <div className="card">
                                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{sop.title}</h2>
                                    <p className="text-xs text-[var(--text-tertiary)] mb-4">{sop.purpose}</p>
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <span className="label">Scope</span>
                                            <p className="text-xs text-[var(--text-secondary)]">{sop.scope}</p>
                                        </div>
                                        <div>
                                            <span className="label">Roles</span>
                                            <div className="flex gap-1 mt-1">
                                                {sop.roles_involved.map((role) => (
                                                    <span key={role} className="badge badge-cyan">
                                                        <User className="w-3 h-3" />
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="space-y-3">
                                    {sop.steps.map((step, index) => (
                                        <motion.div
                                            key={step.step_number}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`card-accent ${step.is_decision_point ? 'card-accent-amber' : ''}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-md bg-[var(--depth-2)] flex items-center justify-center flex-shrink-0">
                                                    <span className="mono text-xs text-[var(--text-primary)]">{step.step_number}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-sm font-medium text-[var(--text-primary)]">{step.title}</h3>
                                                        {step.is_decision_point && (
                                                            <span className="badge badge-amber">
                                                                <GitBranch className="w-3 h-3" />
                                                                Decision
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mb-2">
                                                        {step.description}
                                                    </p>

                                                    {step.responsible_role && (
                                                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mb-2">
                                                            <User className="w-3 h-3" />
                                                            <span>Responsible: {step.responsible_role}</span>
                                                        </div>
                                                    )}

                                                    {step.branches && Object.keys(step.branches).length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {Object.entries(step.branches).map(([condition, nextStep]) => (
                                                                <span key={condition} className="badge border border-[var(--border-default)]">
                                                                    <span className="font-medium text-[var(--accent-indigo)]">{condition}</span>
                                                                    <span className="ml-1 text-[var(--text-muted)]">→ {nextStep}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {step.notes && step.notes.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            {step.notes.map((note, i) => (
                                                                <div key={i} className="flex items-center gap-1 text-[10px] text-[var(--accent-amber)]">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    {note}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="card">
                                <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-mono leading-relaxed">
                                    {markdown}
                                </pre>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="card text-center py-16">
                        <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">No SOP Generated Yet</h3>
                        <p className="text-xs text-[var(--text-muted)] mb-4">
                            Generate an SOP document from your process knowledge graph
                        </p>
                        <Button onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <FileText className="w-4 h-4" />
                            )}
                            Generate SOP
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
