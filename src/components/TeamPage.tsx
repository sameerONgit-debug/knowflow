// src/components/TeamPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Mail,
    Plus,
    MoreHorizontal,
    Crown,
    Shield,
    User,
    Activity,
    FileText,
    Search,
} from 'lucide-react';
import { Button } from './ui/Button';

interface TeamPageProps {
    onCapture: () => void;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    avatar: string;
    contributions: number;
    lastActive: string;
    status: 'online' | 'offline' | 'away';
}

export const TeamPage: React.FC<TeamPageProps> = ({ onCapture }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const teamMembers: TeamMember[] = [
        {
            id: '1',
            name: 'Sarah Chen',
            email: 'sarah@company.com',
            role: 'admin',
            avatar: 'SC',
            contributions: 156,
            lastActive: 'Now',
            status: 'online',
        },
        {
            id: '2',
            name: 'Mike Ross',
            email: 'mike@company.com',
            role: 'editor',
            avatar: 'MR',
            contributions: 89,
            lastActive: '2h ago',
            status: 'away',
        },
        {
            id: '3',
            name: 'Emily Wei',
            email: 'emily@company.com',
            role: 'editor',
            avatar: 'EW',
            contributions: 124,
            lastActive: '30m ago',
            status: 'online',
        },
        {
            id: '4',
            name: 'Alex Johnson',
            email: 'alex@company.com',
            role: 'viewer',
            avatar: 'AJ',
            contributions: 23,
            lastActive: '1d ago',
            status: 'offline',
        },
        {
            id: '5',
            name: 'Jordan Lee',
            email: 'jordan@company.com',
            role: 'editor',
            avatar: 'JL',
            contributions: 67,
            lastActive: '5h ago',
            status: 'offline',
        },
    ];

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Crown className="w-3 h-3" />;
            case 'editor': return <Shield className="w-3 h-3" />;
            default: return <User className="w-3 h-3" />;
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return 'badge-amber';
            case 'editor': return 'badge-indigo';
            default: return '';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'bg-[var(--accent-green)]';
            case 'away': return 'bg-[var(--accent-amber)]';
            default: return 'bg-[var(--text-muted)]';
        }
    };

    const filteredMembers = teamMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = [
        { label: 'Team Members', value: teamMembers.length.toString() },
        { label: 'Online Now', value: teamMembers.filter(m => m.status === 'online').length.toString() },
        { label: 'Total Contributions', value: teamMembers.reduce((acc, m) => acc + m.contributions, 0).toString() },
        { label: 'Admins', value: teamMembers.filter(m => m.role === 'admin').length.toString() },
    ];

    return (
        <div className="flex-1 overflow-auto bg-[var(--depth-0)]">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[var(--depth-1)] border-b border-[var(--border-subtle)] px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Team</h1>
                        <p className="text-xs text-[var(--text-muted)]">Manage team members and permissions</p>
                    </div>
                    <Button size="sm">
                        <Plus className="w-3 h-3" />
                        Invite Member
                    </Button>
                </div>
            </header>

            <div className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="card"
                        >
                            <p className="stat-label mb-1">{stat.label}</p>
                            <span className="stat-value">{stat.value}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Search */}
                <div className="mb-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input w-full pl-9"
                        />
                    </div>
                </div>

                {/* Team Members Table */}
                <div className="card overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border-subtle)]">
                                <th className="text-left py-3 px-4 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Member</th>
                                <th className="text-left py-3 px-4 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Role</th>
                                <th className="text-left py-3 px-4 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Contributions</th>
                                <th className="text-left py-3 px-4 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Last Active</th>
                                <th className="text-right py-3 px-4 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map((member, index) => (
                                <motion.tr
                                    key={member.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.15, delay: index * 0.03 }}
                                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--depth-2)] transition-colors"
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium">
                                                    {member.avatar}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${getStatusColor(member.status)} rounded-full border-2 border-[var(--depth-1)]`} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-[var(--text-primary)]">{member.name}</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`badge ${getRoleBadge(member.role)}`}>
                                            {getRoleIcon(member.role)}
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-3 h-3 text-[var(--text-muted)]" />
                                            <span className="text-xs text-[var(--text-secondary)] mono">{member.contributions}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-xs text-[var(--text-tertiary)]">{member.lastActive}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                                            <MoreHorizontal className="w-4 h-4 text-[var(--text-muted)]" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
