import React, { useState } from 'react';
import { 
  ShieldAlert, 
  FileText, 
  AlertCircle, 
  Banknote, 
  Plus, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock,
  Search,
  Filter,
  ChevronDown,
  Trash2,
  Edit2,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useAgencyStore, ScopeRequest, getCurrencySymbol } from '../../store/useAgencyStore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export function ScopeGuardian() {
  const { currentClient, scopeRequests, theme, agencySettings } = useAgencyStore();
  const { profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ScopeRequest | null>(null);
  const [search, setSearch] = useState('');

  const currencySymbol = getCurrencySymbol(agencySettings.currency);

  const [formData, setFormData] = useState<{
    type: string;
    description: string;
    amount: number;
    hours: number;
    date: string;
    status: 'unbilled' | 'billed';
  }>({
    type: 'Extra Revision',
    description: '',
    amount: 0,
    hours: 0,
    date: new Date().toISOString().split('T')[0],
    status: 'unbilled'
  });

  const filteredRequests = scopeRequests.filter(req => 
    (!currentClient || req.clientId === currentClient.id) &&
    (req.description.toLowerCase().includes(search.toLowerCase()) || req.type.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRequests = filteredRequests.length;
  const unbilledRequests = filteredRequests.filter(r => r.status === 'unbilled');
  const billedRequests = filteredRequests.filter(r => r.status === 'billed');
  
  const unbilledAmount = unbilledRequests.reduce((sum, r) => sum + r.amount, 0);
  const billedAmount = billedRequests.reduce((sum, r) => sum + r.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient) return;

    const requestId = editingRequest ? editingRequest.id : Math.random().toString(36).substr(2, 9);
    const requestData = {
      ...formData,
      id: requestId,
      clientId: currentClient.id,
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'scope_requests', requestId), requestData);
      setIsModalOpen(false);
      setEditingRequest(null);
      setFormData({
        type: 'Extra Revision',
        description: '',
        amount: 0,
        hours: 0,
        date: new Date().toISOString().split('T')[0],
        status: 'unbilled'
      });
      toast.success(editingRequest ? 'Request updated successfully' : 'New scope request added');
    } catch (error) {
      console.error("Error saving scope request:", error);
      toast.error('Failed to save request');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await deleteDoc(doc(db, 'scope_requests', id));
        toast.success('Request deleted');
      } catch (error) {
        console.error("Error deleting scope request:", error);
        toast.error('Failed to delete request');
      }
    }
  };

  const handleToggleStatus = async (request: ScopeRequest) => {
    const newStatus = request.status === 'unbilled' ? 'billed' : 'unbilled';
    try {
      await setDoc(doc(db, 'scope_requests', request.id), { status: newStatus }, { merge: true });
      toast.success(`Request marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Scope Guardian
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">Track out-of-scope requests and billing</p>
        </div>
        <div className="flex items-center gap-3">
          {currentClient && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              Viewing: {currentClient.name}
            </div>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-base font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
            Add Request
          </button>
        </div>
      </div>

      {/* Summary Cards (Highlights) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Total Requests</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">{totalRequests}</span>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
                <TrendingUp size={12} />
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {currentClient?.name || 'All Clients'}
            </p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-amber-50/30 dark:bg-amber-900/10 p-6 sm:p-8 rounded-[32px] border border-amber-100/50 dark:border-amber-900/20 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-100/50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform">
              <AlertCircle size={24} />
            </div>
            <p className="text-[10px] font-bold text-amber-600/60 dark:text-amber-500/60 uppercase tracking-[0.2em] mb-1">Unbilled</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold text-amber-700 dark:text-amber-400 tracking-tight">{unbilledRequests.length}</span>
              <span className="text-sm font-bold text-amber-600/40 dark:text-amber-500/40 ml-1">items</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-amber-700/70 dark:text-amber-400/70 font-bold flex items-center gap-1">
                <span className="text-[10px]">{currencySymbol}</span>
                {unbilledAmount.toFixed(2)} Pending
              </p>
              <ArrowUpRight size={14} className="text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-emerald-50/30 dark:bg-emerald-900/10 p-6 sm:p-8 rounded-[32px] border border-emerald-100/50 dark:border-emerald-900/20 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <Banknote size={24} />
            </div>
            <p className="text-[10px] font-bold text-emerald-600/60 dark:text-emerald-500/60 uppercase tracking-[0.2em] mb-1">Billed Revenue</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-emerald-600/40 dark:text-emerald-500/40">{currencySymbol}</span>
              <span className="text-4xl sm:text-5xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">{billedAmount.toFixed(0)}</span>
              <span className="text-sm font-bold text-emerald-600/40 dark:text-emerald-500/40">.{billedAmount.toFixed(2).split('.')[1]}</span>
            </div>
            <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-3 font-bold flex items-center gap-1">
              <CheckCircle2 size={12} />
              {billedRequests.length} requests processed
            </p>
          </div>
        </motion.div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Out-of-Scope Requests</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Requests that exceed the standard monthly retainer scope</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
                <th className="px-8 py-4">Client</th>
                <th className="px-8 py-4">Type</th>
                <th className="px-8 py-4">Description</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {useAgencyStore.getState().clients.find(c => c.id === req.clientId)?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-indigo-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">{req.type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">{req.description}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm text-slate-400 dark:text-slate-500">
                      {new Date(req.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{currencySymbol}{req.amount.toFixed(2)}</span>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => handleToggleStatus(req)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all",
                        req.status === 'billed' 
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                      )}
                    >
                      {req.status === 'billed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {req.status}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingRequest(req);
                          setFormData({
                            type: req.type,
                            description: req.description,
                            amount: req.amount,
                            hours: req.amount / (agencySettings.defaultHourlyRate || 1),
                            date: req.date,
                            status: req.status
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(req.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText size={32} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No requests found</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Add your first out-of-scope request to start tracking.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {editingRequest ? 'Edit Request' : 'New Scope Request'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {!currentClient && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center gap-3">
                    <AlertCircle size={20} />
                    Please select a client first.
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Request Type</label>
                  <div className="relative">
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none outline-none transition-all dark:text-white"
                    >
                      <option>Extra Revision</option>
                      <option>Additional Asset</option>
                      <option>Urgent Turnaround</option>
                      <option>Strategy Session</option>
                      <option>Platform Management</option>
                      <option>Other</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</label>
                  <textarea 
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the out-of-scope work..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Est. Hours (Rate: {currencySymbol}{agencySettings.defaultHourlyRate}/hr)
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.5"
                      value={formData.hours}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value) || 0;
                        setFormData({ 
                          ...formData, 
                          hours, 
                          amount: hours * (agencySettings.defaultHourlyRate || 0) 
                        });
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount ({currencySymbol})</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    disabled={!currentClient}
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingRequest ? 'Update Request' : 'Create Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


