import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ExternalLink, 
  ShieldAlert,
  ChevronDown,
  AlertTriangle,
  Briefcase,
  Globe,
  CheckCircle2,
  Edit2,
  X,
  Image as ImageIcon,
  Trash2,
  Activity,
  Calendar as CalendarIcon,
  Settings,
  Clock,
  Palette,
  Hash,
  Smile,
  Layout
} from 'lucide-react';
import { toast } from 'sonner';
import { useAgencyStore, Client } from '../../store/useAgencyStore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, setDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

const initialClients: Client[] = [
  { 
    id: '1', 
    name: 'Lumina Tech', 
    slug: 'lumina-tech', 
    industry: 'Software', 
    status: 'active', 
    riskLevel: 'low', 
    monthlyQuota: 40, 
    currentMonthUsage: 32, 
    logo: 'https://picsum.photos/seed/lumina/200',
    website: 'https://lumina.tech',
    toneOfVoice: 'Professional, innovative, and authoritative yet accessible.',
    visualStyle: 'Clean, minimalist, high-tech aesthetic with plenty of whitespace.',
    brandColors: ['#4F46E5', '#10B981'],
    approvedHashtags: ['#LuminaTech', '#SaaS', '#Innovation'],
    doNotUse: 'Avoid overly casual slang, emojis in professional posts, and mentioning competitors directly.'
  },
  { 
    id: '2', 
    name: 'Global Logistics', 
    slug: 'global-logistics', 
    industry: 'Supply Chain', 
    status: 'active', 
    riskLevel: 'medium', 
    monthlyQuota: 20, 
    currentMonthUsage: 8, 
    logo: 'https://picsum.photos/seed/logistics/200',
    website: 'https://globallogistics.com',
    toneOfVoice: 'Reliable, efficient, and global-minded.',
    visualStyle: 'Industrial, bold, and structured.',
    brandColors: ['#1E293B', '#F59E0B'],
    approvedHashtags: ['#Logistics', '#GlobalTrade'],
    doNotUse: 'Do not use bright neon colors or informal language.'
  },
  { 
    id: '3', 
    name: 'Urban Wear', 
    slug: 'urban-wear', 
    industry: 'Fashion', 
    status: 'active', 
    riskLevel: 'high', 
    monthlyQuota: 60, 
    currentMonthUsage: 55, 
    logo: 'https://picsum.photos/seed/urban/200',
    website: 'https://urbanwear.io',
    toneOfVoice: 'Edgy, youthful, and trend-setting.',
    visualStyle: 'Vibrant, street-style, and dynamic.',
    brandColors: ['#EC4899', '#06B6D4'],
    approvedHashtags: ['#Streetwear', '#UrbanStyle', '#FashionTrend'],
    doNotUse: 'Avoid corporate jargon or stiff, formal phrasing.'
  },
  { 
    id: '4', 
    name: 'Hearts United', 
    slug: 'hearts-united', 
    industry: 'Non-Profit / Charity', 
    status: 'paused', 
    riskLevel: 'low', 
    monthlyQuota: 16, 
    currentMonthUsage: 0, 
    logo: 'https://picsum.photos/seed/hearts/200',
    website: 'https://heartsunited.org',
    toneOfVoice: 'Compassionate, hopeful, and community-focused.',
    visualStyle: 'Warm, organic, and human-centric.',
    brandColors: ['#EF4444', '#FCD34D'],
    approvedHashtags: ['#Charity', '#Community', '#HeartsUnited'],
    doNotUse: 'Avoid negative or fear-based messaging.'
  },
];

