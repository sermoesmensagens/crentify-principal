
import React, { useState, useEffect, useCallback } from 'react';
import { Section } from './types';
import Dashboard from './components/Dashboard';
import BibleView from './components/BibleView';
import MentorAI from './components/MentorAI';
import Diary from './components/Diary';
import Workflow from './components/Workflow';
import AdminPanel from './components/AdminPanel';
import Habits from './components/Habits';
import Academy from './components/Academy';
import Studies from './components/Studies';
import Projects from './components/Projects';
import ProfileModal from './components/ProfileModal';
import ReadingPlans from './components/ReadingPlans';
import Auth from './components/Auth';
import Layout from './components/Layout';
import NotificationManager from './components/NotificationManager';
import { InstallButton } from './components/InstallButton';
import { useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

import { ADMIN_EMAILS } from './constants';
import { useDataContext } from './contexts/DataContext';
import { useBible } from './contexts/BibleContext';

const App: React.FC = () => {
  const { session, loading } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>(Section.DASHBOARD);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { isInitialLoading } = useDataContext();
  const { notes } = useBible();

  // Security Check
  useEffect(() => {
    if (activeSection === Section.ADMIN) {
      const userEmail = session?.user?.email;
      if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        setActiveSection(Section.DASHBOARD);
      }
    }
  }, [activeSection, session]);



  // Estados de Dados da Bíblia
  const userEmail = session?.user?.email;
  const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);

  if (loading || (session && isInitialLoading)) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute -inset-4 bg-brand/20 rounded-full blur-2xl animate-pulse"></div>
          <Loader2 className="h-16 w-16 text-brand animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-white font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">CRENTIFY</p>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[8px]">Sincronizando sua jornada...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }


  return (
    <>
    <Layout
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onProfileClick={() => setShowProfileModal(true)}
      userEmail={userEmail}
    >
      {activeSection === Section.DASHBOARD && <Dashboard />}
      {activeSection === Section.BIBLE && <BibleView />}
      {activeSection === Section.ACADEMY && <Academy />}
      {activeSection === Section.PLANOS && <ReadingPlans setActiveSection={setActiveSection} />}
      {activeSection === Section.STUDIES && <Studies />}
      {activeSection === Section.HABITS && <Habits />}
      {activeSection === Section.MENTOR && <MentorAI />}
      {activeSection === Section.DIARY && <Diary />}
      {activeSection === Section.WORKFLOW && <Workflow />}
      {activeSection === Section.PROJECTS && <Projects />}
      {activeSection === Section.ADMIN && isAdmin && <AdminPanel />}

      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} bibleNotes={notes} />}

    </Layout>
    <NotificationManager />
    </>
  );
};

export default App;