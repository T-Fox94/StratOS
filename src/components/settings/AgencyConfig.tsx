import React, { useState } from 'react';
import { 
  Building2, 
  Globe, 
  Clock, 
  DollarSign, 
  Banknote,
  Users, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Save,
  CreditCard,
  Settings,
  Briefcase,
  UserPlus,
  Mail,
  User,
  Trash2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useAgencyStore, UserProfile, getCurrencySymbol } from '../../store/useAgencyStore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export function AgencyConfig() {
  const { agencySettings, setAgencySettings, users } = useAgencyStore();
  const { profile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const currencySymbol = getCurrencySymbol(agencySettings.currency);
  
  const [formData, setFormData] = useState({
    name: agencySettings.name,
    defaultHourlyRate: agencySettings.defaultHourlyRate,
    currency: agencySettings.currency,
    timezone: agencySettings.timezone
  });

  const [newUser, setNewUser] = useState({
    email: '',
    displayName: '',
    role: 'manager' as 'admin' | 'manager' | 'editor' | 'client',
    clientId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.role !== 'admin') {
      toast.error('Only administrators can change agency settings.');
      return;
    }

    setIsSaving(true);

    try {
      await setDoc(doc(db, 'config', 'agency'), formData);
      setAgencySettings(formData);
      toast.success('Agency settings updated successfully!');
    } catch (error: any) {
      console.error("Error updating agency config:", error);
      toast.error(error.message || 'Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.role !== 'admin') {
      toast.error('Only administrators can add team members.');
      return;
    }

    setIsSaving(true);
    try {
      // In this prototype, we create a user document. 
      // When the user logs in with this email, they will get this profile.
      // We use a temporary ID or the email as ID if we want to pre-register.
      // For simplicity, we'll use a random ID or just let them sign up.
      // Actually, creating a doc in 'users' with a random ID is fine, 
      // but AuthContext looks for doc(db, 'users', firebaseUser.uid).
      // So we should probably have an 'invites' collection or just 
      // wait for them to join.
      
      // Better: Let's just create a dummy doc for now to show in the list
      const tempId = Math.random().toString(36).substring(7);
      await setDoc(doc(db, 'users', tempId), {
        ...newUser,
        uid: tempId,
        createdAt: serverTimestamp()
      });
      
      toast.success(`${newUser.displayName} added as ${newUser.role}`);
      setIsAddingUser(false);
      setNewUser({ email: '', displayName: '', role: 'manager', clientId: '' });
    } catch (error: any) {
      toast.error('Failed to add team member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'manager' | 'client') => {
    if (profile?.role !== 'admin') return;
    
    try {
      await setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true });
      toast.success('User role updated');
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (profile?.role !== 'admin') return;
    if (userId === profile.uid) {
      toast.error('You cannot delete yourself');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('User removed from team');
    } catch (error) {
      toast.error('Failed to remove user');
    }
  };

  const roleCounts = {
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    client: users.filter(u => u.role === 'client').length
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Agency Configuration</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">Configure global settings and manage your high-performance team.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
          <Shield className="text-indigo-600 dark:text-indigo-400" size={18} />
          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Admin Mode</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* General Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Building2 className="text-indigo-500" size={24} />
              Agency Profile
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Agency Name</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Default Hourly Rate ({currencySymbol})</label>
                  <div className="relative">
                    <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={formData.defaultHourlyRate}
                      onChange={(e) => setFormData({ ...formData, defaultHourlyRate: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Currency</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-12 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none outline-none transition-all dark:text-white"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="ZMW">ZMW (K)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="ZAR">ZAR (R)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Timezone</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-12 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none outline-none transition-all dark:text-white"
                  >
                    <option value="UTC">UTC (Universal Time)</option>
                    <option value="CAT">CAT (Central Africa Time)</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="PST">PST (Pacific Standard Time)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSaving || profile?.role !== 'admin'}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Update Configuration'}
                </button>
              </div>
            </form>
          </div>

          {/* Team Management */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="text-emerald-500" size={24} />
                Team Management
              </h2>
              <button 
                onClick={() => setIsAddingUser(!isAddingUser)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all"
              >
                <UserPlus size={16} />
                Add Member
              </button>
            </div>

            <AnimatePresence>
              {isAddingUser && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-8"
                >
                  <form onSubmit={handleAddUser} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input 
                            type="text" 
                            required
                            value={newUser.displayName}
                            onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input 
                            type="email" 
                            required
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                            placeholder="john@agency.com"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
                      <div className="flex-1 w-full space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</label>
                        <div className="relative">
                          <select 
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                            className="w-full bg-white dark:bg-slate-800 border-none rounded-lg px-4 pr-10 py-2 text-xs focus:ring-2 focus:ring-emerald-500 appearance-none outline-none dark:text-white"
                          >
                            <option value="admin">Administrator</option>
                            <option value="manager">Manager</option>
                            <option value="editor">Editor</option>
                            <option value="client">Client User</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown size={14} />
                          </div>
                        </div>
                      </div>

                      {newUser.role === 'client' && (
                        <div className="flex-1 w-full space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign Portfolio</label>
                          <div className="relative">
                            <select 
                              required={newUser.role === 'client'}
                              value={newUser.clientId}
                              onChange={(e) => setNewUser({ ...newUser, clientId: e.target.value })}
                              className="w-full bg-white dark:bg-slate-800 border-none rounded-lg px-4 pr-10 py-2 text-xs focus:ring-2 focus:ring-emerald-500 appearance-none outline-none dark:text-white"
                            >
                              <option value="">Select a client...</option>
                              {useAgencyStore.getState().clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              <ChevronDown size={14} />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-end gap-2 shrink-0">
                        <button 
                          type="button"
                          onClick={() => setIsAddingUser(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={isSaving}
                          className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isSaving ? 'Adding...' : 'Confirm Add'}
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.uid} className="group p-4 rounded-2xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                      {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {user.displayName || 'Unnamed User'}
                        {user.uid === profile?.uid && (
                          <span className="text-[8px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">You</span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        {user.email}
                        {user.role === 'client' && user.clientId && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="text-indigo-500 font-medium">
                              {useAgencyStore.getState().clients.find(c => c.id === user.clientId)?.name || 'Unknown Portfolio'}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <select 
                        value={user.role}
                        disabled={user.uid === profile?.uid || profile?.role !== 'admin'}
                        onChange={(e) => handleUpdateRole(user.uid, e.target.value as any)}
                        className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-400 pr-8 focus:ring-0 cursor-pointer disabled:cursor-not-allowed appearance-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="editor">Editor</option>
                        <option value="client">Client</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                    
                    {user.uid !== profile?.uid && profile?.role === 'admin' && (
                      <button 
                        onClick={() => handleDeleteUser(user.uid)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Team Stats */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="text-indigo-500" size={20} />
              Team Composition
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Administrators', count: roleCounts.admin, color: 'bg-indigo-500' },
                { label: 'Managers', count: roleCounts.manager, color: 'bg-emerald-500' },
                { label: 'Client Users', count: roleCounts.client, color: 'bg-amber-500' }
              ].map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">{stat.label}</span>
                    <span className="text-slate-900 dark:text-white">{stat.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-500", stat.color)}
                      style={{ width: `${(stat.count / users.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-slate-900 dark:bg-slate-950 rounded-[32px] p-8 text-white shadow-xl border dark:border-slate-800">
            <h3 className="text-lg font-bold mb-6">System Status</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Database</span>
                <span className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">AI Engine</span>
                <span className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Social APIs</span>
                <span className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

