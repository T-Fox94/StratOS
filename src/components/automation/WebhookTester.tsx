import React, { useState } from 'react';
import { 
  Send, 
  Terminal, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Code,
  ChevronDown,
  Trash2,
  Webhook
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getApiUrl } from '../../lib/utils';
import { toast } from 'sonner';

type Platform = 'instagram' | 'facebook' | 'linkedin' | 'tiktok';

interface WebhookLog {
  id: string;
  platform: Platform;
  eventType: string;
  status: 'success' | 'error' | 'pending';
  duration: number;
  response: any;
  timestamp: string;
}

const SAMPLE_PAYLOADS = {
  'comment.created': {
    id: "comment_123",
    post_id: "post_456",
    account_id: "act_test_123",
    user: { id: "user_789", username: "test_user" },
    text: "Great post! Love the content.",
    timestamp: new Date().toISOString()
  },
  'post.published': {
    id: "post_456",
    account_id: "act_test_123",
    type: "image",
    caption: "Just posted a new image!",
    media_url: "https://example.com/image.jpg",
    timestamp: new Date().toISOString()
  },
  'mention.created': {
    id: "mention_789",
    account_id: "act_test_123",
    user: { id: "user_111", username: "fan_account" },
    text: "Hey @agency, check this out!",
    timestamp: new Date().toISOString()
  },
  'milestone.reached': {
    account_id: "act_test_123",
    type: "followers",
    count: 10000,
    timestamp: new Date().toISOString()
  }
};

const EVENT_TYPES = [
  'comment.created',
  'comment.deleted',
  'mention.created',
  'post.published',
  'post.unpublished',
  'milestone.reached',
  'account.updated',
  'story_insights',
  'live_comments'
];

export function WebhookTester() {
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [payload, setPayload] = useState(JSON.stringify(SAMPLE_PAYLOADS['comment.created'], null, 2));
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState<WebhookLog[]>([]);

  const handleLoadSample = () => {
    const sample = SAMPLE_PAYLOADS[eventType as keyof typeof SAMPLE_PAYLOADS] || { event: eventType, timestamp: new Date().toISOString() };
    setPayload(JSON.stringify(sample, null, 2));
    toast.info(`Sample payload loaded for ${eventType}`);
  };

  const handleSendWebhook = async () => {
    setIsSending(true);
    const startTime = Date.now();
    const logId = Math.random().toString(36).substring(7);
    
    const newLog: WebhookLog = {
      id: logId,
      platform,
      eventType,
      status: 'pending',
      duration: 0,
      response: null,
      timestamp: new Date().toLocaleTimeString()
    };

    setLogs(prev => [newLog, ...prev]);

    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(payload);
      } catch (e) {
        throw new Error('Invalid JSON payload');
      }

      const response = await fetch(getApiUrl(`/api/webhooks/${platform}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsedPayload, event: eventType })
      });

      const duration = Date.now() - startTime;
      const responseData = await response.json();

      setLogs(prev => prev.map(log => 
        log.id === logId 
          ? { ...log, status: response.ok ? 'success' : 'error', duration, response: responseData } 
          : log
      ));

      if (response.ok) {
        toast.success(`Webhook sent successfully to ${platform}`);
      } else {
        toast.error(`Webhook failed: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      setLogs(prev => prev.map(log => 
        log.id === logId 
          ? { ...log, status: 'error', duration, response: { error: error.message } } 
          : log
      ));
      toast.error(error.message);
    } finally {
      setIsSending(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    toast.info('Logs cleared');
  };

  const copyUrl = () => {
    const url = `${window.location.origin}/api/webhooks/${platform}`;
    navigator.clipboard.writeText(url);
    toast.success('Webhook URL copied');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
      {/* Configuration Panel */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Terminal size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Webhook Tester</h3>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Platform</label>
              <div className="relative">
                <select 
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="w-full px-4 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="tiktok">TikTok</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Event Type</label>
              <div className="relative">
                <select 
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-4 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
                >
                  {EVENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target URL</label>
              <button onClick={copyUrl} className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                <Copy size={10} />
                Copy URL
              </button>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-mono text-slate-500 break-all border border-slate-100 dark:border-slate-700">
              {`${window.location.origin}/api/webhooks/${platform}`}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">JSON Payload</label>
              <button 
                onClick={handleLoadSample}
                className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline"
              >
                <RefreshCw size={10} />
                Load Sample
              </button>
            </div>
            <textarea 
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 transition-all resize-none custom-scrollbar"
              spellCheck={false}
            />
          </div>

          <button 
            onClick={handleSendWebhook}
            disabled={isSending}
            className={cn(
              "w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg",
              isSending && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
            {isSending ? 'Sending Webhook...' : 'Send Test Webhook'}
          </button>
        </div>
      </div>

      {/* Logs Panel */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Code size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Execution Logs</h3>
          </div>
          {logs.length > 0 && (
            <button 
              onClick={clearLogs}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              title="Clear Logs"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300 mb-4">
                <Webhook size={32} />
              </div>
              <p className="text-sm text-slate-500 max-w-[200px]">No test webhooks sent yet. Use the panel on the left to start testing.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                      log.platform === 'instagram' ? "bg-rose-50 text-rose-700" : 
                      log.platform === 'facebook' ? "bg-blue-50 text-blue-700" : 
                      log.platform === 'linkedin' ? "bg-indigo-50 text-indigo-700" : "bg-slate-900 text-white"
                    )}>
                      {log.platform}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{log.eventType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{log.duration}ms</span>
                    {log.status === 'success' ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : log.status === 'error' ? (
                      <XCircle size={14} className="text-rose-500" />
                    ) : (
                      <Clock size={14} className="text-amber-500 animate-pulse" />
                    )}
                  </div>
                </div>
                
                {log.response && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto">
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  </div>
                )}
                
                <p className="text-[10px] text-slate-400 text-right">{log.timestamp}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
