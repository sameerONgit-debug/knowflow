// src/components/ProcessSelector.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Folder, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { processesApi } from '../services/api';

interface ProcessSelectorProps {
    onCreateProcess?: () => void;
}

export const ProcessSelector: React.FC<ProcessSelectorProps> = ({ onCreateProcess }) => {
    const { processes, currentProcess, selectProcess, refreshProcesses } = useApp();
    // Ensure processes is always an array
    const safeProcesses = Array.isArray(processes) ? processes : [];

    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newProcessName, setNewProcessName] = useState('');
    const [newProcessDesc, setNewProcessDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateProcess = async () => {
        if (!newProcessName.trim()) return;

        setIsSubmitting(true);
        try {
            const result = await processesApi.create({
                name: newProcessName,
                description: newProcessDesc,
            });

            if (result.data) {
                await refreshProcesses();
                selectProcess(result.data);
                setIsCreating(false);
                setNewProcessName('');
                setNewProcessDesc('');
                setIsOpen(false);
                if (onCreateProcess) onCreateProcess();
            }
        } catch (error) {
            console.error('Failed to create process:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--depth-1)] border border-[var(--border-default)] rounded-md hover:border-[var(--border-emphasis)] transition-colors w-full"
            >
                <Folder className="w-4 h-4 text-[var(--accent-indigo)] shrink-0" />
                <span className="text-sm font-medium text-[var(--text-primary)] flex-1 truncate text-left">
                    {currentProcess?.name || 'Select Process'}
                </span>
                <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-1 w-full min-w-[280px] bg-[var(--depth-2)] border border-[var(--border-default)] rounded-lg shadow-xl z-50 overflow-hidden"
                        >
                            {!isCreating ? (
                                <>
                                    <div className="max-h-64 overflow-auto">
                                        {safeProcesses.length === 0 ? (
                                            <div className="p-4 text-center">
                                                <p className="text-xs text-[var(--text-muted)]">No processes yet</p>
                                            </div>
                                        ) : (
                                            safeProcesses.map((process) => (
                                                <button
                                                    key={process.id}
                                                    onClick={() => {
                                                        selectProcess(process);
                                                        setIsOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.04)] transition-colors text-left group"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-medium truncate ${currentProcess?.id === process.id ? 'text-[var(--accent-indigo)]' : 'text-[var(--text-primary)]'}`}>
                                                            {process.name}
                                                        </p>
                                                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                                                            {process.description || 'No description'}
                                                        </p>
                                                    </div>
                                                    {currentProcess?.id === process.id && (
                                                        <Check className="w-4 h-4 text-[var(--accent-green)]" />
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    <div className="border-t border-[var(--border-subtle)]">
                                        <button
                                            onClick={() => setIsCreating(true)}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-medium text-[var(--accent-indigo)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Create New Process
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="p-4 space-y-3">
                                    <div>
                                        <label className="label block mb-1">Process Name *</label>
                                        <input
                                            type="text"
                                            value={newProcessName}
                                            onChange={(e) => setNewProcessName(e.target.value)}
                                            placeholder="e.g., Loan Approval Process"
                                            className="input w-full"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="label block mb-1">Description</label>
                                        <input
                                            type="text"
                                            value={newProcessDesc}
                                            onChange={(e) => setNewProcessDesc(e.target.value)}
                                            placeholder="Brief description..."
                                            className="input w-full"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsCreating(false)}
                                            className="btn btn-ghost flex-1"
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateProcess}
                                            disabled={!newProcessName.trim() || isSubmitting}
                                            className="btn btn-primary flex-1 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Creating...' : 'Create'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
