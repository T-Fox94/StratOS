import React, { useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  MoreVertical,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Zap,
  Shield,
  MessageSquare,
  Flame,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useAgencyStore, CrisisEvent, getCurrencySymbol } from '../../store/useAgencyStore';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export function Overview() {
  const { 
    currentClient, 
    clients, 
    posts, 
    crisisEvents, 
    setCrisisEvents,
    setActiveView,
    scopeRequests,
    agencySettings
  } = useAgencyStore();

  const currencySymbol = getCurrencySymbol(agencySettings.currency);

  // Calculate unbilled and billed amounts
  const filteredScopeRequests = currentClient 
    ? scopeRequests.filter(r => r.clientId === currentClient.id)
    : scopeRequests;
  
  const billedAmount = filteredScopeRequests
    .filter(r => r.status === 'billed')
    .reduce((sum, r) => sum + r.amount, 0);

  const unbilledAmount = filteredScopeRequests
    .filter(r => r.status === 'unbilled')
    .reduce((sum, r) => sum + r.amount, 0);

  const activeCrises = crisisEvents.filter(c => c.status === 'active');
  const filteredPosts = currentClient 
    ? posts.filter(p => p.clientId === currentClient.id)
    : posts;

  const stats = [
    { label: 'Active Clients', value: clients.length.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Posts', value: posts.length.toString(), icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'In Review', value: posts.filter(p => p.status === 'in-review').length.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Billed Revenue', value: `${currencySymbol}${billedAmount.toLocaleString()}`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Unbilled Scope', value: `${currencySymbol}${unbilledAmount.toLocaleString()}`, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Active Crises', value: activeCrises.length.toString(), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const platformIcons: Record<string, any> = {
    instagram: Instagram,
    linkedin: Linkedin,
    twitter: Twitter,
    facebook: Facebook,
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Agency Overview
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            Welcome back, here's what's happening across your clients today.
          </p>
        </div>
        <div className="self-start md:self-auto bg-white dark:bg-slate-900 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 md:gap-3 transition-colors">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 whitespace-nowrap">
            System Live
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:pb-0">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group min-w-[160px] md:min-w-0"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", stat.bg, "dark:bg-slate-800")}>
              <stat.icon className={stat.color} size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Crisis Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 overflow-x-auto no-scrollbar transition-colors">
            <div className="flex items-center gap-4 min-w-max">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Quick Actions</p>
              <button 
                onClick={() => setActiveView('content')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                <Plus size={16} /> Create Post
              </button>
              <button 
                onClick={() => setActiveView('clients')}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <Users size={16} /> Add Client
              </button>
              <button 
                onClick={() => setActiveView('calendar')}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <Calendar size={16} /> View Calendar
              </button>
              <button 
                onClick={() => setActiveView('crisis')}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
              >
                <AlertCircle size={16} /> Crisis Alert
              </button>
            </div>
          </div>

          {/* Crisis Monitor Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-rose-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Crisis Monitor</h2>
              </div>
              <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                {activeCrises.length} Active Crises
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {crisisEvents.map((crisis) => (
                  <motion.div
                    key={crisis.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group transition-colors",
                      crisis.severity === 'high' ? "border-rose-200 dark:border-rose-900/50" : "border-amber-200 dark:border-amber-900/50"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0 left-0 w-1 h-full",
                      crisis.severity === 'high' ? "bg-rose-500" : "bg-amber-500"
                    )} />
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{crisis.title}</h3>
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                        crisis.severity === 'high' ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400" : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                      )}>
                        {crisis.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{crisis.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500 dark:text-slate-400">
                          {crisis.clientId.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{crisis.clientId}</span>
                      </div>
                      <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Manage Crisis</button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {crisisEvents.length === 0 && (
                <div className="col-span-full p-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-center">
                  <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={24} />
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">All systems clear. No active crises detected.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Content Activity</h2>
            <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Post Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Platform</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Schedule</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPosts.length > 0 ? filteredPosts.slice(0, 5).map((post) => {
                    const Icon = platformIcons[post.platform.toLowerCase()] || FileText;
                    return (
                      <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{post.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{clients.find(c => c.id === post.clientId)?.name || 'Unknown Client'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Icon size={16} className="text-slate-400 dark:text-slate-500" />
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">{post.platform}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            post.status === 'published' ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" :
                            post.status === 'scheduled' ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" :
                            post.status === 'approved' ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400" :
                            post.status === 'in-review' ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" :
                            post.status === 'rejected' ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400" :
                            "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                          )}>
                            {post.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString() : 'Not scheduled'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic text-sm">
                        No recent activity found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Client Quota */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Client Quota Usage</h3>
            <div className="space-y-4">
              {clients.length > 0 ? clients.slice(0, 3).map(client => {
                const usage = client.monthlyQuota > 0 ? Math.round((client.currentMonthUsage / client.monthlyQuota) * 100) : 0;
                const color = usage > 90 ? 'bg-rose-500' : usage > 70 ? 'bg-amber-500' : 'bg-indigo-600';
                return (
                  <div key={client.id}>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-slate-700 dark:text-slate-300">{client.name}</span>
                      <span className="text-slate-500 dark:text-slate-400">{usage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", color)} style={{ width: `${usage}%` }}></div>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-xs text-slate-400 italic">No client data available.</p>
              )}
            </div>
          </div>

          {/* Trending Topics */}
          <div 
            onClick={() => setActiveView('trends')}
            className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-indigo-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Trending Opportunities</h3>
            </div>
            <div className="space-y-4">
              {useAgencyStore.getState().trends.length > 0 ? useAgencyStore.getState().trends.slice(0, 3).map(trend => (
                <div key={trend.id} className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-indigo-500 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold">{trend.name}</p>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold">{trend.relevanceScore}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Risk: {trend.riskLevel}</p>
                </div>
              )) : (
                <p className="text-xs text-slate-400 italic">No trending topics detected.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
