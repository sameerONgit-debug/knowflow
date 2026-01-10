import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowRight, Lock, User, Mail } from 'lucide-react';

interface AuthPageProps {
    onComplete: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onComplete }) => {
    const [isLogin, setIsLogin] = useState(true);
    const { login, register, isLoading } = useAuth();
    const [error, setError] = useState('');

    // Form state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (username.length < 3 || password.length < 3) {
            setError('Username and password must be at least 3 characters');
            return;
        }

        try {
            if (isLogin) {
                await login(username, password);
            } else {
                await register(username, password, fullName);
            }
            onComplete();
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-[var(--depth-0)] p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="glass-panel p-8 rounded-2xl border border-[var(--border-subtle)] relative overflow-hidden">
                    {/* Ambient Glow */}
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-light text-[var(--text-primary)] mb-2">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {isLogin ? 'Enter your credentials to continue' : 'Join KnowFlow to map your processes'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-[var(--depth-1)] border border-[var(--border-subtle)] rounded-lg py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-colors placeholder-[var(--text-muted)]"
                                    />
                                </div>
                            </div>

                            {!isLogin && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="space-y-2 overflow-hidden"
                                >
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                                        <input
                                            type="text"
                                            placeholder="Full Name (Optional)"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-[var(--depth-1)] border border-[var(--border-subtle)] rounded-lg py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-colors placeholder-[var(--text-muted)]"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[var(--depth-1)] border border-[var(--border-subtle)] rounded-lg py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-colors placeholder-[var(--text-muted)]"
                                    />
                                </div>
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-xs text-red-400 text-center"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg py-2 text-sm font-medium transition-all flex items-center justify-center gap-2 group"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? 'Sign In' : 'Create Account'}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
