// src/components/SettingsPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    User,
    Bell,
    Shield,
    Database,
    Palette,
    Globe,
    Key,
    Zap,
    ChevronRight,
    Check,
    Moon,
    Sun,
} from 'lucide-react';
import { Button } from './ui/Button';

interface SettingsPageProps {
    onCapture: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onCapture }) => {
    const [activeSection, setActiveSection] = useState('general');
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        weekly: false,
        mentions: true,
    });
    const [theme, setTheme] = useState('dark');

    const sections = [
        { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
        { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
        { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
        { id: 'integrations', label: 'Integrations', icon: <Zap className="w-4 h-4" /> },
        { id: 'data', label: 'Data & Privacy', icon: <Database className="w-4 h-4" /> },
    ];

    return (
        <div className="flex-1 overflow-auto bg-[var(--depth-0)]">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[var(--depth-1)] border-b border-[var(--border-subtle)] px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h1>
                        <p className="text-xs text-[var(--text-muted)]">Manage your preferences and account</p>
                    </div>
                    <Button size="sm">
                        <Check className="w-3 h-3" />
                        Save Changes
                    </Button>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <nav className="w-56 p-4 border-r border-[var(--border-subtle)]">
                    <div className="space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`sidebar-item w-full text-left ${activeSection === section.id ? 'active' : ''}`}
                            >
                                <span className={activeSection === section.id ? 'text-[var(--accent-indigo)]' : ''}>
                                    {section.icon}
                                </span>
                                <span>{section.label}</span>
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Content */}
                <div className="flex-1 p-6 max-w-2xl">
                    {activeSection === 'general' && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <div>
                                <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Appearance</h2>
                                <div className="card">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-[var(--depth-2)] flex items-center justify-center">
                                                <Palette className="w-4 h-4 text-[var(--accent-indigo)]" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-[var(--text-primary)]">Theme</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">Select your preferred theme</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-[var(--depth-2)] rounded-md p-1">
                                            <button
                                                onClick={() => setTheme('dark')}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${theme === 'dark' ? 'bg-[var(--depth-1)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                                                    }`}
                                            >
                                                <Moon className="w-3 h-3" />
                                                Dark
                                            </button>
                                            <button
                                                onClick={() => setTheme('light')}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${theme === 'light' ? 'bg-[var(--depth-1)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                                                    }`}
                                            >
                                                <Sun className="w-3 h-3" />
                                                Light
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Language & Region</h2>
                                <div className="card space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-[var(--depth-2)] flex items-center justify-center">
                                                <Globe className="w-4 h-4 text-[var(--accent-cyan)]" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-[var(--text-primary)]">Language</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">English (US)</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeSection === 'notifications' && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <div>
                                <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Notification Preferences</h2>
                                <div className="card space-y-4">
                                    {[
                                        { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                                        { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
                                        { key: 'weekly', label: 'Weekly Digest', desc: 'Summary of weekly activity' },
                                        { key: 'mentions', label: 'Mentions', desc: 'When someone mentions you' },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between py-2">
                                            <div>
                                                <p className="text-xs font-medium text-[var(--text-primary)]">{item.label}</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                                                className={`w-10 h-5 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications]
                                                        ? 'bg-[var(--accent-indigo)]'
                                                        : 'bg-[var(--depth-2)]'
                                                    }`}
                                            >
                                                <motion.div
                                                    animate={{ x: notifications[item.key as keyof typeof notifications] ? 20 : 2 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="w-4 h-4 bg-white rounded-full shadow"
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeSection === 'security' && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <div>
                                <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Security Settings</h2>
                                <div className="card space-y-4">
                                    <div className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-[var(--depth-2)] flex items-center justify-center">
                                                <Key className="w-4 h-4 text-[var(--accent-amber)]" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-[var(--text-primary)]">Change Password</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">Last changed 30 days ago</p>
                                            </div>
                                        </div>
                                        <Button variant="secondary" size="sm">Update</Button>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-[var(--depth-2)] flex items-center justify-center">
                                                <Shield className="w-4 h-4 text-[var(--accent-green)]" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-[var(--text-primary)]">Two-Factor Authentication</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">Add an extra layer of security</p>
                                            </div>
                                        </div>
                                        <span className="badge badge-green">Enabled</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {(activeSection === 'profile' || activeSection === 'integrations' || activeSection === 'data') && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-center justify-center py-16"
                        >
                            <div className="w-12 h-12 rounded-lg bg-[var(--depth-2)] flex items-center justify-center mb-4">
                                <Settings className="w-5 h-5 text-[var(--text-muted)]" />
                            </div>
                            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">
                                {sections.find(s => s.id === activeSection)?.label} Settings
                            </h3>
                            <p className="text-xs text-[var(--text-muted)]">Coming soon</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};