export function ClientsManagement() {
  const { user } = useAuth();
  const { 
    currentClient, 
    setCurrentClient, 
    clients, 
    setClients, 
    addClient, 
    updateClient, 
    deleteClient,
    setActiveView 
  } = useAgencyStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientDetails, setSelectedClientDetails] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    status: 'active',
    riskLevel: 'low',
    monthlyQuota: 20,
    logo: '',
    website: '',
    toneOfVoice: '',
    visualStyle: '',
    colors: ['#6366F1'],
    approvedHashtags: '',
    doNotUse: ''
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // For development and demo purposes, we'll allow all users to see admin buttons
  const isAdmin = true;

  useEffect(() => {
    // We don't seed initialClients here anymore, 
    // Firestore sync will handle populating the clients list.
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.industry.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        industry: client.industry,
        status: client.status,
        riskLevel: client.riskLevel,
        monthlyQuota: client.monthlyQuota,
        logo: client.logo || '',
        website: client.website || '',
        toneOfVoice: client.toneOfVoice || '',
        visualStyle: client.visualStyle || '',
        colors: client.brandColors || ['#6366F1'],
        approvedHashtags: client.approvedHashtags?.join(', ') || '',
        doNotUse: client.doNotUse || ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        industry: '',
        status: 'active',
        riskLevel: 'low',
        monthlyQuota: 20,
        logo: '',
        website: '',
        toneOfVoice: '',
        visualStyle: '',
        colors: ['#6366F1'],
        approvedHashtags: '',
        doNotUse: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientId = editingClient ? editingClient.id : Math.random().toString(36).substr(2, 9);
    
    const clientData = {
      ...formData,
      id: clientId,
      brandColors: formData.colors,
      approvedHashtags: formData.approvedHashtags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
      currentMonthUsage: editingClient ? editingClient.currentMonthUsage : 0,
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'clients', clientId), clientData);
      setIsModalOpen(false);
      toast.success(editingClient ? 'Client updated successfully!' : 'Client created successfully!');
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error('Failed to save client.');
    }
  };

  const handleCardClick = (client: Client) => {
    setSelectedClientDetails(client);
  };

  const handleDeleteClient = async (clientId: string) => {
    setIsDeleting(clientId);
  };

  const confirmDelete = async (clientId: string) => {
    try {
      await deleteDoc(doc(db, 'clients', clientId));
      setSelectedClientDetails(null);
      setIsDeleting(null);
      toast.success('Client deleted successfully!');
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error('Failed to delete client.');
    }
  };

  const handleChangeStatus = async (client: Client, newStatus: string) => {
    try {
      await setDoc(doc(db, 'clients', client.id), { ...client, status: newStatus }, { merge: true });
      setSelectedClientDetails({ ...client, status: newStatus });
      toast.success(`Client status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error('Failed to update status.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Client Portfolio</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your agency's client relationships and service quotas.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all w-full sm:w-auto"
          >
            <Plus size={24} />
            Add New Client
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
        <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <Filter size={18} />
          Filters
        </button>
      </div>

      <div className="space-y-3">
        {filteredClients.map((client, i) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleCardClick(client)}
            className={cn(
              "rounded-2xl border p-4 cursor-pointer transition-all flex items-center justify-between group",
              currentClient?.id === client.id 
                ? "bg-slate-900 dark:bg-indigo-600 border-slate-900 dark:border-indigo-600 text-white shadow-lg shadow-slate-200 dark:shadow-indigo-900/20" 
                : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 text-slate-900 dark:text-white"
            )}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={cn(
                "w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0",
                currentClient?.id === client.id ? "bg-white/10" : "bg-slate-100 dark:bg-slate-700"
              )}>
                {client.logo ? (
                  <img src={client.logo} alt={client.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Briefcase size={24} className={currentClient?.id === client.id ? "text-white/40" : "text-slate-400 dark:text-slate-500"} />
                )}
              </div>
              <div className="min-w-0">
                <h3 className={cn(
                  "text-base font-bold truncate",
                  currentClient?.id === client.id ? "text-white" : "text-slate-900 dark:text-white"
                )}>
                  {client.name}
                </h3>
                <p className={cn(
                  "text-xs font-medium truncate",
                  currentClient?.id === client.id ? "text-slate-400 dark:text-indigo-100" : "text-slate-500 dark:text-slate-400"
                )}>
                  {client.industry}
                </p>
              </div>
            </div>

              <div className="flex items-center gap-2 sm:gap-4">
                {currentClient?.id !== client.id && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentClient(client);
                      toast.success(`Active client set to ${client.name}`);
                    }}
                    className="hidden sm:flex px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all"
                  >
                    Select
                  </button>
                )}
                
                <div className={cn(
                  "px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1 sm:gap-1.5 border",
                  client.status === 'active' 
                    ? (currentClient?.id === client.id ? "bg-white/10 border-white/20 text-white" : "bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-600 text-slate-900 dark:text-slate-200")
                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400"
                )}>
                {client.status === 'active' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {client.status === 'active' ? 'Active' : 'On Hold'}
                </span>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenModal(client);
                }}
                className={cn(
                  "p-2.5 rounded-xl transition-all flex items-center justify-center",
                  currentClient?.id === client.id 
                    ? "bg-white/20 text-white hover:bg-white/30" 
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                )}
              >
                <Edit2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 pb-4 text-center relative border-b border-slate-50 dark:border-slate-800">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  {editingClient ? 'Update client profile and brand guidelines' : 'Create a new client profile with brand guidelines'}
                </p>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="absolute right-6 top-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  {/* Name & Industry */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Client Name *</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g., Acme Corp"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Industry *</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g., Technology"
                      value={formData.industry}
                      onChange={e => setFormData({...formData, industry: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Website */}
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Website</label>
                    <input 
                      type="url"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={e => setFormData({...formData, website: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Status & Risk */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Status</label>
                    <div className="relative">
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none transition-all dark:text-white"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="lead">Lead</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Risk Level</label>
                    <div className="relative">
                      <select 
                        value={formData.riskLevel}
                        onChange={e => setFormData({...formData, riskLevel: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none transition-all dark:text-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 border-t border-slate-100 dark:border-slate-800 my-2" />

                  {/* Tone of Voice */}
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tone of Voice</label>
                    <input 
                      type="text"
                      placeholder="e.g., Professional, Friendly, Authoritative"
                      value={formData.toneOfVoice}
                      onChange={e => setFormData({...formData, toneOfVoice: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Visual Style */}
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Visual Style</label>
                    <input 
                      type="text"
                      placeholder="e.g., Minimalist, Bold, Corporate"
                      value={formData.visualStyle}
                      onChange={e => setFormData({...formData, visualStyle: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Brand Colors */}
                  <div className="col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Brand Colors</label>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, colors: [...formData.colors, '#6366F1']})}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        <Plus size={14} />
                        Add Color
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.colors.map((color, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                            <input 
                              type="color"
                              value={color}
                              onChange={e => {
                                const newColors = [...formData.colors];
                                newColors[index] = e.target.value;
                                setFormData({...formData, colors: newColors});
                              }}
                              className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                            />
                          </div>
                          <input 
                            type="text"
                            value={color}
                            onChange={e => {
                              const newColors = [...formData.colors];
                              newColors[index] = e.target.value;
                              setFormData({...formData, colors: newColors});
                            }}
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 transition-all uppercase dark:text-white"
                          />
                          {formData.colors.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => {
                                const newColors = formData.colors.filter((_, i) => i !== index);
                                setFormData({...formData, colors: newColors});
                              }}
                              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hashtags */}
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Approved Hashtags (comma-separated)</label>
                    <textarea 
                      placeholder="BrandName, IndustryKeyword, CampaignTag"
                      value={formData.approvedHashtags}
                      onChange={e => setFormData({...formData, approvedHashtags: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all min-h-[80px] dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Do Not Use */}
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Do Not Use (restrictions)</label>
                    <textarea 
                      placeholder="No memes, No political content, etc."
                      value={formData.doNotUse}
                      onChange={e => setFormData({...formData, doNotUse: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all min-h-[80px] dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Logo URL & Upload */}
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Client Logo</label>
                    <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 relative group">
                        {formData.logo ? (
                          <>
                            <img src={formData.logo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, logo: ''})}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                            >
                              <Trash2 size={20} />
                            </button>
                          </>
                        ) : (
                          <ImageIcon size={32} className="text-slate-300 dark:text-slate-600" />
                        )}
                      </div>
                      <div className="w-full flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="url"
                            value={formData.logo}
                            onChange={e => setFormData({...formData, logo: e.target.value})}
                            placeholder="Paste logo URL..."
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white dark:placeholder:text-slate-500"
                          />
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
                          >
                            <Plus size={16} />
                            Upload
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider text-center sm:text-left">
                          Recommended: Square PNG or SVG, max 1MB
                        </p>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleLogoUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Monthly Quota */}
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Monthly Post Quota</label>
                    <input 
                      required
                      type="number"
                      value={formData.monthlyQuota}
                      onChange={e => setFormData({...formData, monthlyQuota: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4 border-t border-slate-50 dark:border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm"
                  >
                    {editingClient ? 'Save Changes' : 'Create Client'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleting && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleting(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Delete Client?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
                Are you sure you want to delete this client? All associated data will be permanently removed. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsDeleting(null)}
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => confirmDelete(isDeleting)}
                  className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Client Details Side Panel / Modal */}
      <AnimatePresence>
        {selectedClientDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center lg:justify-end p-0 lg:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClientDetails(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative bg-white dark:bg-slate-900 shadow-2xl w-full max-w-2xl lg:max-w-[480px] h-full overflow-hidden flex flex-col border-l border-slate-100 dark:border-slate-800"
            >
              {/* Header */}
              <div className="p-8 pb-6 flex items-start justify-between border-b border-slate-50 dark:border-slate-800">
                <div className="flex flex-col gap-1">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-1">{selectedClientDetails.name}</h2>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500">{selectedClientDetails.industry}</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                        selectedClientDetails.riskLevel === 'low' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30" :
                        selectedClientDetails.riskLevel === 'medium' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30"
                      )}>
                        {selectedClientDetails.riskLevel} Risk
                      </span>
                      <div className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 border",
                        selectedClientDetails.status === 'active' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30" : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      )}>
                        <Clock size={10} />
                        {selectedClientDetails.status}
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedClientDetails(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-6 custom-scrollbar">
                {/* Monthly Quota */}
                <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Quota</h3>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {selectedClientDetails.currentMonthUsage} / {selectedClientDetails.monthlyQuota} posts
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        (selectedClientDetails.currentMonthUsage / selectedClientDetails.monthlyQuota) > 0.8 ? "bg-rose-500" : "bg-indigo-600"
                      )} 
                      style={{ width: `${(selectedClientDetails.currentMonthUsage / selectedClientDetails.monthlyQuota) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Tone of Voice */}
                <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                    <Smile size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Tone of Voice</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {selectedClientDetails.toneOfVoice || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Visual Style */}
                <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <Layout size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Visual Style</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {selectedClientDetails.visualStyle || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Do Not Use */}
                <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Do Not Use</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {selectedClientDetails.doNotUse || 'None specified'}
                    </p>
                  </div>
                </div>

                {/* Brand Colors */}
                <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Brand Colors</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedClientDetails.brandColors?.map((color, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div 
                          className="w-6 h-6 rounded-lg shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Approved Hashtags */}
                <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Hash size={20} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Approved Hashtags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedClientDetails.approvedHashtags && selectedClientDetails.approvedHashtags.length > 0 ? (
                      selectedClientDetails.approvedHashtags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">None specified</p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4 pt-4">
                  <button 
                    onClick={() => {
                      setCurrentClient(selectedClientDetails);
                      toast.success(`Active client set to ${selectedClientDetails.name}`);
                    }}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg",
                      currentClient?.id === selectedClientDetails.id
                        ? "bg-emerald-600 text-white shadow-emerald-100 dark:shadow-none cursor-default"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 dark:shadow-none"
                    )}
                  >
                    {currentClient?.id === selectedClientDetails.id ? (
                      <>
                        <CheckCircle2 size={20} />
                        Active Client
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        Select as Active Client
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        setCurrentClient(selectedClientDetails);
                        setActiveView('accounts');
                        setSelectedClientDetails(null);
                      }}
                      className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
                    >
                      <Globe size={18} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white">Social Accounts</span>
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentClient(selectedClientDetails);
                        setActiveView('calendar');
                        setSelectedClientDetails(null);
                      }}
                      className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
                    >
                      <CalendarIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white">Calendar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              {isAdmin && (
                <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 z-10">
                  <button 
                    onClick={() => {
                      handleOpenModal(selectedClientDetails);
                      setSelectedClientDetails(null);
                    }}
                    className="flex-1 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200 dark:shadow-none"
                  >
                    <Edit2 size={18} /> Edit Profile
                  </button>
                  <button 
                    onClick={() => handleDeleteClient(selectedClientDetails.id)}
                    className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
