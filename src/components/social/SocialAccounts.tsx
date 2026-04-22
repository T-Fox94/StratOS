import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { 
  Instagram, 
  Linkedin, 
  Facebook, 
  Plus, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Unlink,
  ArrowLeft,
  Twitter,
  Link as LinkIcon,
  X as LucideX,
  Users,
  ChevronsUpDown,
  Settings,
  Key
} from 'lucide-react';
import { toast } from 'sonner';
import { TikTokIcon } from '../icons/TikTokIcon';
import { useAgencyStore, SocialAccount } from '../../store/useAgencyStore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, setDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getApiUrl } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';

const platformIcons = {
  instagram: { icon: Instagram, color: 'text-white', bg: 'bg-pink-500', label: 'Instagram' },
  facebook: { icon: Facebook, color: 'text-white', bg: 'bg-blue-600', label: 'Facebook' },
  linkedin: { icon: Linkedin, color: 'text-white', bg: 'bg-blue-700', label: 'LinkedIn' },
  tiktok: { icon: TikTokIcon, color: 'text-white', bg: 'bg-black', label: 'TikTok' },
  twitter: { icon: Twitter, color: 'text-white', bg: 'bg-sky-500', label: 'Twitter' },
};

export function SocialAccounts() {
  const { user, profile } = useAuth();
  const { currentClient, socialAccounts, addSocialAccount, setActiveView, theme, clients, setCurrentClient, clientSocialConfigs } = useAgencyStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<keyof typeof platformIcons | null>(null);
  const [handle, setHandle] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const [fbAppId, setFbAppId] = useState('');
  const [fbAppSecret, setFbAppSecret] = useState('');
  const [liClientId, setLiClientId] = useState('');
  const [liClientSecret, setLiClientSecret] = useState('');
  const [ttKey, setTtKey] = useState('');
  const [ttSecret, setTtSecret] = useState('');
  const [twClientId, setTwClientId] = useState('');
  const [twClientSecret, setTwClientSecret] = useState('');
  const [fbVerifyToken, setFbVerifyToken] = useState('');

  const currentConfig = clientSocialConfigs.find(c => c.clientId === currentClient?.id);

  React.useEffect(() => {
    if (currentConfig) {
      setFbAppId(currentConfig.facebookAppId || '');
      setFbAppSecret(currentConfig.facebookAppSecret || '');
      setLiClientId(currentConfig.linkedinClientId || '');
      setLiClientSecret(currentConfig.linkedinClientSecret || '');
      setTtKey(currentConfig.tiktokKey || '');
      setTtSecret(currentConfig.tiktokSecret || '');
      setTwClientId(currentConfig.twitterClientId || '');
      setTwClientSecret(currentConfig.twitterClientSecret || '');
      setFbVerifyToken(currentConfig.fbVerifyToken || '');
    } else {
      setFbAppId('');
      setFbAppSecret('');
      setLiClientId('');
      setLiClientSecret('');
      setTtKey('');
      setTtSecret('');
      setTwClientId('');
      setTwClientSecret('');
      setFbVerifyToken('');
    }
  }, [currentConfig, currentClient]);

  React.useEffect(() => {
    // 1. Handle return parameters from same-tab redirect (Version 1.9.0)
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const platform = params.get('platform');
    
    if (status === 'success' && platform) {
      toast.success(`${platform} account connected successfully!`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'error') {
      toast.error(`Connection failed: ${params.get('message')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. Handle Popup Messages (Legacy Fallback)
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (!event.origin.includes('run.app') && !event.origin.includes('localhost')) return;
      if (event.data?.type === 'OAUTH_SUCCESS') {
        toast.success(`${event.data.platform} account connected successfully!`);
        setIsConnecting(false);
      }
    };
    window.addEventListener('message', handleOAuthMessage);

    // 3. Handle Native Mobile Deep Links
    const setupDeepLinkListener = async () => {
      if (!Capacitor.isNativePlatform()) return;
      return await App.addListener('appUrlOpen', async (data) => {
        if (data.url.includes('oauth-callback')) {
          const url = new URL(data.url);
          const p = new URLSearchParams(url.search);
          if (p.get('status') === 'success') {
            toast.success(`${p.get('platform')} connected!`);
            await Browser.close();
          } else {
            toast.error('Connection failed');
          }
        }
      });
    };

    const deepLinkListenerPromise = setupDeepLinkListener();
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
      deepLinkListenerPromise.then(l => l?.remove());
    };
  }, [currentClient]);

  const isAdmin = profile?.role === 'admin';
  const clientAccounts = socialAccounts.filter(acc => acc.clientId === currentClient?.id);

  const handleSaveConfig = async () => {
    if (!currentClient) return;
    const configData = {
      clientId: currentClient.id, facebookAppId: fbAppId, facebookAppSecret: fbAppSecret,
      linkedinClientId: liClientId, linkedinClientSecret: liClientSecret,
      tiktokKey: ttKey, tiktokSecret: ttSecret,
      twitterClientId: twClientId, twitterClientSecret: twClientSecret,
      fbVerifyToken: fbVerifyToken,
    };

    try {
      await setDoc(doc(db, 'client_social_configs', currentClient.id), { ...configData, updatedAt: serverTimestamp() }, { merge: true });
      await fetch(getApiUrl(`/api/clients/${currentClient.id}/social-config`), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });
      toast.success('API Configuration saved successfully!');
      setIsConfiguring(false);
    } catch (error) {
      toast.error('Failed to save configuration.');
    }
  };

  const handleConnect = async (platformOverride?: keyof typeof platformIcons) => {
    const platform = platformOverride || selectedPlatform;
    if (!currentClient || !platform) return;
    
    try {
      const response = await fetch(getApiUrl(`/api/auth/${platform}?clientId=${currentClient.id}&mobile=${Capacitor.isNativePlatform()}`));
      if (!response.ok) {
        toast.error((await response.json()).error || 'Failed to initiate connection');
        return;
      }
      
      const { url } = await response.json();
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url });
      } else {
        // SAME-TAB REDIRECT (Faster UX)
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(`Connection error: ${error.message || 'Check server logs'}`);
    }
  };

  const handleVerify = async (accountId: string) => {
    setIsSyncing(true);
    try {
      const response = await fetch(getApiUrl(`/api/social/verify/${accountId}`), {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        if (data.status === 'connected') {
          toast.success('Connection verified successfully!');
        } else {
          toast.error('Connection verification failed. Please reconnect.');
        }
      } else {
        toast.error(data.error || 'Failed to verify connection');
      }
    } catch (error) {
      console.error("Error verifying connection:", error);
      toast.error('Failed to verify connection');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      // 1. Delete from Backend (Prisma)
      const response = await fetch(getApiUrl(`/api/social/${accountId}`), {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect from backend');
      }

      // 2. Delete from Firestore
      await deleteDoc(doc(db, 'social_accounts', accountId));
      
      toast.success('Account disconnected successfully');
    } catch (error) {
      console.error("Error disconnecting account:", error);
      handleFirestoreError(error, OperationType.DELETE, `social_accounts/${accountId}`);
      toast.error('Failed to disconnect account');
    }
  };

  const getCount = (platform: string) => {
    return clientAccounts.filter(acc => acc.platform === platform).length;
  };

  if (!currentClient) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mb-8 text-slate-300 dark:text-slate-600 shadow-inner">
          <Users size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Select a Client</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">
          Social accounts are managed per client. Select a client from your portfolio to connect their social media profiles.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => setCurrentClient(client)}
              className={cn(
                "flex items-center gap-4 p-5 rounded-3xl border transition-all text-left group",
                theme === 'dark' 
                  ? "bg-slate-900 border-slate-800 hover:border-indigo-500 hover:bg-slate-800" 
                  : "bg-white border-slate-100 hover:border-slate-900 hover:shadow-lg"
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                {client.logo ? (
                  <img src={client.logo} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-slate-400">{client.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("font-bold truncate", theme === 'dark' ? "text-white" : "text-slate-900")}>{client.name}</p>
                <p className="text-xs text-slate-500 truncate">{client.industry}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{currentClient.name}</h1>
            <DropdownMenu>
                <DropdownMenuTrigger render={
                  <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                    <ChevronsUpDown size={16} />
                  </button>
                } />
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Switch Client</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-[200px]">
                    {clients.map((client) => (
                      <DropdownMenuItem 
                        key={client.id}
                        onClick={() => setCurrentClient(client)}
                        className={cn(
                          "flex items-center gap-2 cursor-pointer",
                          currentClient.id === client.id && "bg-muted font-bold"
                        )}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={client.logo} />
                          <AvatarFallback className="text-[8px]">{client.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{client.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage social media accounts for this client</p>
          </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button 
              onClick={() => setIsConfiguring(true)}
              className={cn(
                "p-3 rounded-xl border transition-all flex items-center gap-2 font-bold",
                theme === 'dark' ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Settings size={20} />
              API Settings
            </button>
          )}
          <button 
            onClick={() => setIsConnecting(true)}
            className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg"
          >
            <Plus size={20} />
            Connect Account
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-5 lg:pb-0">
        {(['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter'] as const)
          .filter(p => getCount(p) > 0)
          .map((p) => {
          const platform = platformIcons[p];
          const count = getCount(p);
          return (
            <div key={p} className={cn(
              "p-6 rounded-3xl border shadow-sm flex items-center gap-4 min-w-[180px] lg:min-w-0 transition-colors duration-300",
              theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
            )}>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm", platform.bg)}>
                <platform.icon size={24} className={platform.color} />
              </div>
              <div>
                <p className={cn("text-2xl font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{count}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{platform.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className={cn(
        "rounded-[32px] border shadow-sm overflow-hidden transition-colors duration-300",
        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
      )}>
        <div className={cn(
          "p-8 border-b",
          theme === 'dark' ? "border-slate-800" : "border-slate-50"
        )}>
          <h2 className={cn("text-xl font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>Connected Accounts</h2>
          <p className="text-sm text-slate-400 mt-1">Accounts for {currentClient.name}</p>
        </div>

        <div className="p-8">
          {clientAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600">
                <LinkIcon size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No accounts connected</h3>
              <p className="text-slate-400 dark:text-slate-500 max-w-xs mx-auto mb-8">
                Connect a social media account to get started
              </p>
              <button 
                onClick={() => setIsConnecting(true)}
                className="bg-slate-900 dark:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg"
              >
                <Plus size={20} />
                Connect Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientAccounts.map((account) => {
                const platform = platformIcons[account.platform as keyof typeof platformIcons] || platformIcons.twitter;
                return (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-3xl border p-6 hover:shadow-md transition-all group",
                      theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"
                    )}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm", platform.bg)}>
                        <platform.icon size={24} className={platform.color} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md",
                          account.status === 'connected' 
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
                            : account.status === 'error' || account.status === 'disconnected'
                              ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                              : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                        )}>
                          {account.status}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              theme === 'dark' ? "text-slate-500 hover:bg-slate-700" : "text-slate-400 hover:bg-white"
                            )}>
                              <MoreVertical size={18} />
                            </button>
                          } />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleVerify(account.id)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <CheckCircle2 size={14} />
                              <span>Verify Connection</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleConnect(account.platform as keyof typeof platformIcons)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <RefreshCw size={14} />
                              <span>Reconnect</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="flex items-center gap-2 cursor-pointer text-rose-500 focus:text-rose-500"
                              onClick={() => handleDisconnect(account.id)}
                            >
                              <Unlink size={14} />
                              <span>Disconnect</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className={cn("text-lg font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{account.handle}</h3>
                      <p className="text-xs text-slate-500 capitalize">{account.platform}</p>
                      
                      {account.status !== 'connected' && (
                        <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                          <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                          <div className="space-y-2">
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 leading-tight">
                              {account.status === 'error' 
                                ? 'Connection failed. Please reconnect to restore functionality.' 
                                : 'Session expired. Re-authorization is required.'}
                            </p>
                            <button 
                              onClick={() => handleConnect(account.platform as keyof typeof platformIcons)}
                              className="text-[10px] font-bold text-rose-600 dark:text-rose-400 underline underline-offset-2 hover:text-rose-700"
                            >
                              Reconnect Now
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={cn(
                      "flex items-center justify-between pt-4 border-t",
                      theme === 'dark' ? "border-slate-700" : "border-slate-200/50"
                    )}>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        {account.status === 'connected' ? (
                          <>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">API Active</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} className="text-rose-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Action Required</span>
                          </>
                        )}
                      </div>
                      <a 
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Connect Modal */}
      <AnimatePresence>
        {isConnecting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConnecting(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden",
                theme === 'dark' ? "bg-slate-900" : "bg-white"
              )}
            >
              <div className={cn(
                "p-8 border-b flex items-center justify-between",
                theme === 'dark' ? "bg-slate-800/50 border-slate-800" : "bg-slate-50/50 border-slate-100"
              )}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h2 className={cn("text-xl font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>
                      {selectedPlatform ? `Connect ${platformIcons[selectedPlatform].label}` : 'Connect Account'}
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                      Linking to {currentClient.name}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsConnecting(false);
                    setSelectedPlatform(null);
                  }} 
                  className={cn(
                    "p-2 rounded-full transition-colors shadow-sm",
                    theme === 'dark' ? "hover:bg-slate-700 bg-slate-800 text-slate-400" : "hover:bg-white bg-white text-slate-600"
                  )}
                >
                  <LucideX size={20} />
                </button>
              </div>

              <div className="p-8">
                    {!selectedPlatform ? (
                      <div className="grid grid-cols-1 gap-4">
                        {(['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter'] as const).map(p => {
                          const platform = platformIcons[p];
                          return (
                            <button
                              key={p}
                              onClick={() => setSelectedPlatform(p)}
                              className={cn(
                                "flex items-center justify-between p-5 rounded-3xl border transition-all group",
                                theme === 'dark' 
                                  ? "border-slate-800 hover:border-indigo-500 hover:bg-slate-800" 
                                  : "border-slate-100 hover:border-slate-900 hover:bg-slate-50"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", platform.bg)}>
                                  <platform.icon size={24} className={platform.color} />
                                </div>
                                <div className="text-left">
                                  <p className={cn("text-base font-bold capitalize", theme === 'dark' ? "text-white" : "text-slate-900")}>{p}</p>
                                  <p className="text-xs text-slate-400 dark:text-slate-500">Connect your {p} account</p>
                                </div>
                              </div>
                              <Plus size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border",
                          theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"
                        )}>
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm", platformIcons[selectedPlatform].bg)}>
                            {React.createElement(platformIcons[selectedPlatform].icon, { size: 24, className: platformIcons[selectedPlatform].color })}
                          </div>
                          <div>
                            <p className={cn("font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{platformIcons[selectedPlatform].label}</p>
                            <p className="text-xs text-slate-500">Official API Connection</p>
                          </div>
                        </div>

                        <div className={cn(
                          "p-4 rounded-xl border",
                          theme === 'dark' ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"
                        )}>
                          <p className={cn(
                            "text-xs leading-relaxed",
                            theme === 'dark' ? "text-indigo-300" : "text-indigo-700"
                          )}>
                            You will be redirected to {platformIcons[selectedPlatform].label} to authorize StratOS to manage your content.
                          </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button 
                            onClick={() => setSelectedPlatform(null)}
                            className={cn(
                              "flex-1 py-3 px-4 border rounded-xl font-bold transition-all",
                              theme === 'dark' ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            Back
                          </button>
                          <button 
                            onClick={() => handleConnect()}
                            className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg dark:bg-indigo-600 dark:hover:bg-indigo-700"
                          >
                            Authorize
                          </button>
                        </div>
                      </div>
                    )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* API Config Modal */}
      <AnimatePresence>
        {isConfiguring && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfiguring(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden",
                theme === 'dark' ? "bg-slate-900" : "bg-white"
              )}
            >
              <div className={cn(
                "p-8 border-b flex items-center justify-between",
                theme === 'dark' ? "bg-slate-800/50 border-slate-800" : "bg-slate-50/50 border-slate-100"
              )}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Key size={20} />
                  </div>
                  <div>
                    <h2 className={cn("text-xl font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>API Configuration</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                      Settings for {currentClient.name}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsConfiguring(false)} 
                  className={cn(
                    "p-2 rounded-full transition-colors shadow-sm",
                    theme === 'dark' ? "hover:bg-slate-700 bg-slate-800 text-slate-400" : "hover:bg-white bg-white text-slate-600"
                  )}
                >
                  <LucideX size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Facebook Config */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Facebook size={18} className="text-blue-600" />
                    <h3 className={cn("font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>Facebook API Keys</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">App ID</label>
                      <input 
                        type="text"
                        value={fbAppId}
                        onChange={(e) => setFbAppId(e.target.value)}
                        placeholder="Enter Facebook App ID"
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                          theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 text-slate-900"
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">App Secret</label>
                      <input 
                        type="password"
                        value={fbAppSecret}
                        onChange={(e) => setFbAppSecret(e.target.value)}
                        placeholder="Enter Facebook App Secret"
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                          theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 text-slate-900"
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Webhook Verify Token</label>
                    <input 
                      type="text"
                      value={fbVerifyToken}
                      onChange={(e) => setFbVerifyToken(e.target.value)}
                      placeholder="Enter Webhook Verification Token"
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                        theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 text-slate-900"
                      )}
                    />
                  </div>
                </div>

                {/* LinkedIn Config */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Linkedin size={18} className="text-blue-700" />
                    <h3 className={cn("font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>LinkedIn API Keys</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client ID</label>
                      <input 
                        type="text"
                        value={liClientId}
                        onChange={(e) => setLiClientId(e.target.value)}
                        placeholder="Enter LinkedIn Client ID"
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                          theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 text-slate-900"
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Secret</label>
                      <input 
                        type="password"
                        value={liClientSecret}
                        onChange={(e) => setLiClientSecret(e.target.value)}
                        placeholder="Enter LinkedIn Client Secret"
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                          theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 text-slate-900"
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* TikTok Config */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TikTokIcon size={18} />
                    <h3 className={cn("font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>TikTok API Keys</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Key</label>
                      <input 
                        type="text"
                        value={ttKey}
                        onChange={(e) => setTtKey(e.target.value)}
                        placeholder="Enter TikTok Client Key"
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                          theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 text-slate-900"
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Secret</label>
                      <input 
                        type="password"
                        value={ttSecret}
                        onChange={(e) => setTtSecret(e.target.value)}
                        placeholder="Enter TikTok Client Secret"
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                          theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 text-slate-900"
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Twitter Config */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Twitter size={18} className="text-sky-500" />
                    <h3 className={cn("font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>Twitter API Keys</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client ID</label>
                      <input 
                        type="text"
                        value={twClientId}
                        onChange={(e) => setTwClientId(e.target.value)}
                        placeholder="Enter Twitter Client ID"
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                          theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 text-slate-900"
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Secret</label>
                      <input 
                        type="password"
                        value={twClientSecret}
                        onChange={(e) => setTwClientSecret(e.target.value)}
                        placeholder="Enter Twitter Client Secret"
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                          theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-100 text-slate-900"
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "p-4 rounded-xl border text-xs leading-relaxed",
                  theme === 'dark' ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-100 text-amber-700"
                )}>
                  <p className="flex items-center gap-2 font-bold mb-1">
                    <AlertCircle size={14} />
                    Security Warning
                  </p>
                  These keys are stored securely and used only for this client's social media connections. Ensure you use the correct App ID and Secret from the Facebook Developer Portal.
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsConfiguring(false)}
                    className={cn(
                      "flex-1 py-3 px-4 border rounded-xl font-bold transition-all",
                      theme === 'dark' ? "border-slate-700 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveConfig}
                    className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg dark:bg-indigo-600 dark:hover:bg-indigo-700"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
