import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ViewType = 
  | 'overview' 
  | 'clients' 
  | 'accounts' 
  | 'calendar' 
  | 'content' 
  | 'scope' 
  | 'crisis' 
  | 'trends' 
  | 'automation' 
  | 'analytics' 
  | 'webhooks' 
  | 'monitoring'
  | 'notifications'
  | 'creative-lab'
  | 'profile-settings'
  | 'agency-config'
  | 'developer-settings';

export interface Client {
  id: string;
  name: string;
  slug: string;
  industry: string;
  logo?: string;
  website?: string;
  status: string;
  riskLevel: string;
  monthlyQuota: number;
  currentMonthUsage: number;
  toneOfVoice?: string;
  visualStyle?: string;
  brandColors?: string[];
  approvedHashtags?: string[];
  doNotUse?: string;
  primaryColor?: string;
}

export interface Post {
  id: string;
  groupId?: string;
  title: string;
  caption: string;
  mediaUrl?: string;
  platform: string;
  status: 'draft' | 'pending' | 'in-review' | 'approved' | 'rejected' | 'scheduled' | 'published';
  scheduledFor?: string;
  clientId: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  status?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface CrisisEvent {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  clientId: string;
  createdAt: string;
}

export interface Trend {
  id: string;
  name: string;
  description: string;
  platform: string;
  relevanceScore: number;
  riskLevel: string;
}

export interface SocialAccount {
  id: string;
  platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok';
  handle: string;
  clientId: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSynced?: string;
}

export interface ScopeRequest {
  id: string;
  clientId: string;
  type: string;
  description: string;
  date: string;
  amount: number;
  status: 'unbilled' | 'billed';
  createdAt?: any;
}

export interface AgencySettings {
  name: string;
  defaultHourlyRate: number;
  currency: string;
  timezone: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'editor' | 'client';
  clientId?: string;
  createdAt?: any;
}

export interface ClientSocialConfig {
  id: string;
  clientId: string;
  facebookAppId?: string;
  facebookAppSecret?: string;
  instagramAppId?: string;
  instagramAppSecret?: string;
  linkedinClientId?: string;
  linkedinClientSecret?: string;
  tiktokKey?: string;
  tiktokSecret?: string;
  twitterClientId?: string;
  twitterClientSecret?: string;
  fbVerifyToken?: string;
  updatedAt?: any;
}

export interface Notification {
  id: string;
  type: 'crisis' | 'content' | 'team' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  clientId?: string;
}

interface AgencyState {
  currentClient: Client | null;
  clients: Client[];
  posts: Post[];
  crisisEvents: CrisisEvent[];
  trends: Trend[];
  socialAccounts: SocialAccount[];
  scopeRequests: ScopeRequest[];
  notifications: Notification[];
  agencySettings: AgencySettings;
  activeView: ViewType;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  users: UserProfile[];
  clientSocialConfigs: ClientSocialConfig[];
  
  setCurrentClient: (client: Client | null) => void;
  clearClientContext: () => void;
  setClients: (clients: Client[]) => void;
  setUsers: (users: UserProfile[]) => void;
  setClientSocialConfigs: (configs: ClientSocialConfig[]) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  setPosts: (posts: Post[]) => void;
  setCrisisEvents: (events: CrisisEvent[]) => void;
  setTrends: (trends: Trend[] | ((prev: Trend[]) => Trend[])) => void;
  setSocialAccounts: (accounts: SocialAccount[]) => void;
  addSocialAccount: (account: SocialAccount) => void;
  setScopeRequests: (requests: ScopeRequest[]) => void;
  addScopeRequest: (request: ScopeRequest) => void;
  updateScopeRequest: (request: ScopeRequest) => void;
  deleteScopeRequest: (requestId: string) => void;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  setAgencySettings: (settings: AgencySettings) => void;
  addPost: (post: Post) => void;
  updatePost: (post: Post) => void;
  deletePost: (postId: string) => void;
  addComment: (postId: string, comment: Comment) => void;
  updateComment: (postId: string, commentId: string, updates: Partial<Comment>) => void;
  setActiveView: (view: ViewType) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addCrisisEvent: (event: CrisisEvent) => void;
}

export const getCurrencySymbol = (currencyCode: string) => {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'ZAR': 'R',
    'ZMW': 'K',
  };
  return symbols[currencyCode] || currencyCode;
};

