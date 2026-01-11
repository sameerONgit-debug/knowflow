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
  LogOut,
  X,
  Mail,
  Briefcase,
  Building,
  Clock,
  Hash
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
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
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = React.useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

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

      {/* User Profile Footer */}
      <div className="p-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
        <button
          onClick={() => setShowProfile(true)}
          className="flex-1 flex items-center gap-3 p-2 rounded-md hover:bg-[rgba(255,255,255,0.04)] transition-colors group text-left min-w-0"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium uppercase">
              {user ? getInitials(user.full_name || user.username) : '??'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--accent-green)] rounded-full border-2 border-[var(--depth-1)]" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">
              {user?.full_name || user?.username || 'Guest'}
            </p>
            {user ? (
              <p className="text-[10px] text-[var(--text-muted)] truncate capitalize">
                View Profile
              </p>
            ) : (
              <p className="text-[10px] text-[var(--text-muted)] truncate capitalize">
                Exploring
              </p>
            )}
          </div>
        </button>

        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to sign out?')) {
              logout();
            }
          }}
          className="p-2 rounded-md hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--depth-1)] border border-[var(--border-default)] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">User Profile</h3>
                <button onClick={() => setShowProfile(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold uppercase shadow-lg">
                    {getInitials(user.full_name || user.username)}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-[var(--text-primary)]">{user.full_name}</h4>
                    <p className="text-sm text-[var(--text-muted)]">@{user.username}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm p-2 rounded bg-[var(--depth-2)] border border-[var(--border-subtle)]">
                    <Mail className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <div className="flex-1">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Email</p>
                      <p className="text-[var(--text-secondary)]">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm p-2 rounded bg-[var(--depth-2)] border border-[var(--border-subtle)]">
                      <Hash className="w-4 h-4 text-[var(--text-tertiary)]" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">ID</p>
                        <p className="text-[var(--text-secondary)] truncate">{user.employee_id || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-2 rounded bg-[var(--depth-2)] border border-[var(--border-subtle)]">
                      <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Exp</p>
                        <p className="text-[var(--text-secondary)] truncate">{user.experience_years || 0} Years</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm p-2 rounded bg-[var(--depth-2)] border border-[var(--border-subtle)]">
                    <Briefcase className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <div className="flex-1">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Role</p>
                      <p className="text-[var(--text-secondary)]">{user.role || 'Unspecified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm p-2 rounded bg-[var(--depth-2)] border border-[var(--border-subtle)]">
                    <Building className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <div className="flex-1">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Department</p>
                      <p className="text-[var(--text-secondary)]">{user.department || 'Unspecified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};