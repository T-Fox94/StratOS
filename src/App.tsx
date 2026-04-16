import React from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { MobileHeader } from './components/layout/MobileHeader';
import { TopBar } from './components/layout/TopBar';
import { Overview } from './components/dashboard/Overview';
import { ClientsManagement } from './components/clients/ClientsManagement';
import { ContentCreation } from './components/content/ContentCreation';
import { SocialAccounts } from './components/social/SocialAccounts';
import { Calendar } from './components/calendar/Calendar';
import { CrisisManagement } from './components/crisis/CrisisManagement';
import { ScopeGuardian } from './components/scope/ScopeGuardian';
import { TrendWatcher } from './components/trends/TrendWatcher';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { AutomationCenter } from './components/automation/AutomationCenter';
import { CreativeLab } from './components/creative/CreativeLab';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { ProfileSettings } from './components/settings/ProfileSettings';
import { AgencyConfig } from './components/settings/AgencyConfig';
import { DeveloperSettings } from './components/settings/DeveloperSettings';
import { Webhooks } from './components/settings/Webhooks';
import { Monitoring } from './components/monitoring/Monitoring';
import { MobileNav } from './components/layout/MobileNav';
import { AIChatWidget } from './components/AIChatWidget';
import { useAgencyStore } from './store/useAgencyStore';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { cn } from './lib/utils';

import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient();

function AppContent() {
  const { activeView, theme, sidebarOpen } = useAgencyStore();
  const { user, loading } = useAuth();

  console.log('AppContent Rendering:', { activeView, theme, loading, hasUser: !!user });
  if (user) {
    console.log('User Email Verified:', user.emailVerified);
  }

  // Sync data with Firestore
  useFirestoreSync();

  React.useEffect(() => {
    console.log('Theme Effect Triggered:', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (loading) {
    console.log('App is Loading...');
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    console.log('Redirecting to LoginPage because: No User');
    return <LoginPage />;
  }

  console.log('Rendering Main View:', activeView);

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <Overview />;
      case 'clients':
        return <ClientsManagement />;
      case 'content':
        return <ContentCreation />;
      case 'accounts':
        return <SocialAccounts />;
      case 'calendar':
        return <Calendar />;
      case 'crisis':
        return <CrisisManagement />;
      case 'scope':
        return <ScopeGuardian />;
      case 'trends':
        return <TrendWatcher />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'automation':
        return <AutomationCenter />;
      case 'creative-lab':
        return <CreativeLab />;
      case 'notifications':
        return <NotificationCenter />;
      case 'profile-settings':
        return <ProfileSettings />;
      case 'agency-config':
        return <AgencyConfig />;
      case 'developer-settings':
        return <DeveloperSettings />;
      case 'webhooks':
        return <Webhooks />;
      case 'monitoring':
        return <Monitoring />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-2xl font-bold">?</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-600">View Under Construction</h2>
            <p className="text-sm">The {activeView} module is currently being optimized.</p>
          </div>
        );
    }
  };

  return (
    <div className={cn(
      "min-h-screen font-sans transition-colors duration-300",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      <Sidebar />
      <MobileHeader />
      
      <div 
        className={cn(
          "flex flex-col transition-all duration-300",
          "ml-0 pt-14 pb-20", // Mobile defaults
          sidebarOpen ? "md:ml-64" : "md:ml-16", // Desktop margins
          "md:pt-0 md:pb-0" // Desktop resets
        )}
      >
        <TopBar />
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>

      <AIChatWidget />
      <MobileNav />
    </div>
  );
}


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <Toaster position="top-right" richColors />
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}
