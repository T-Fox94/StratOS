import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Server, 
  Cpu, 
  Globe, 
  Zap,
  MessageSquare,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Shield,
  RefreshCw,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { TikTokIcon } from '../icons/TikTokIcon';

interface SystemStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency: string;
  icon: any;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  client: string;
  event: string;
  platform: string;
  type: 'success' | 'warning' | 'info';
}

export function Monitoring() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTasks, setActiveTasks] = useState(4);
  
  const systemStatuses: SystemStatus[] = [
    { name: 'Instagram API', status: 'operational', latency: '124ms', icon: Instagram },
    { name: 'Twitter API', status: 'operational', latency: '89ms', icon: Twitter },
    { name: 'LinkedIn API', status: 'degraded', latency: '450ms', icon: Linkedin },
    { name: 'TikTok API', status: 'operational', latency: '156ms', icon: TikTokIcon },
    { name: 'Gemini AI Engine', status: 'operational', latency: '1.2s', icon: Zap },
    { name: 'StratOS Core', status: 'operational', latency: '45ms', icon: Shield },
  ];

  const [logs, setLogs] = useState<ActivityLog[]>([
    { id: '1', timestamp: 'Just now', client: 'Glow Cosmetics', event: 'Scheduled post published', platform: 'instagram', type: 'success' },
    { id: '2', timestamp: '2m ago', client: 'TechFlow', event: 'New mention detected', platform: 'twitter', type: 'info' },
    { id: '3', timestamp: '5m ago', client: 'Urban Eats', event: 'Negative sentiment alert', platform: 'facebook', type: 'warning' },
    { id: '4', timestamp: '12m ago', client: 'Glow Cosmetics', event: 'AI Caption generated', platform: 'instagram', type: 'success' },
    { id: '5', timestamp: '15m ago', client: 'All Clients', event: 'Trend scan completed', platform: 'system', type: 'success' },
  ]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: ActivityLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: 'Just now',
        client: ['Glow Cosmetics', 'TechFlow', 'Urban Eats', 'FitLife'][Math.floor(Math.random() * 4)],
        event: ['New comment', 'Post scheduled', 'Analytics synced', 'Webhook triggered'][Math.floor(Math.random() * 4)],
        platform: ['instagram', 'twitter', 'linkedin', 'facebook'][Math.floor(Math.random() * 4)],
        type: Math.random() > 0.8 ? 'warning' : 'success'
      };
      setLogs(prev => [newLog, ...prev.slice(0, 9)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExportLogs = () => {
    try {
      const dataStr = JSON.stringify(logs, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `stratos-activity-logs-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">System Monitoring</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time health and activity across your agency infrastructure.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
          Refresh Status
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Healthy</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">99.9%</h3>
          <p className="text-xs text-slate-500 mt-1">System Uptime (24h)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Zap size={20} />
            </div>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Active</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{activeTasks}</h3>
          <p className="text-xs text-slate-500 mt-1">Background Tasks</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Globe size={20} />
            </div>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Global</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">12</h3>
          <p className="text-xs text-slate-500 mt-1">Connected Endpoints</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Average</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">156ms</h3>
          <p className="text-xs text-slate-500 mt-1">API Response Time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* API Health */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server size={18} className="text-indigo-500" />
                Platform Health
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {systemStatuses.map((sys) => (
                <div key={sys.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400">
                      <sys.icon size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{sys.name}</p>
                      <p className="text-[10px] text-slate-500">{sys.latency} latency</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                    sys.status === 'operational' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" :
                    sys.status === 'degraded' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                    "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                  )}>
                    {sys.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Cpu size={20} className="text-indigo-400" />
                AI Engine Load
              </h3>
              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Processing Capacity</span>
                    <span>42%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[42%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Memory Usage</span>
                    <span>68%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[68%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity size={18} className="text-indigo-500" />
                Live Activity Stream
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Feed</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        log.type === 'success' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" :
                        log.type === 'warning' ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600" :
                        "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                      )}>
                        {log.type === 'success' ? <CheckCircle2 size={18} /> :
                         log.type === 'warning' ? <AlertCircle size={18} /> :
                         <MessageSquare size={18} />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{log.client}</span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.platform}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{log.event}</p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock size={10} />
                          {log.timestamp}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Filter activity logs..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <button 
                  onClick={handleExportLogs}
                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-all"
                >
                  Export Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
