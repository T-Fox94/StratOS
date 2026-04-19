import React from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { MobileHeader } from './components/layout/MobileHeader';
import { TopBar } from './components/layout/TopBar';
const Overview = React.lazy(() => import('./components/dashboard/Overview').then(m => ({ default: m.Overview })));
const ClientsManagement = React.lazy(() => import('./components/clients/ClientsManagement').then(m => ({ default: m.ClientsManagement })));
const ContentCreation = React.lazy(() => import('./components/content/ContentCreation').then(m => ({ default: m.ContentCreation })));
const SocialAccounts = React.lazy(() => import('./components/social/SocialAccounts').then(m => ({ default: m.SocialAccounts })));
const Calendar = React.lazy(() => import('./components/calendar/Calendar').then(m => ({ default: m.Calendar })));
const CrisisManagement = React.lazy(() => import('./components/crisis/CrisisManagement').then(m => ({ default: m.CrisisManagement })));
const ScopeGuardian = React.lazy(() => import('./components/scope/ScopeGuardian').then(m => ({ default: m.ScopeGuardian })));
const TrendWatcher = React.lazy(() => import('./components/trends/TrendWatcher').then(m => ({ default: m.TrendWatcher })));
const AnalyticsDashboard = React.lazy(() => import('./components/analytics/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const AutomationCenter = React.lazy(() => import('./components/automation/AutomationCenter').then(m => ({ default: m.AutomationCenter })));
const CreativeLab = React.lazy(() => import('./components/creative/CreativeLab').then(m => ({ default: m.CreativeLab })));
const NotificationCenter = React.lazy(() => import('./components/notifications/NotificationCenter').then(m => ({ default: m.NotificationCenter })));
const ProfileSettings = React.lazy(() => import('./components/settings/ProfileSettings').then(m => ({ default: m.ProfileSettings })));
const AgencyConfig = React.lazy(() => import('./components/settings/AgencyConfig').then(m => ({ default: m.AgencyConfig })));
const DeveloperSettings = React.lazy(() => import('./components/settings/DeveloperSettings').then(m => ({ default: m.DeveloperSettings })));
const Webhooks = React.lazy(() => import('./components/settings/Webhooks').then(m => ({ default: m.Webhooks })));
const Monitoring = React.lazy(() => import('./components/monitoring/Monitoring').then(m => ({ default: m.Monitoring })));
import { MobileNav } from './components/layout/MobileNav';
import { AIChatWidget } from './components/AIChatWidget';
import { useAgencyStore } from './store/useAgencyStore';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { usePushNotifications } from './hooks/usePushNotifications';
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

  // Initialize Native Push Notifications
  usePushNotifications();

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
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }>
              {renderView()}
            </React.Suspense>
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
