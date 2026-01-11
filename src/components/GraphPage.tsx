// src/components/GraphPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Network,
    Save,
    GitCompare,
    BarChart3,
    Loader2,
    AlertCircle,
    ChevronDown,
    Circle,
    Diamond,
    Square,
    Triangle,
    ArrowRight,
} from 'lucide-react';
import { Button } from './ui/Button';
import { useApp } from '../context/AppContext';
import { graphApi, GraphData, GraphAnalysis, GraphVersion, GraphDiff } from '../services/api';

export const GraphPage: React.FC = () => {
    const { currentProcess } = useApp();
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [analysis, setAnalysis] = useState<GraphAnalysis | null>(null);
    const [versions, setVersions] = useState<GraphVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showVersions, setShowVersions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showCompare, setShowCompare] = useState(false);
    const [diffData, setDiffData] = useState<GraphDiff | null>(null);

    const fetchGraph = useCallback(async () => {
        if (!currentProcess) return;

        setIsLoading(true);
        setError(null);

        const result = await graphApi.get(currentProcess.id);
        if (result.data) {
            setGraphData(result.data);
            setSelectedVersion(result.data.meta.version);
        } else {
            setError(result.error);
        }

        // Fetch versions
        const versionsResult = await graphApi.getVersions(currentProcess.id);
        if (versionsResult.data) {
            setVersions(versionsResult.data);
        }

        // Fetch analysis
        const analysisResult = await graphApi.getAnalysis(currentProcess.id);
        if (analysisResult.data) {
            setAnalysis(analysisResult.data);
        }

        setIsLoading(false);
    }, [currentProcess]);

    useEffect(() => {
        fetchGraph();
    }, [fetchGraph]);

    const handleSaveSnapshot = async () => {
        if (!currentProcess) return;

        setIsSaving(true);
        const result = await graphApi.createSnapshot(currentProcess.id, 'Manual snapshot');
        if (result.data) {
            await fetchGraph();
        }
        setIsSaving(false);
    };

    const handleCompare = async () => {
        if (!currentProcess || !graphData) return;
        const currentVer = graphData.meta.version;
        if (currentVer <= 0) return;

        setIsLoading(true);
        setError(null);

        const result = await graphApi.getDiff(currentProcess.id, currentVer - 1, currentVer);
        if (result.data) {
            setDiffData(result.data);
            setShowCompare(true);
        } else {
            setError(result.error || 'Failed to compare versions. The previous version might not be available.');
        }
        setIsLoading(false);
    };

    const getNodeIcon = (type: string) => {
        switch (type) {
            case 'task': return <Circle className="w-3 h-3" />;
            case 'decision': return <Diamond className="w-3 h-3" />;
            case 'role': return <Square className="w-3 h-3" />;
            default: return <Triangle className="w-3 h-3" />;
        }
    };

    const getNodeColor = (type: string) => {
        switch (type) {
            case 'task': return 'badge-indigo';
            case 'decision': return 'badge-amber';
            case 'role': return 'badge-cyan';
            case 'trigger': return 'badge-green';
            case 'artifact': return 'badge-red';
            default: return '';
        }
    };

    if (!currentProcess) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[var(--depth-0)]">
                <div className="text-center">
                    <Network className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                    <p className="text-sm text-[var(--text-secondary)]">Select a process to view its graph</p>
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
            <header className="sticky top-0 z-20 bg-[var(--depth-1)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] px-8 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-light text-[var(--text-primary)] tracking-tight">Process Graph</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-[var(--text-muted)] font-medium">{currentProcess.name}</span>
                        <span className="text-[var(--border-default)]">|</span>
                        <span className="flex items-center gap-1.5 text-xs text-[var(--accent-green)]">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            System Active
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Version Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowVersions(!showVersions)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--depth-2)] border border-[var(--border-default)] rounded-full text-xs hover:border-[var(--border-emphasis)] transition-colors"
                        >
                            <span className="mono text-[var(--text-secondary)]">v{selectedVersion || 0}</span>
                            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
                        </button>
                        {showVersions && versions.length > 0 && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowVersions(false)} />
                                <div className="absolute top-full right-0 mt-2 w-56 bg-[var(--depth-2)] border border-[var(--border-default)] rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                                    {versions.map((v) => (
                                        <button
                                            key={v.version}
                                            onClick={() => {
                                                setSelectedVersion(v.version);
                                                setShowVersions(false);
                                            }}
                                            className="w-full px-4 py-3 text-left text-xs hover:bg-[rgba(255,255,255,0.04)] transition-colors border-b border-[var(--border-subtle)] last:border-0"
                                        >
                                            <div className="flex justify-between mb-1">
                                                <span className="mono font-medium">v{v.version}</span>
                                                <span className="text-[var(--text-muted)]">{new Date(v.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[var(--text-muted)] truncate">{v.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="h-6 w-px bg-[var(--border-default)] mx-2" />

                    <Button variant="ghost" size="sm" onClick={handleCompare} disabled={!graphData || graphData?.meta.version <= 0}>
                        <GitCompare className="w-4 h-4 text-[var(--text-secondary)]" />
                    </Button>

                    <Button size="sm" onClick={handleSaveSnapshot} disabled={isSaving} className="rounded-full px-4">
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                        Save Snapshot
                    </Button>
                </div>
            </header>

            <div className="p-8 max-w-[1600px] mx-auto">
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-sm text-red-200">{error}</p>
                    </div>
                )}

                {/* Graph Visualization Area - Swimlane Board */}
                <div className="card min-h-[500px] mb-6 overflow-hidden flex flex-col">
                    {graphData && graphData.nodes.length > 0 ? (
                        <div className="flex-1 flex flex-col">
                            {/* Swimlanes */}
                            <div className="flex-1 grid grid-cols-4 gap-4 p-4 bg-[var(--depth-1)] overflow-x-auto">
                                {[
                                    { title: 'Inputs & Sources', types: ['trigger', 'resource'], color: 'var(--accent-green)' },
                                    { title: 'Roles & Actors', types: ['role'], color: 'var(--accent-cyan)' },
                                    { title: 'Tasks & Workflow', types: ['task'], color: 'var(--accent-indigo)' },
                                    { title: 'Decisions & Logic', types: ['decision', 'condition'], color: 'var(--accent-amber)' },
                                ].map((lane) => {
                                    const laneNodes = graphData.nodes.filter(n => lane.types.includes(n.type));
                                    return (
                                        <div key={lane.title} className="flex flex-col gap-3 min-w-[200px]">
                                            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)] mb-2">
                                                <div className="w-2 h-2 rounded-full" style={{ background: lane.color }} />
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{lane.title}</h3>
                                                <span className="ml-auto text-xs text-[var(--text-tertiary)] mono">{laneNodes.length}</span>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                {laneNodes.map((node) => (
                                                    <motion.div
                                                        key={node.id}
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--depth-2)] hover:border-[var(--border-emphasis)] transition-all cursor-default group relative overflow-hidden`}
                                                    >
                                                        {/* Confidence Indicator strip */}
                                                        <div
                                                            className="absolute left-0 top-0 bottom-0 w-1"
                                                            style={{
                                                                background: lane.color,
                                                                opacity: node.data.confidence
                                                            }}
                                                        />

                                                        <div className="pl-2">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {getNodeIcon(node.type)}
                                                                <span className="text-sm font-medium text-[var(--text-primary)]">{node.label}</span>
                                                            </div>
                                                            {node.data.description && (
                                                                <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 leading-relaxed">
                                                                    {node.data.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                                {laneNodes.length === 0 && (
                                                    <div className="p-4 border border-dashed border-[var(--border-subtle)] rounded-lg text-center">
                                                        <p className="text-[10px] text-[var(--text-muted)]">No entities</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Relationships Footer */}
                            {graphData.edges.length > 0 && (
                                <div className="border-t border-[var(--border-subtle)] p-4 bg-[var(--depth-0)]">
                                    <h3 className="label mb-3">Key Relationships</h3>
                                    <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto pr-2">
                                        {graphData.edges.map((edge, i) => {
                                            const sourceNode = graphData.nodes.find(n => n.id === edge.source);
                                            const targetNode = graphData.nodes.find(n => n.id === edge.target);
                                            if (!sourceNode || !targetNode) return null;

                                            return (
                                                <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded bg-[var(--depth-1)] border border-[var(--border-subtle)]">
                                                    <span className="font-medium text-[var(--text-secondary)]">{sourceNode.label}</span>
                                                    <span className="text-[10px] text-[var(--text-muted)] px-1">── {edge.label || edge.type} ──&gt;</span>
                                                    <span className="font-medium text-[var(--text-primary)]">{targetNode.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                    ) : (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Network className="w-12 h-12 text-[var(--text-muted)] mb-4" />
                            <p className="text-sm text-[var(--text-secondary)]">No graph data yet</p>
                            <p className="text-xs text-[var(--text-muted)]">Start a knowledge capture session to build the graph</p>
                        </div>
                    )
                    }
                </div >

                {/* Analysis Panel */}
                {
                    analysis && (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-4 h-4 text-[var(--accent-indigo)]" />
                                <h3 className="text-xs font-medium text-[var(--text-primary)]">Graph Analysis</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {analysis.roots.length > 0 && (
                                    <div>
                                        <h4 className="label mb-2">Entry Points (Roots)</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {analysis.roots.map((root) => {
                                                const node = graphData?.nodes?.find(n => n.id === root);
                                                return (
                                                    <span key={root} className="badge badge-green">
                                                        {node?.label || root}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {analysis.leaves.length > 0 && (
                                    <div>
                                        <h4 className="label mb-2">End Points (Leaves)</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {analysis.leaves.map((leaf) => {
                                                const node = graphData?.nodes?.find(n => n.id === leaf);
                                                return (
                                                    <span key={leaf} className="badge badge-amber">
                                                        {node?.label || leaf}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {Object.keys(analysis.top_central_nodes).length > 0 && (
                                <div className="border-t border-[var(--border-subtle)] mt-4 pt-4">
                                    <h4 className="label mb-2">Centrality (Most Connected)</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(analysis.top_central_nodes)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 5)
                                            .map(([nodeId, score]) => {
                                                const node = graphData?.nodes?.find(n => n.id === nodeId);
                                                return (
                                                    <span key={nodeId} className="text-xs">
                                                        <span className="text-[var(--text-primary)]">{node?.label || nodeId}</span>
                                                        <span className="text-[var(--text-muted)] ml-1 mono">({score.toFixed(2)})</span>
                                                    </span>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Legend */}
                <div className="mt-6 flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
                    <span>Legend:</span>
                    <span className="flex items-center gap-1"><Circle className="w-3 h-3 text-[var(--accent-indigo)]" /> Task</span>
                    <span className="flex items-center gap-1"><Diamond className="w-3 h-3 text-[var(--accent-amber)]" /> Decision</span>
                    <span className="flex items-center gap-1"><Square className="w-3 h-3 text-[var(--accent-cyan)]" /> Role</span>
                    <span className="flex items-center gap-1"><Triangle className="w-3 h-3 text-[var(--accent-green)]" /> Trigger</span>
                </div>
            </div >

            {/* Diff Modal */}
            <AnimatePresence>
                {
                    showCompare && diffData && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                            onClick={() => setShowCompare(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-[var(--depth-1)] border border-[var(--border-default)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Version Comparison</h3>
                                    <button onClick={() => setShowCompare(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                        &times;
                                    </button>
                                </div>
                                <div className="p-6 max-h-[60vh] overflow-y-auto">
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase mb-3">Changes Logic</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-[rgba(34,197,94,0.1)] rounded-lg border border-[rgba(34,197,94,0.2)]">
                                                    <div className="text-2xl font-bold text-[var(--accent-green)]">{diffData.nodes_added.length}</div>
                                                    <div className="text-xs text-[var(--text-secondary)]">Nodes Added</div>
                                                </div>
                                                <div className="p-3 bg-[rgba(239,68,68,0.1)] rounded-lg border border-[rgba(239,68,68,0.2)]">
                                                    <div className="text-2xl font-bold text-[var(--accent-red)]">{diffData.nodes_removed.length}</div>
                                                    <div className="text-xs text-[var(--text-secondary)]">Nodes Removed</div>
                                                </div>
                                            </div>
                                        </div>

                                        {diffData.nodes_added.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-medium text-[var(--accent-green)] mb-2">New Entities</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {diffData.nodes_added.map((node: any) => (
                                                        <span key={node.id || node} className="badge bg-[rgba(34,197,94,0.1)] text-[var(--accent-green)] border border-[rgba(34,197,94,0.2)]">
                                                            + {node.label || node}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-[var(--depth-2)] border-t border-[var(--border-subtle)]">
                                    <Button className="w-full" onClick={() => setShowCompare(false)}>Close</Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
};
