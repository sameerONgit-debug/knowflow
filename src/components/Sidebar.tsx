// src/components/Sidebar.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  GitBranch,
  Sparkles,
  Users,
  Settings,
  Zap,
  Plus,
  Search,
  ChevronDown,
} from 'lucide-react';
import { ProcessSelector } from './ProcessSelector';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCapture: () => void;
}

const sidebarItems = [
  { id: 'dashboard', label: 'Process Graph', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'flows', label: 'SOP Documents', icon: <GitBranch className="w-4 h-4" /> },
  { id: 'insights', label: 'Risk Analysis', icon: <Sparkles className="w-4 h-4" /> },
  // { id: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
  // { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onCapture }) => {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="sidebar h-screen flex flex-col w-[260px] border-r border-[var(--border-subtle)] bg-[var(--depth-1)]"
    >
      {/* Logo */}
      <div className="p-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[var(--accent-indigo)] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">KnowFlow</span>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Process Intelligence</p>
          </div>
        </div>
      </div>

      {/* Process Selector */}
      <div className="p-3">
        <ProcessSelector />
      </div>

      {/* Capture Button */}
      <div className="px-3 pb-2">
        <button
          onClick={onCapture}
          className="w-full btn btn-primary justify-center"
        >
          <Plus className="w-4 h-4" />
          Capture Knowledge
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        <div className="space-y-0.5">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === item.id
                  ? 'bg-[rgba(129,140,248,0.1)] text-[var(--accent-indigo)]'
                  : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]'
                }`}
            >
              <span className={activeTab === item.id ? 'text-[var(--accent-indigo)]' : 'text-[var(--text-muted)]'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-[var(--border-subtle)]">
        <button className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[rgba(255,255,255,0.04)] transition-colors">
          <div className="relative">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium">
              SC
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--accent-green)] rounded-full border-2 border-[var(--depth-1)]" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">Sarah Chen</p>
            <p className="text-[10px] text-[var(--text-muted)] truncate">Admin</p>
          </div>
          <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
        </button>
      </div>
    </motion.aside>
  );
};