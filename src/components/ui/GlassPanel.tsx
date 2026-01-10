// src/components/ui/GlassPanel.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  accent?: 'indigo' | 'cyan' | 'green' | 'amber' | 'red' | 'none';
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  delay = 0,
  accent = 'none',
}) => {
  const accentClasses = {
    none: 'card',
    indigo: 'card-accent',
    cyan: 'card-accent card-accent-cyan',
    green: 'card-accent card-accent-green',
    amber: 'card-accent card-accent-amber',
    red: 'card-accent card-accent-red',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className={`${accentClasses[accent]} ${className}`}
    >
      {children}
    </motion.div>
  );
};