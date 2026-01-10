// src/components/Landing.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  ArrowRight,
  Brain,
  Network,
  Clock,
  Play,
  ChevronRight,
  Check,
  GitBranch,
  Lightbulb,
  Terminal,
} from 'lucide-react';
import { Button } from './ui/Button';

interface LandingProps {
  onGetStarted: () => void;
}

// Fast, functional animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: 'AI Knowledge Extraction',
      description: 'Capture decisions, workflows, and insights from conversations in real-time.',
      accent: 'indigo',
    },
    {
      icon: <Network className="w-5 h-5" />,
      title: 'Living Process Graph',
      description: 'Build semantic relationships across teams and projects automatically.',
      accent: 'violet',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: '10x Faster Onboarding',
      description: 'New members access contextual, searchable institutional knowledge instantly.',
      accent: 'cyan',
    },
  ];

  const stats = [
    { value: '10x', label: 'Faster onboarding' },
    { value: '85%', label: 'Less repeat questions' },
    { value: '3hrs', label: 'Saved per week' },
  ];

  return (
    <div className="min-h-screen bg-[var(--depth-0)] relative overflow-hidden">
      {/* Subtle background gradient (static, no parallax) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(129,140,248,0.3) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 flex items-center justify-between px-6 md:px-12 py-4 max-w-6xl mx-auto"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[var(--accent-indigo)] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-[var(--text-primary)]">KnowFlow</span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-3 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-3 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            How it works
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onGetStarted}>Sign In</Button>
          <Button size="sm" onClick={onGetStarted}>
            Get Started
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </motion.nav>

      {/* Hero Section - Left aligned */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--depth-1)] border border-[var(--border-subtle)] mb-6"
          >
            <Terminal className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            <span className="text-xs text-[var(--text-secondary)]">AI-Powered Process Intelligence</span>
          </motion.div>

          {/* Headline - Solid colors, not gradient */}
          <motion.h1
            variants={itemVariants}
            className="headline-xl text-4xl md:text-5xl lg:text-6xl mb-6"
          >
            Turn Conversations Into{' '}
            <span className="text-[var(--accent-violet)]">Living Knowledge</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="body-base text-base md:text-lg max-w-2xl mb-8"
          >
            KnowFlow captures team decisions, workflows, and institutional knowledge from
            everyday conversations — creating a searchable, living knowledge graph that
            grows smarter over time.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-3 mb-12"
          >
            <Button size="lg" onClick={onGetStarted}>
              <Zap className="w-4 h-4" />
              Start Capturing Free
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="w-4 h-4" />
              See How It Works
              <span className="text-[10px] text-[var(--text-muted)] ml-1">Interactive</span>
            </Button>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-8 pt-8 border-t border-[var(--border-subtle)]"
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="stat-value text-[var(--accent-indigo)]">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div id="features" className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid md:grid-cols-3 gap-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              className="card-accent hover:bg-[var(--depth-2)] transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-md bg-[var(--depth-2)] flex items-center justify-center mb-4 text-[var(--accent-indigo)] group-hover:bg-[rgba(129,140,248,0.1)] transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                {feature.title}
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Preview Window */}
      <motion.div
        id="preview"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pb-20"
      >
        <div className="glass-elevated overflow-hidden">
          {/* Window Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--depth-1)]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--depth-2)] border border-[var(--border-subtle)]">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-green)]" />
                <span className="text-[10px] text-[var(--text-muted)] mono">app.knowflow.ai</span>
              </div>
            </div>
            <div className="w-12" />
          </div>

          {/* Window Content */}
          <div className="p-6 md:p-8 min-h-[350px] bg-[var(--depth-0)]">
            <div className="max-w-2xl mx-auto">
              {/* Active indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-2 mb-6"
              >
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)]" />
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 w-2 h-2 rounded-full bg-[var(--accent-cyan)]"
                  />
                </div>
                <span className="text-xs text-[var(--text-muted)]">Listening to #product-team</span>
              </motion.div>

              {/* Conversation */}
              <div className="space-y-4">
                {[
                  {
                    user: 'Sarah Chen',
                    initials: 'SC',
                    message: "Let's go with the new pricing tier structure. $29/mo for teams.",
                    type: 'decision',
                    icon: <Check className="w-3 h-3" />,
                    badgeClass: 'badge-green',
                  },
                  {
                    user: 'Mike Ross',
                    initials: 'MR',
                    message: 'The deployment flow should go: staging → canary → production.',
                    type: 'workflow',
                    icon: <GitBranch className="w-3 h-3" />,
                    badgeClass: 'badge-indigo',
                  },
                  {
                    user: 'Emily Wei',
                    initials: 'EW',
                    message: 'Customer churns mainly happen in week 2 of trial.',
                    type: 'insight',
                    icon: <Lightbulb className="w-3 h-3" />,
                    badgeClass: 'badge-amber',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.2 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0">
                      {item.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[var(--text-primary)]">{item.user}</span>
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.3 + i * 0.2, type: 'spring' }}
                          className={`badge ${item.badgeClass}`}
                        >
                          {item.icon}
                          {item.type}
                        </motion.span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">{item.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Captured summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
                className="mt-6 p-4 bg-[var(--depth-1)] border border-[var(--border-default)] rounded-lg"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-[var(--accent-cyan)]" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">Knowledge Captured</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Decisions', count: 1, color: 'bg-[var(--accent-green)]' },
                    { label: 'Workflows', count: 1, color: 'bg-[var(--accent-indigo)]' },
                    { label: 'Insights', count: 1, color: 'bg-[var(--accent-amber)]' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 bg-[var(--depth-2)] rounded-md">
                      <div className={`w-1.5 h-1.5 rounded-full ${stat.color} mx-auto mb-2`} />
                      <div className="stat-value text-base">{stat.count}</div>
                      <div className="stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};