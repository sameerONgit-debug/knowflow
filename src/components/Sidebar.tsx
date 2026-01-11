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
  Hash,
  Pencil,
  Check,
  Loader2
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
  const { user, logout, updateProfile } = useAuth();
  const [showProfile, setShowProfile] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState<any>({});
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!showProfile) {
      setIsEditing(false);
      setEditForm({});
    }
  }, [showProfile]);

  const handleStartEdit = () => {
    if (!user) return;
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      employee_id: user.employee_id || '',
      role: user.role || '',
      department: user.department || '',
      experience_years: user.experience_years || 0
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        ...editForm,
        experience_years: Number(editForm.experience_years) || 0
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

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
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">User Profile</h3>
                  {!isEditing && (
                    <button
                      onClick={handleStartEdit}
                      className="p-1 rounded hover:bg-[var(--depth-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      title="Edit Profile"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button onClick={() => setShowProfile(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold uppercase shadow-lg">
                    {getInitials(user.full_name || user.username)}
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="w-full bg-[var(--depth-2)] border border-[var(--border-subtle)] rounded px-2 py-1 text-sm text-[var(--text-primary)] mb-1"
                        placeholder="Full Name"
                      />
                    ) : (
                      <h4 className="text-lg font-medium text-[var(--text-primary)]">{user.full_name}</h4>
                    )}
                    <p className="text-sm text-[var(--text-muted)]">@{user.username}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm p-2 rounded bg-[var(--depth-2)] border border-[var(--border-subtle)]">
                    <Mail className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <div className="flex-1 w-full">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Email</p>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full bg-transparent border-b border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-[var(--text-secondary)]">{user.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm p-2 rounded bg-[var(--depth-2)] border border-[var(--border-subtle)]">
                      <Hash className="w-4 h-4 text-[var(--text-tertiary)]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">ID</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.employee_id}
                            onChange={e => setEditForm({ ...editForm, employee_id: e.target.value })}
                            className="w-full bg-transparent border-b border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-[var(--text-secondary)] truncate">{user.employee_id || 'N/A'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-2 rounded bg-[var(--depth-2)] border border-[var(--border-subtle)]">
                      <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Exp (Yrs)</p>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.experience_years}
                            onChange={e => setEditForm({ ...editForm, experience_years: e.target.value })}
                            className="w-full bg-transparent border-b border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-[var(--text-secondary)] truncate">{user.experience_years || 0} Years</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm p-2 rounded bg-[var(--depth-2)] border border-[var(--border-subtle)]">
                    <Briefcase className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <div className="flex-1 w-full">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Role</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.role}
                          onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                          className="w-full bg-transparent border-b border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-[var(--text-secondary)]">{user.role || 'Unspecified'}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm p-2 rounded bg-[var(--depth-2)] border border-[var(--border-subtle)]">
                    <Building className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <div className="flex-1 w-full">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Department</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.department}
                          onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                          className="w-full bg-transparent border-b border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-[var(--text-secondary)]">{user.department || 'Unspecified'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="px-4 py-2 bg-[var(--depth-3)] hover:bg-[var(--depth-2)] text-[var(--text-primary)] rounded-md text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};