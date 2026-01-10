// src/components/SessionPage.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Send,
    SkipForward,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowLeft,
    Brain,
    Target,
    Users,
    GitBranch,
} from 'lucide-react';
import { Button } from './ui/Button';
import { useApp } from '../context/AppContext';
import { sessionsApi, Question, KnowledgeState, ExtractionResult } from '../services/api';

interface SessionPageProps {
    onBack: () => void;
    onComplete: () => void;
}

export const SessionPage: React.FC<SessionPageProps> = ({ onBack, onComplete }) => {
    const { currentProcess, currentSessionId, setCurrentSessionId } = useApp();
    const [session, setSession] = useState<any>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [knowledgeState, setKnowledgeState] = useState<KnowledgeState | null>(null);
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastExtraction, setLastExtraction] = useState<ExtractionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Start or resume session
    useEffect(() => {
        const initSession = async () => {
            if (!currentProcess) return;

            setIsLoading(true);
            setError(null);

            try {
                let sessionId = currentSessionId;

                // If no session, start a new one
                if (!sessionId) {
                    const result = await sessionsApi.start(currentProcess.id);
                    if (result.error) {
                        setError(result.error);
                        setIsLoading(false);
                        return;
                    }
                    sessionId = result.data!.id;
                    setCurrentSessionId(sessionId);
                    setSession(result.data);
                } else {
                    // Resume existing session
                    const result = await sessionsApi.get(sessionId);
                    if (result.data) {
                        setSession(result.data);
                    }
                }

                // Fetch next question
                await fetchNextQuestion(sessionId!);

                // Fetch knowledge state
                await fetchKnowledgeState(sessionId!);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to initialize session');
            }

            setIsLoading(false);
        };

        initSession();
    }, [currentProcess, currentSessionId]);

    const fetchNextQuestion = async (sessionId: string) => {
        const result = await sessionsApi.getNextQuestion(sessionId);
        if (result.data) {
            setCurrentQuestion(result.data);
        }
    };

    const fetchKnowledgeState = async (sessionId: string) => {
        const result = await sessionsApi.getKnowledgeState(sessionId);
        if (result.data) {
            setKnowledgeState(result.data);
        }
    };

    const handleSubmitResponse = async () => {
        if (!response.trim() || !currentQuestion || !currentSessionId) return;

        setIsSubmitting(true);
        setLastExtraction(null);

        const result = await sessionsApi.submitResponse(
            currentSessionId,
            currentQuestion.id,
            response
        );

        if (result.data) {
            setLastExtraction(result.data);
            setResponse('');

            // Refresh question and knowledge state
            await fetchNextQuestion(currentSessionId);
            await fetchKnowledgeState(currentSessionId);

            // Update session info
            const sessionResult = await sessionsApi.get(currentSessionId);
            if (sessionResult.data) {
                setSession(sessionResult.data);
            }
        } else {
            setError(result.error);
        }

        setIsSubmitting(false);
    };

    const handleEndSession = async () => {
        if (!currentSessionId) return;

        const result = await sessionsApi.end(currentSessionId);
        if (result.data) {
            setCurrentSessionId(null);
            onComplete();
        }
    };

    const handleSkip = async () => {
        if (!currentSessionId) return;
        // Submit empty response to skip
        await sessionsApi.submitResponse(currentSessionId, currentQuestion?.id || '', '');
        await fetchNextQuestion(currentSessionId);
    };

    if (!currentProcess) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[var(--depth-0)]">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                    <p className="text-sm text-[var(--text-secondary)]">Please select a process first</p>
                    <Button variant="secondary" size="sm" className="mt-4" onClick={onBack}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[var(--depth-0)]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[var(--accent-indigo)] animate-spin mx-auto mb-4" />
                    <p className="text-sm text-[var(--text-secondary)]">Starting session...</p>
                </div>
            </div>
        );
    }

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
                            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Knowledge Capture Session</h1>
                            <p className="text-xs text-[var(--text-muted)]">{currentProcess.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="badge badge-cyan">
                            Q{session?.questions_asked || 0}
                        </span>
                        <Button size="sm" variant="secondary" onClick={handleEndSession}>
                            End Session
                        </Button>
                    </div>
                </div>
            </header>

            <div className="p-6 max-w-4xl mx-auto">
                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] rounded-lg"
                    >
                        <p className="text-xs text-[var(--accent-red)]">{error}</p>
                    </motion.div>
                )}

                {/* Question Card */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="card mb-8 p-8 border-none bg-[var(--depth-1)] shadow-2xl shadow-[var(--glow-subtle)]"
                >
                    <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-xl bg-[rgba(129,140,248,0.1)] flex items-center justify-center flex-shrink-0 mt-1">
                            <Brain className="w-6 h-6 text-[var(--accent-indigo)]" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-indigo)]">Current Question</span>
                                {currentQuestion?.target_entity_type && (
                                    <span className="badge badge-indigo">
                                        <Target className="w-3 h-3" />
                                        Targeting: {currentQuestion.target_entity_type}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl md:text-2xl font-medium text-[var(--text-primary)] leading-normal mb-4">
                                {currentQuestion?.text || 'Loading next question...'}
                            </h2>
                            {currentQuestion?.context && (
                                <div className="pl-4 border-l-2 border-[var(--accent-indigo)] py-1">
                                    <p className="text-sm text-[var(--text-secondary)] italic">
                                        "{currentQuestion.context}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Response Input */}
                <div className="mb-8 relative">
                    <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Type your response here... Focus on specific roles, decisions, and outcomes."
                        className="w-full h-40 bg-[var(--depth-0)] rounded-xl border border-[var(--border-default)] p-6 text-base text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-indigo)] focus:ring-1 focus:ring-[var(--accent-indigo)] transition-all resize-none shadow-inner"
                        disabled={isSubmitting}
                    />
                    <div className="flex items-center justify-between mt-3">
                        <Button variant="ghost" size="sm" onClick={handleSkip} disabled={isSubmitting}>
                            <SkipForward className="w-3 h-3" />
                            Skip
                        </Button>
                        <Button
                            onClick={handleSubmitResponse}
                            disabled={!response.trim() || isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Submit Answer
                        </Button>
                    </div>
                </div>

                {/* Last Extraction Result */}
                <AnimatePresence>
                    {lastExtraction && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-6 p-4 bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.2)] rounded-lg"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-[var(--accent-green)]" />
                                <span className="text-xs font-medium text-[var(--text-primary)]">Extracted from your response</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-xs text-[var(--text-secondary)]">
                                    <span className="mono">{lastExtraction.entities_extracted}</span> entities
                                </span>
                                <span className="text-xs text-[var(--text-secondary)]">
                                    <span className="mono">{lastExtraction.relations_extracted}</span> relations
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Knowledge State */}
                {knowledgeState && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card"
                    >
                        <h3 className="text-xs font-medium text-[var(--text-primary)] mb-4">Extracted Knowledge</h3>

                        {/* Entity Counts */}
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            {Object.entries(knowledgeState.entities_by_type).map(([type, count]) => (
                                <div key={type} className="text-center p-3 bg-[var(--depth-2)] rounded-md">
                                    <div className="stat-value text-base">{count}</div>
                                    <div className="stat-label capitalize">{type}s</div>
                                </div>
                            ))}
                            {Object.keys(knowledgeState.entities_by_type).length === 0 && (
                                <div className="col-span-4 text-center py-4 text-xs text-[var(--text-muted)]">
                                    No entities extracted yet. Answer questions to build knowledge.
                                </div>
                            )}
                        </div>

                        {/* Knowledge Gaps */}
                        {knowledgeState.knowledge_gaps.length > 0 && (
                            <div className="border-t border-[var(--border-subtle)] pt-4">
                                <h4 className="label mb-2">Knowledge Gaps</h4>
                                <div className="space-y-1">
                                    {knowledgeState.knowledge_gaps.map((gap, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-[var(--accent-amber)]">
                                            <AlertCircle className="w-3 h-3" />
                                            {gap}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Confidence Distribution */}
                        <div className="border-t border-[var(--border-subtle)] pt-4 mt-4">
                            <h4 className="label mb-2">Confidence Distribution</h4>
                            <div className="flex gap-2">
                                <span className="badge badge-green">High: {knowledgeState.confidence_distribution.high}</span>
                                <span className="badge badge-indigo">Medium: {knowledgeState.confidence_distribution.medium}</span>
                                <span className="badge badge-amber">Low: {knowledgeState.confidence_distribution.low}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
