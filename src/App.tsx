import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  Mic,
  FileText,
  Database,
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { SystemsView } from './components/SystemsView';
import { ReportsView } from './components/ReportsView';
import { LiveInterviewRoom } from './components/LiveInterviewRoom';
import { DatabaseView } from './components/DatabaseView';
import { IntervieweePortal } from './components/IntervieweePortal';
import { CreateInterviewModal } from './components/CreateInterviewModal';
import { ShareModal } from './components/ShareModal';
import { AuthScreen } from './components/AuthScreen';
import { TutorialModal } from './components/TutorialModal';
import { ProfileModal } from './components/ProfileModal';
import { api } from './lib/api';
import { SystemUnderStudy, InterviewSession, UserProfile } from './types';

export function App() {
  // Check URL query parameter for public candidate token
  const [urlToken, setUrlToken] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);

  // Collapsible & deployable sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('reqvoice_sidebar_open');
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
    } catch {
      return true;
    }
  });

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // default true while checking
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'usr-01',
    username: 'sophia_reynolds',
    name: 'Dr. Sophia Reynolds',
    email: 's.reynolds@reqvoice.systems',
    role: 'Principal Requirements Architect',
    department: 'Systems Engineering',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    hasCompletedTutorial: true,
    isFirstTime: false,
  });

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Application core data
  const [systems, setSystems] = useState<SystemUnderStudy[]>([]);
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);

  // Modal dialog states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [shareModalSession, setShareModalSession] = useState<InterviewSession | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);

  // Parse token from window location
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        setUrlToken(token);
      }
    }
  }, []);

  // Check auth session on startup
  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    setAuthChecking(true);
    try {
      const session = await api.auth.me();
      if (session.user) {
        setCurrentUser(session.user);
        setIsAuthenticated(true);
        if (session.user.isFirstTime) {
          setShowTutorialModal(true);
        }
      } else {
        setIsAuthenticated(false);
      }

      // Load initial systems & interview sessions
      const [sysRes, invRes] = await Promise.all([
        api.systems.list(),
        api.interviews.list(),
      ]);
      setSystems(sysRes.systems || []);
      setInterviews(invRes.interviews || []);
      if (invRes.interviews?.length > 0 && !selectedInterviewId) {
        setSelectedInterviewId(invRes.interviews[0].id);
      }
    } catch (err) {
      console.warn('Initial session check error:', err);
    } finally {
      setAuthChecking(false);
    }
  };

  const handleRefreshInterviews = async () => {
    try {
      const res = await api.interviews.list();
      setInterviews(res.interviews || []);
    } catch (e) {
      console.warn('Refresh interviews failed', e);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('reqvoice_sidebar_open', String(next));
      } catch {}
      return next;
    });
  };

  const handleSelectSystem = (sysId: string) => {
    setActiveTab('systems');
  };

  const handleStartLiveInterview = (invId: string) => {
    setSelectedInterviewId(invId);
    setActiveTab('live');
  };

  const handleLaunchInterviewForSystem = (system: SystemUnderStudy) => {
    setShowCreateModal(true);
  };

  const handleViewSummary = (invId: string) => {
    setSelectedInterviewId(invId);
    setActiveTab('reports');
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {}
    setIsAuthenticated(false);
  };

  // If candidate is visiting via direct share token
  const effectiveCandidateToken = urlToken || previewToken;
  if (effectiveCandidateToken) {
    return (
      <IntervieweePortal
        token={effectiveCandidateToken}
        onExitPreview={previewToken ? () => setPreviewToken(null) : undefined}
      />
    );
  }

  // If unauthenticated, display authentication login screen
  if (!authChecking && !isAuthenticated) {
    return (
      <AuthScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          checkAuthAndLoadData();
          if (user.isFirstTime) {
            setShowTutorialModal(true);
          }
        }}
      />
    );
  }

  const selectedLiveInterview =
    interviews.find((i) => i.id === selectedInterviewId) || interviews[0];

  const mobileNavItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'systems', label: 'Systems', icon: Layers },
    { id: 'live', label: 'Monitor', icon: Mic },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'database', label: 'Database', icon: Database },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Primary Deployable & Collapsible Sidebar */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenTutorial={() => setShowTutorialModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        {/* Top Header */}
        <TopBar
          currentUser={currentUser}
          activeTab={activeTab}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenTutorial={() => setShowTutorialModal(true)}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 lg:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              systems={systems}
              interviews={interviews}
              onSelectSystem={handleSelectSystem}
              onStartLiveInterview={handleStartLiveInterview}
              onOpenCreateInterview={() => setShowCreateModal(true)}
              onOpenShareModal={(inv) => setShareModalSession(inv)}
              onViewSummary={handleViewSummary}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'systems' && (
            <SystemsView
              systems={systems}
              onRefreshSystems={checkAuthAndLoadData}
              onLaunchInterviewForSystem={handleLaunchInterviewForSystem}
            />
          )}

          {activeTab === 'live' && (
            selectedLiveInterview ? (
              <LiveInterviewRoom
                interview={selectedLiveInterview}
                onFinishInterview={() => {
                  handleRefreshInterviews();
                  setActiveTab('reports');
                }}
                onOpenShareModal={() => setShareModalSession(selectedLiveInterview)}
                onRefreshInterview={handleRefreshInterviews}
              />
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
                No active interview session selected.
              </div>
            )
          )}

          {activeTab === 'reports' && (
            <ReportsView
              systems={systems}
              interviews={interviews}
              selectedInterviewId={selectedInterviewId}
              onRefreshInterviews={handleRefreshInterviews}
              onOpenShareModal={(inv) => setShareModalSession(inv)}
            />
          )}

          {activeTab === 'database' && <DatabaseView />}
        </main>

        {/* Desktop Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 px-4 text-center text-xs text-slate-500 hidden lg:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="font-semibold text-slate-400">ReqVoice AI</span>
            <span className="text-[11px] text-slate-500">
              Requirements Studio • MySQL Relational Engine
            </span>
          </div>
        </footer>

      </div>

      {/* Bottom Mobile Tab Bar (Visible on mobile/tablet < 1024px) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 flex items-center justify-around h-16 px-2 shadow-2xl safe-area-pb"
      >
        {mobileNavItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-semibold text-white' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <CreateInterviewModal
        systems={systems}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newInv) => {
          handleRefreshInterviews();
          setSelectedInterviewId(newInv.id);
          setShareModalSession(newInv);
        }}
      />

      <ShareModal
        interview={shareModalSession}
        isOpen={!!shareModalSession}
        onClose={() => setShareModalSession(null)}
        onOpenDirectTest={(token) => {
          setPreviewToken(token);
        }}
      />

      <ProfileModal
        user={currentUser}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUserUpdated={(updated) => setCurrentUser(updated)}
        onLogout={handleLogout}
        onOpenTutorial={() => setShowTutorialModal(true)}
      />

      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        onFinished={() => {
          setCurrentUser((prev) => ({ ...prev, hasCompletedTutorial: true, isFirstTime: false }));
        }}
      />

    </div>
  );
}

export default App;