export const useAgencyStore = create<AgencyState>()(
  persist(
    (set) => ({
      currentClient: null,
      clients: [],
      posts: [],
      crisisEvents: [],
      trends: [],
      socialAccounts: [],
      scopeRequests: [],
      notifications: [],
      agencySettings: {
        name: 'StratOS Agency',
        defaultHourlyRate: 150,
        currency: 'USD',
        timezone: 'UTC'
      },
      activeView: 'overview',
      sidebarOpen: true,
      theme: 'light',
      users: [],
      clientSocialConfigs: [],

      setCurrentClient: (client) => set({ currentClient: client }),
      clearClientContext: () => set({ currentClient: null }),
      setClients: (clients) => set({ clients }),
      setUsers: (users) => set({ users }),
      setClientSocialConfigs: (configs) => set({ clientSocialConfigs: configs }),
      addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
      updateClient: (client) => set((state) => ({ 
        clients: state.clients.map(c => c.id === client.id ? client : c),
        currentClient: state.currentClient?.id === client.id ? client : state.currentClient
      })),
      deleteClient: (clientId) => set((state) => ({
        clients: state.clients.filter(c => c.id !== clientId),
        currentClient: state.currentClient?.id === clientId ? null : state.currentClient
      })),
      setPosts: (posts) => set({ posts }),
      addPost: (post) => set((state) => ({ posts: [...state.posts, post] })),
      updatePost: (post) => set((state) => ({ 
        posts: state.posts.map(p => p.id === post.id ? post : p)
      })),
      deletePost: (postId) => set((state) => ({ 
        posts: state.posts.filter(p => p.id !== postId)
      })),
      addComment: (postId, comment) => set((state) => ({
        posts: state.posts.map(p => p.id === postId ? {
          ...p,
          comments: [...(p.comments || []), comment]
        } : p)
      })),
      updateComment: (postId, commentId, updates) => set((state) => ({
        posts: state.posts.map(p => p.id === postId ? {
          ...p,
          comments: p.comments?.map(c => c.id === commentId ? { ...c, ...updates } : c)
        } : p)
      })),
      setCrisisEvents: (events) => set({ crisisEvents: events }),
      addCrisisEvent: (event) => set((state) => ({ crisisEvents: [event, ...state.crisisEvents] })),
      setTrends: (trends) => set((state) => ({ 
        trends: typeof trends === 'function' ? trends(state.trends) : trends 
      })),
      setSocialAccounts: (accounts) => set({ socialAccounts: accounts }),
      addSocialAccount: (account) => set((state) => ({ socialAccounts: [...state.socialAccounts, account] })),
      setScopeRequests: (requests) => set({ scopeRequests: requests }),
      addScopeRequest: (request) => set((state) => ({ scopeRequests: [...state.scopeRequests, request] })),
      updateScopeRequest: (request) => set((state) => ({
        scopeRequests: state.scopeRequests.map(r => r.id === request.id ? request : r)
      })),
      deleteScopeRequest: (requestId) => set((state) => ({
        scopeRequests: state.scopeRequests.filter(r => r.id !== requestId)
      })),
      setNotifications: (notifications) => set({ notifications }),
      addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
      markNotificationAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      markAllNotificationsAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),
      deleteNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      setAgencySettings: (settings) => set({ agencySettings: settings }),
      setActiveView: (view) => set({ activeView: view }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'agency-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        currentClient: state.currentClient,
        activeView: state.activeView,
        theme: state.theme
      }),
    }
  )
);
