import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Clock, 
  Webhook, 
  RefreshCw, 
  Play, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Terminal,
  Cpu,
  MessageSquare,
  Bell,
  TrendingUp,
  Calendar,
  Copy,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getApiUrl } from '../../lib/utils';
import { toast } from 'sonner';
import { useAgencyStore } from '../../store/useAgencyStore';

import { WebhookTester } from './WebhookTester';

type TabType = 'tasks' | 'events' | 'endpoints';

interface AgentTask {
  id: string;
  name: string;
  type: 'MONITOR_COMMENTS' | 'MONITOR_MENTIONS' | 'AUTO_REPLY' | 'CONTENT_SUGGESTIONS' | 'METRICS_SYNC' | 'TREND_ANALYSIS' | 'QUOTA_MONITOR';
  status: 'running' | 'completed' | 'failed' | 'idle' | 'active' | 'paused';
  interval: string;
  successCount: number;
  failureCount: number;
  totalRuns: number;
  enabled: boolean;
}

interface WebhookEvent {
  id: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok';
  eventType: string;
  processed: boolean;
  createdAt: string;
  rawData?: string;
}

const PLATFORM_COLORS = {
  instagram: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
  facebook: 'bg-[#1877F2]',
  linkedin: 'bg-[#0A66C2]',
  tiktok: 'bg-black'
};

const TASK_ICONS = {
  MONITOR_COMMENTS: MessageSquare,
  MONITOR_MENTIONS: Bell,
  AUTO_REPLY: RefreshCw,
  CONTENT_SUGGESTIONS: TrendingUp,
  METRICS_SYNC: Activity,
  TREND_ANALYSIS: TrendingUp,
  QUOTA_MONITOR: ShieldAlert,
};

