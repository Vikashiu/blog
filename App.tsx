
import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import BlogList from './pages/BlogList';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';
import PostView from './pages/PostView';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import NotificationSystem from './components/NotificationSystem';
import { useStore } from './store/useStore';

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
    className="w-full"
  >
    {children}
  </motion.div>
);

export default function App() {
  const { activeView, setActiveView, currentPostId, checkAuth } = useStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-white font-sans selection:bg-orange-500/30 selection:text-orange-500 transition-colors duration-300">
      <Navbar onViewChange={setActiveView} currentView={activeView} />
      <NotificationSystem />
      <main>
        <AnimatePresence mode="wait">
          {activeView === 'landing' && (
            <PageWrapper key="landing">
              <LandingPage onViewChange={setActiveView} />
            </PageWrapper>
          )}
          {activeView === 'login' && (
            <PageWrapper key="login">
              <LoginPage onViewChange={setActiveView} />
            </PageWrapper>
          )}
          {activeView === 'home' && (
            <PageWrapper key="home">
              <BlogList onViewChange={setActiveView} />
            </PageWrapper>
          )}
          {activeView === 'profile' && (
            <PageWrapper key="profile">
              <ProfilePage onViewChange={setActiveView} />
            </PageWrapper>
          )}
          {activeView === 'dashboard' && (
            <PageWrapper key="dashboard">
              <Dashboard onViewChange={setActiveView} />
            </PageWrapper>
          )}
          {activeView === 'analytics' && (
            <PageWrapper key="analytics">
              <AnalyticsPage onViewChange={setActiveView} />
            </PageWrapper>
          )}
          {activeView === 'settings' && (
            <PageWrapper key="settings">
              <SettingsPage onViewChange={setActiveView} />
            </PageWrapper>
          )}
          {activeView === 'create' && (
            <PageWrapper key="create">
              <EditorPage onViewChange={setActiveView} />
            </PageWrapper>
          )}
          {activeView === 'edit' && (
            <PageWrapper key="edit">
              <EditorPage onViewChange={setActiveView} postId={currentPostId} />
            </PageWrapper>
          )}
          {activeView === 'post' && currentPostId && (
            <PageWrapper key="post">
              <PostView postId={currentPostId} />
            </PageWrapper>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
