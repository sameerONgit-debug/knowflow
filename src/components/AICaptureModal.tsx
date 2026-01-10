// src/components/AICaptureModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  MessageSquare,
  GitBranch,
  AlertTriangle,
  Check,
  Copy,
  Upload,
} from 'lucide-react';
import { Button } from './ui/Button';

interface AICaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtractedData {
  decisions: string[];
  workflows: string[];
  risks: string[];
}

export const AICaptureModal: React.FC<AICaptureModalProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [data, setData] = useState<ExtractedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  const sampleText = `Team sync notes - Jan 25, 2024

Sarah: I think we should prioritize mobile-first for Q4. The analytics show 60% of users are on mobile.

Mike: Agreed. Let's use React Native for cross-platform development to save time.

Alex: That makes sense. But we'll need to update our sprint planning to bi-weekly to keep up with the faster release cycles.

Sarah: Good point. We should also add a code review step before each deployment to maintain quality.

Mike: Just a heads up - the timeline is pretty tight for the mobile launch. We might need additional developer resources.

Alex: I'll flag that as a risk. Let's revisit staffing in next week's meeting.`;

  const handleProcess = async () => {
    const textToProcess = input.trim() || sampleText;
    if (!input.trim()) {
      setInput(sampleText);
    }

    setIsProcessing(true);
    setProgress(0);
    setData(null);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90));
    }, 100);

    try {
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToProcess }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const result = await response.json();

      clearInterval(progressInterval);
      setProgress(100);
      setData(result);

      setTimeout(() => {
        setIsProcessing(false);
        setIsComplete(true);
      }, 300);

    } catch (error) {
      console.error(error);
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setInput('');
    setIsProcessing(false);
    setIsComplete(false);
    setProgress(0);
    setData(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const categories = [
    { key: 'decisions', icon: <Check className="w-4 h-4" />, badgeClass: 'badge-green', items: data?.decisions || [] },
    { key: 'workflows', icon: <GitBranch className="w-4 h-4" />, badgeClass: 'badge-indigo', items: data?.workflows || [] },
    { key: 'risks', icon: <AlertTriangle className="w-4 h-4" />, badgeClass: 'badge-amber', items: data?.risks || [] },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[80vh] z-50 glass-elevated overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[rgba(129,140,248,0.15)] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[var(--accent-indigo)]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">AI Knowledge Capture</h2>
                  <p className="text-xs text-[var(--text-muted)]">Paste meeting notes or conversations</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-md hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              <AnimatePresence mode="wait">
                {!isComplete ? (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Text Input */}
                    <div className="relative mb-4">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste your meeting notes, Slack conversations, or any text here..."
                        disabled={isProcessing}
                        className="input w-full h-48 resize-none disabled:opacity-50"
                      />
                      {!input && !isProcessing && (
                        <button
                          onClick={() => setInput(sampleText)}
                          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-[var(--depth-2)] rounded text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          Use Sample
                        </button>
                      )}
                    </div>

                    {/* Processing State */}
                    {isProcessing && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                          >
                            <Zap className="w-4 h-4 text-[var(--accent-cyan)]" />
                          </motion.div>
                          <div>
                            <p className="text-xs font-medium text-[var(--text-primary)]">Extracting knowledge...</p>
                            <p className="text-[10px] text-[var(--text-muted)]">AI is analyzing your content</p>
                          </div>
                        </div>
                        <div className="h-1.5 bg-[var(--depth-2)] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-[var(--accent-indigo)] rounded-full"
                          />
                        </div>
                        <div className="flex justify-between mt-1.5 text-[10px] text-[var(--text-muted)] mono">
                          <span>Processing</span>
                          <span>{progress}%</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                  >
                    {/* Success Header */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.2)] rounded-lg"
                    >
                      <div className="w-7 h-7 rounded-md bg-[rgba(52,211,153,0.2)] flex items-center justify-center">
                        <Check className="w-4 h-4 text-[var(--accent-green)]" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--text-primary)]">Knowledge Extracted!</p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Found {categories.reduce((acc, c) => acc + c.items.length, 0)} items across 3 categories
                        </p>
                      </div>
                    </motion.div>

                    {/* Extracted Items */}
                    {categories.map((category, categoryIndex) => (
                      category.items.length > 0 && (
                        <motion.div
                          key={category.key}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: categoryIndex * 0.05 }}
                          className="card"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`badge ${category.badgeClass}`}>
                              {category.icon}
                              {category.key}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] mono">{category.items.length}</span>
                          </div>
                          <div className="space-y-1.5">
                            {category.items.map((item, itemIndex) => (
                              <motion.div
                                key={itemIndex}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: categoryIndex * 0.05 + itemIndex * 0.02 }}
                                className="flex items-start gap-2 p-2 bg-[var(--depth-2)] rounded text-xs text-[var(--text-secondary)]"
                              >
                                <Check className="w-3 h-3 text-[var(--accent-green)] flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-[var(--border-subtle)]">
              <Button variant="ghost" size="sm" onClick={isComplete ? handleReset : handleClose}>
                {isComplete ? 'Extract More' : 'Cancel'}
              </Button>
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <Button size="sm" onClick={handleClose}>
                    <Check className="w-3 h-3" />
                    Save to Knowledge Base
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" size="sm">
                      <Upload className="w-3 h-3" />
                      Upload
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleProcess}
                      disabled={isProcessing}
                    >
                      <Zap className="w-3 h-3" />
                      {isProcessing ? 'Processing...' : 'Extract'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};