export function AutomationCenter() {
  const { theme } = useAgencyStore();
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [jobSchedulerStatus, setJobSchedulerStatus] = useState<'Running' | 'Idle' | 'Paused' | 'Error' | 'Offline'>('Running');
  const [agentOrchestratorStatus, setAgentOrchestratorStatus] = useState<'Active' | 'Paused' | 'Offline'>('Active');
  
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const fetchTasks = async () => {
    try {
      const response = await fetch(getApiUrl('/api/automation/tasks'));
      if (response.ok) {
        const data = await response.json();
        if (data.length === 0) {
          // Seed tasks if empty
          await fetch(getApiUrl('/api/automation/tasks/seed'), { method: 'POST' });
          const retryResponse = await fetch(getApiUrl('/api/automation/tasks'));
          const retryData = await retryResponse.json();
          setTasks(retryData);
        } else {
          setTasks(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(getApiUrl('/api/webhooks/events'));
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEvents();
    const interval = setInterval(() => {
      fetchEvents();
      fetchTasks();
    }, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchEvents(), fetchTasks()]);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Automation status updated');
    }, 800);
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const nextEnabled = !task.enabled;
    
    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, enabled: nextEnabled, status: nextEnabled ? 'active' : 'paused' } : t
    ));

    try {
      const response = await fetch(getApiUrl('/api/automation/tasks/toggle'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, enabled: nextEnabled })
      });

      if (!response.ok) throw new Error('Failed to toggle task');
      
      toast.info(`${task.name} is now ${nextEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      // Rollback
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, enabled: !nextEnabled, status: !nextEnabled ? 'active' : 'paused' } : t
      ));
      toast.error('Failed to update task status');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copied to clipboard');
  };

  const appUrl = window.location.origin;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Automation Center</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor and control background jobs, webhooks, and autonomous agents</p>
        </div>
        
        <button 
          onClick={handleRefresh}
          className={cn(
            "flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm",
            isRefreshing && "opacity-50 cursor-not-allowed"
          )}
        >
          <RefreshCw size={18} className={cn(isRefreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Control Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Scheduler */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Clock size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Job Scheduler</h3>
            </div>
            <span className={cn(
              "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
              jobSchedulerStatus === 'Running' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            )}>
              {jobSchedulerStatus}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pending</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">12</p>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Running</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">3</p>
            </div>
          </div>

          <button 
            onClick={() => toast.success('Manual job trigger initiated')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-all"
          >
            <Zap size={14} />
            Trigger Scheduler
          </button>
        </div>

        {/* Agent Orchestrator */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Cpu size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Agent Orchestrator</h3>
            </div>
            <span className={cn(
              "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
              agentOrchestratorStatus === 'Active' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            )}>
              {agentOrchestratorStatus}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Active</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{tasks.filter(t => t.enabled).length}</p>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Paused</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{tasks.filter(t => !t.enabled).length}</p>
            </div>
          </div>

          <button 
            onClick={() => toast.success('Agent execution started')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-all"
          >
            <Play size={14} />
            Run Now
          </button>
        </div>

        {/* Webhooks */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Webhook size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Webhooks</h3>
            </div>
            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              Active
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Endpoints</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">4</p>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Recent Events</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{events.length}</p>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Unprocessed</span>
            <span className="text-xs font-bold text-rose-500">{events.filter(e => !e.processed).length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-1 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-1">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={cn(
              "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
              activeTab === 'tasks' 
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Agent Tasks
          </button>
          <button 
            onClick={() => setActiveTab('events')}
            className={cn(
              "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
              activeTab === 'events' 
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Webhook Events
          </button>
          <button 
            onClick={() => setActiveTab('endpoints')}
            className={cn(
              "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
              activeTab === 'endpoints' 
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Webhook Endpoints
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {loadingTasks ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="animate-spin text-slate-400" size={32} />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Cpu className="text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500">No automation tasks configured</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tasks.map(task => {
                      const Icon = TASK_ICONS[task.type as keyof typeof TASK_ICONS] || Activity;
                      return (
                        <div key={task.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-colors",
                              task.enabled ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            )}>
                              <Icon size={24} />
                            </div>
                            <button 
                              onClick={() => toggleTask(task.id)}
                              className={cn(
                                "w-12 h-6 rounded-full p-1 transition-all relative",
                                task.enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 bg-white rounded-full transition-all",
                                task.enabled ? "translate-x-6" : "translate-x-0"
                              )} />
                            </button>
                          </div>
                          
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1">{task.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{task.interval}</p>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex gap-3">
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                <CheckCircle2 size={12} />
                                {task.successCount}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600">
                                <XCircle size={12} />
                                {task.failureCount}
                              </div>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              task.status === 'active' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : 
                              task.status === 'running' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400" :
                              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Webhook Events</h3>
                  <button onClick={handleRefresh} className="text-xs font-bold text-indigo-600 hover:underline">Refresh List</button>
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-3 pr-2">
                  {loadingEvents ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="animate-spin text-slate-400" size={32} />
                    </div>
                  ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Webhook className="text-slate-300 mb-4" size={48} />
                      <p className="text-slate-500">No webhook events received yet</p>
                    </div>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-3 h-3 rounded-full", PLATFORM_COLORS[event.platform])} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{event.eventType}</span>
                              <span className="text-[10px] font-bold uppercase text-slate-400">{event.platform}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">
                              {new Date(event.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            event.processed ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                          )}>
                            {event.processed ? 'Processed' : 'Pending'}
                          </span>
                          <button className="p-2 bg-white dark:bg-slate-900 rounded-lg text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                            <Terminal size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'endpoints' && (
              <motion.div
                key="endpoints"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['instagram', 'facebook', 'linkedin', 'tiktok'].map((platform) => (
                    <div key={platform} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-3 h-3 rounded-full", PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS])} />
                          <h4 className="font-bold text-slate-900 dark:text-white capitalize">{platform}</h4>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          Active
                        </span>
                      </div>
                      
                      <div className="relative group">
                        <code className="block w-full p-3 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 break-all pr-10">
                          {`${appUrl}/api/webhooks/${platform}`}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(`${appUrl}/api/webhooks/${platform}`)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      
                      <p className="text-[10px] text-slate-500 mt-3 flex items-center gap-1">
                        <ExternalLink size={10} />
                        Copy this URL to your {platform} developer console
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
