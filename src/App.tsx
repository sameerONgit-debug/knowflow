// src/App.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landing } from './components/Landing';
import { Sidebar } from './components/Sidebar';
import { SessionPage } from './components/SessionPage';
import { GraphPage } from './components/GraphPage';
import { SOPPage } from './components/SOPPage';
import { RisksPage } from './components/RisksPage';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { CustomCursor } from './components/ui/CustomCursor';
import { Folder, Inbox, Loader2, Users } from 'lucide-react';

// Wrapper to provide context
const AppContent: React.FC = () => {
  const { currentProcess } = useApp();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [view, setView] = useState<'landing' | 'auth' | 'dashboard' | 'session'>('landing');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Handle initial auth state
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && view === 'landing') {
      // Optional: Auto-redirect to dashboard if logged in?
      // For now, let landing page handle it via "Get Started" or "Go to Dashboard"
    }
  }, [authLoading, isAuthenticated]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setView('dashboard');
    } else {
      setView('auth');
    }
  };

  const handleAuthComplete = () => {
    setView('dashboard');
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (view === 'session') {
      setView('dashboard');
    }
  };

  const handleStartCapture = () => {
    setView('session');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--depth-0)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Render main content based on view/activeTab
  const renderContent = () => {
    if (view === 'auth') {
      return <AuthPage onComplete={handleAuthComplete} />;
    }

    if (view === 'session') {
      return (
        <SessionPage
          onBack={handleBackToDashboard}
          onComplete={handleBackToDashboard}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <GraphPage />;
      case 'flows':
        return <SOPPage />;
      case 'insights':
        return <RisksPage />;
      case 'team':
        return (
          <div className="flex-1 flex items-center justify-center bg-[var(--depth-0)]">
            <div className="text-center">
              {/* Users icon imported below or simple placeholder */}
              <p className="text-sm text-[var(--text-secondary)]">Team Management</p>
              <p className="text-xs text-[var(--text-muted)]">Coming soon in v2</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex-1 flex items-center justify-center bg-[var(--depth-0)]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 animate-spin" />
              <p className="text-sm text-[var(--text-secondary)]">Settings</p>
            </div>
          </div>
        );
      default:
        return <GraphPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--depth-0)]">
      <CustomCursor />
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Landing onGetStarted={handleGetStarted} />
          </motion.div>
        ) : view === 'auth' ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex h-screen"
          >
            <AuthPage onComplete={handleAuthComplete} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex h-screen"
          >
            <Sidebar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onCapture={handleStartCapture}
            />
            <main className="flex-1 flex flex-col relative overflow-hidden">
              {renderContent()}
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;