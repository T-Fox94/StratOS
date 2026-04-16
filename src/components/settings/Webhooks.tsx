import React, { useState } from 'react';
import { 
  Webhook, 
  Send, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown,
  Terminal,
  RefreshCw,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  platform: string;
  status: 'success' | 'error';
  statusCode: number;
  payload: any;
  response: any;
}

const platforms = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
];

const eventTypes = [
  { id: 'comment.created', label: 'Comment Created' },
  { id: 'post.published', label: 'Post Published' },
  { id: 'mention.received', label: 'Mention Received' },
  { id: 'follower.new', label: 'New Follower' },
  { id: 'message.received', label: 'Message Received' },
];

const samplePayloads: Record<string, any> = {
  'comment.created': {
    id: "comment_123",
    post_id: "post_456",
    user: {
      id: "user_789",
      username: "test_user"
    },
    text: "Great post! Love the content.",
    timestamp: new Date().toISOString()
  },
  'post.published': {
    id: "post_456",
    platform: "instagram",
    url: "https://instagram.com/p/123",
    timestamp: new Date().toISOString()
  }
};

export function Webhooks() {
  const [platform, setPlatform] = useState('instagram');
  const [eventType, setEventType] = useState('comment.created');
  const [webhookUrl, setWebhookUrl] = useState('https://preview-chat-01f12414-7487-4e9d-8257-b96c98f4f77f.space');
  const [payload, setPayload] = useState(JSON.stringify(samplePayloads['comment.created'], null, 2));
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isSending, setIsSending] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied to clipboard');
  };

  const handleLoadSample = () => {
    const sample = samplePayloads[eventType] || { message: "Sample payload for " + eventType };
    setPayload(JSON.stringify(sample, null, 2));
    toast.info('Sample payload loaded');
  };

  const handleSendTest = async () => {
    if (!webhookUrl) {
      toast.error('Please enter a Webhook URL');
      return;
    }

    try {
      JSON.parse(payload);
    } catch (e) {
      toast.error('Invalid JSON payload');
      return;
    }

    setIsSending(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const success = Math.random() > 0.2; // 80% success rate for simulation
    
    const newLog: WebhookLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      event: eventType,
      platform: platform,
      status: success ? 'success' : 'error',
      statusCode: success ? 200 : 500,
      payload: JSON.parse(payload),
      response: success ? { message: "Webhook received successfully" } : { error: "Internal Server Error" }
    };

    setLogs(prev => [newLog, ...prev]);
    setIsSending(false);

    if (success) {
      toast.success('Webhook sent successfully');
    } else {
      toast.error('Webhook delivery failed');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    toast.info('Webhook logs cleared');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Webhooks</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure and test real-time event notifications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-1">
              <Webhook className="text-indigo-500" size={24} />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Webhook Configuration</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Test webhook endpoints for platform integrations</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Platform</label>
                <div className="relative">
                  <select 
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm appearance-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  >
                    {platforms.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Event Type</label>
                <div className="relative">
                  <select 
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm appearance-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  >
                    {eventTypes.map(e => (
                      <option key={e.id} value={e.id}>{e.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Webhook URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-api.com/webhook"
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                />
                <button 
                  onClick={handleCopyUrl}
                  className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Payload (JSON)</label>
                <button 
                  onClick={handleLoadSample}
                  className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Load Sample
                </button>
              </div>
              <div className="relative group">
                <textarea 
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl p-6 border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                />
                <div className="absolute top-4 right-4 text-slate-700 group-hover:text-slate-500 transition-colors">
                  <Code size={16} />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSendTest}
              disabled={isSending}
              className={cn(
                "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
                isSending 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" 
                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
              )}
            >
              {isSending ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
              {isSending ? 'Sending Webhook...' : 'Send Test Webhook'}
            </button>
          </div>
        </div>

        {/* Logs Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Terminal className="text-indigo-500" size={24} />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Webhook Logs</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Recent webhook responses</p>
            </div>
            {logs.length > 0 && (
              <button 
                onClick={clearLogs}
                className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
              >
                <Trash2 size={16} />
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {logs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12"
                >
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                    <Webhook size={40} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No webhook logs yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto">
                      Send a test webhook to see results here
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {log.status === 'success' ? (
                            <CheckCircle2 size={18} className="text-emerald-500" />
                          ) : (
                            <AlertCircle size={18} className="text-rose-500" />
                          )}
                          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            {log.event}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">{log.timestamp}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                            log.status === 'success' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                          )}>
                            {log.statusCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Platform:</span>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{log.platform}</span>
                        </div>
                      </div>

                      <div className="bg-slate-950 rounded-xl p-4 overflow-hidden">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Response</span>
                        </div>
                        <pre className="text-[10px] font-mono text-emerald-500/80 overflow-x-auto">
                          {JSON.stringify(log.response, null, 2)}
                        </pre>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
