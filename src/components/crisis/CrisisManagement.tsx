import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, MessageSquare, X, Send, BookOpen, ShieldCheck, Zap, Users } from 'lucide-react';
import { useAgencyStore } from '../../store/useAgencyStore';
import { db } from '../../firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { toast } from 'sonner';

export function CrisisManagement() {
  const { crisisEvents, currentClient } = useAgencyStore();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'high' as 'low' | 'medium' | 'high' | 'critical'
  });

  const filteredEvents = crisisEvents.filter(e => 
    !currentClient || e.clientId === currentClient.id
  );

  const handleResolve = async (eventId: string) => {
    try {
      await setDoc(doc(db, 'crisis_events', eventId), { status: 'resolved' }, { merge: true });
      toast.success('Crisis marked as resolved');
    } catch (error) {
      console.error("Error resolving crisis:", error);
      toast.error('Failed to resolve crisis');
    }
  };

  const handleReportCrisis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient) {
      toast.error('Please select a client first');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'crisis_events'), {
        ...formData,
        clientId: currentClient.id,
        status: 'active',
        createdAt: new Date().toISOString(), // Using string for consistency with existing display logic
        updatedAt: serverTimestamp()
      });
      
      setIsReportModalOpen(false);
      setFormData({ title: '', description: '', severity: 'high' });
      toast.success('Crisis reported successfully');
    } catch (error) {
      console.error("Error reporting crisis:", error);
      toast.error('Failed to report crisis');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Crisis Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor and respond to critical brand issues in real-time.</p>
        </div>
        <button 
          onClick={() => setIsReportModalOpen(true)}
          className="bg-rose-600 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-base font-bold flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 dark:shadow-none"
        >
          <ShieldAlert size={18} className="md:w-5 md:h-5" />
          Report New Crisis
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={24} />
              Active Incidents
            </h2>

            <div className="space-y-4">
              {filteredEvents.length > 0 ? filteredEvents.map((event, i) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        event.severity === 'high' ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400" : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                      )}>
                        <ShieldAlert size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{event.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{event.createdAt}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      event.status === 'active' ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                    )}>
                      {event.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed prose prose-sm prose-slate dark:prose-invert max-w-none">
                    <Markdown>{event.description}</Markdown>
                  </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5">
                      <MessageSquare size={14} />
                      View Discussion
                    </button>
                    <button 
                      onClick={() => handleResolve(event.id)}
                      className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      Mark as Resolved
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} className="text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Systems Clear</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">No active crises detected for this client.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-slate-950 rounded-[32px] p-8 text-white shadow-xl border dark:border-slate-800">
            <h3 className="text-lg font-bold mb-6">Crisis Protocol</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-amber-400">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold mb-1">Response Time Target</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">All high-severity incidents must be acknowledged within 15 minutes.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-indigo-400">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold mb-1">Communication Chain</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Notify account manager and legal team immediately upon crisis detection.</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsProtocolModalOpen(true)}
              className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/10"
            >
              View Full Protocol
            </button>
          </div>
        </div>
      </div>

      {/* Report Crisis Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 pb-4 text-center relative border-b border-slate-50 dark:border-slate-800">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-4">
                  <ShieldAlert size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Report New Crisis</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Alert the team about a critical incident for {currentClient?.name || 'the active client'}.
                </p>
                <button 
                  onClick={() => setIsReportModalOpen(false)} 
                  className="absolute right-6 top-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleReportCrisis} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Incident Title</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g., Viral negative review thread on X"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Severity Level</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({...formData, severity: level})}
                        className={cn(
                          "py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                          formData.severity === level 
                            ? (level === 'critical' ? "bg-rose-600 border-rose-600 text-white" : 
                               level === 'high' ? "bg-orange-500 border-orange-500 text-white" :
                               level === 'medium' ? "bg-amber-500 border-amber-500 text-white" :
                               "bg-emerald-500 border-emerald-500 text-white")
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Description & Details</label>
                  <textarea 
                    required
                    placeholder="Describe the situation, affected platforms, and any immediate risks..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all min-h-[120px] dark:text-white"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {isSubmitting ? <Clock className="animate-spin" size={18} /> : <Send size={18} />}
                    Report Crisis
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Protocol Modal */}
      <AnimatePresence>
        {isProtocolModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProtocolModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4 text-center relative border-b border-slate-50 dark:border-slate-800">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
                  <BookOpen size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Crisis Response Protocol</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Standard Operating Procedures for high-severity brand incidents.
                </p>
                <button 
                  onClick={() => setIsProtocolModalOpen(false)} 
                  className="absolute right-6 top-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Zap size={20} />
                    <h3 className="font-bold uppercase tracking-widest text-xs">Phase 1: Immediate Action (0-15 mins)</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Acknowledge incident in internal Slack channel #crisis-alerts.',
                      'Pause all scheduled social media posts for the affected client.',
                      'Assign a Crisis Lead to manage the response flow.',
                      'Gather initial data: platform, reach, sentiment, and key influencers involved.'
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i+1}</div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Users size={20} />
                    <h3 className="font-bold uppercase tracking-widest text-xs">Phase 2: Stakeholder Notification (15-60 mins)</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">Internal Team</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Notify Account Manager, Creative Director, and Legal Counsel.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">Client Contact</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Send "Incident Awareness" email to primary client stakeholder.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={20} />
                    <h3 className="font-bold uppercase tracking-widest text-xs">Phase 3: Response Execution (1-4 hours)</h3>
                  </div>
                  <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                    <p>Draft and approve public statements based on pre-approved templates. Ensure all responses are:</p>
                    <ul>
                      <li><strong>Empathetic:</strong> Acknowledge the concern sincerely.</li>
                      <li><strong>Transparent:</strong> State what we know and what we are doing.</li>
                      <li><strong>Action-Oriented:</strong> Provide clear next steps or resolution timelines.</li>
                    </ul>
                  </div>
                </section>
              </div>

              <div className="p-8 pt-0">
                <button 
                  onClick={() => setIsProtocolModalOpen(false)}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:opacity-90 transition-all"
                >
                  Got it, Close Protocol
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
