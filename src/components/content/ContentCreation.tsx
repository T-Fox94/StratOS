import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Send, 
  Image as ImageIcon, 
  Calendar as CalendarIcon, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Facebook,
  CheckCircle2,
  Clock,
  FileText,
  Edit2,
  Trash2,
  Wand2,
  AlertTriangle,
  Music,
  MessageSquare,
  Search,
  Volume2,
  VolumeX,
  Check,
  X
} from 'lucide-react';
import { TikTokIcon } from '../icons/TikTokIcon';
import { useAgencyStore, Post } from '../../store/useAgencyStore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, setDoc, deleteDoc, collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { generateAICaption, analyzePostSentiment, speakText, generateAIImage } from '../../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from '../../lib/utils';

const platforms = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { id: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-sky-500' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'tiktok', label: 'TikTok', icon: TikTokIcon, color: 'text-slate-900' },
];

export function ContentCreation() {
  const { currentClient, posts, socialAccounts, addPost, updatePost, deletePost, addComment, updateComment, addCrisisEvent } = useAgencyStore();
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [analyzingPostId, setAnalyzingPostId] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<{
    postId: string;
    sentiment: string;
    brandRisk: string;
    analysis: string;
    recommendations: string[];
  } | null>(null);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clientPosts = posts.filter(p => p.clientId === currentClient?.id);
  const connectedPlatforms = socialAccounts
    .filter(acc => acc.clientId === currentClient?.id && acc.status === 'connected')
    .map(acc => acc.platform);

  const availablePlatforms = platforms.filter(p => connectedPlatforms.includes(p.id as any));

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setCaption(editingPost.caption);
      setSelectedPlatforms([editingPost.platform]);
      setScheduledDate(editingPost.scheduledFor || '');
      setMediaUrl(editingPost.mediaUrl || '');
    }
  }, [editingPost]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleCreateOrUpdate = async () => {
    if (!title || !caption || selectedPlatforms.length === 0 || !currentClient || !profile) return;

    const isManager = profile.role === 'manager';
    const isAdmin = profile.role === 'admin';

    try {
      let mainPostId = editingPost?.id;
      if (editingPost) {
        await setDoc(doc(db, 'posts', editingPost.id), {
          ...editingPost,
          title,
          caption,
          mediaUrl,
          platform: selectedPlatforms[0],
          scheduledFor: scheduledDate,
          status: isAdmin ? (scheduledDate ? 'scheduled' : 'approved') : 'pending',
          updatedAt: serverTimestamp()
        });
        setEditingPost(null);
      } else {
        const groupId = Math.random().toString(36).substr(2, 9);
        const promises = selectedPlatforms.map(platform => {
          const postId = Math.random().toString(36).substr(2, 9);
          if (!mainPostId) mainPostId = postId;
          return setDoc(doc(db, 'posts', postId), {
            id: postId,
            groupId,
            title,
            caption,
            mediaUrl,
            platform,
            status: isAdmin ? (scheduledDate ? 'scheduled' : 'approved') : 'pending',
            scheduledFor: scheduledDate,
            clientId: currentClient.id,
            createdAt: serverTimestamp()
          });
        });
        await Promise.all(promises);
      }

      // Create notification for client users if status is pending
      if ((isAdmin || isManager) && currentClient) {
        const notificationId = Math.random().toString(36).substr(2, 9);
        const status = isAdmin ? (scheduledDate ? 'scheduled' : 'approved') : 'pending';
        
        if (status === 'pending') {
          await setDoc(doc(db, 'notifications', notificationId), {
            id: notificationId,
            type: 'content',
            title: 'New Content for Approval',
            message: `A new post "${title}" has been created for ${currentClient.name} and is awaiting your feedback/approval.`,
            time: new Date().toISOString(),
            read: false,
            priority: 'medium',
            clientId: currentClient.id,
            userId: 'agency'
          });
        }
      }

      setTitle('');
      setCaption('');
      setSelectedPlatforms([]);
      setScheduledDate('');
      setMediaUrl('');
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (postToDelete) {
      try {
        await deleteDoc(doc(db, 'posts', postToDelete.id));
        setPostToDelete(null);
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const handleGenerateAICaption = async () => {
    if (!currentClient) return;
    setIsGeneratingCaption(true);
    const suggestion = await generateAICaption(
      currentClient.name, 
      currentClient.toneOfVoice || "Professional", 
      currentClient.visualStyle || "Clean"
    );
    setCaption(suggestion);
    setIsGeneratingCaption(false);
    
    // Voice interaction
    if (suggestion) {
      setIsSpeaking(true);
      await speakText(`Here is a suggestion for your ${currentClient.name} post: ${suggestion}`);
      setIsSpeaking(false);
    }
  };

  const handleGenerateAIImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateAIImage(imagePrompt);
      setMediaUrl(imageUrl);
      setShowImagePrompt(false);
      setImagePrompt('');
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAnalyzePost = async (post: Post) => {
    setAnalyzingPostId(post.id);
    
    // Real AI Analysis
    const result = await analyzePostSentiment(post.title, post.caption, post.platform);
    
    setAuditResult({
      postId: post.id,
      ...result
    });

    // Simulate comments based on analysis
    const mockComments = [
      { id: '1', author: 'User123', text: 'This looks amazing!', sentiment: 'positive' as const, createdAt: new Date().toISOString() },
      { id: '2', author: 'Hater88', text: 'This is a complete scam, do not buy!', sentiment: 'negative' as const, createdAt: new Date().toISOString() },
      { id: '3', author: 'NeutralGuy', text: 'When is the release date?', sentiment: 'neutral' as const, createdAt: new Date().toISOString() },
    ];

    mockComments.forEach(c => addComment(post.id, c));

    const hasNegative = mockComments.some(c => c.sentiment === 'negative') || result.brandRisk === 'High';
    if (hasNegative && currentClient) {
      const crisisId = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'crisis_events', crisisId), {
        id: crisisId,
        title: `Negative Sentiment Detected: ${post.title}`,
        description: result.analysis || `AI detected high-risk negative comments on your ${post.platform} post.`,
        severity: result.brandRisk.toLowerCase() === 'high' ? 'critical' : 'high',
        status: 'active',
        clientId: currentClient.id,
        createdAt: new Date().toLocaleString()
      });
    }
    
    // Voice interaction for analysis
    if (result.analysis) {
      setIsSpeaking(true);
      await speakText(`I've analyzed your post for ${post.platform}. The sentiment is ${result.sentiment} and brand risk is ${result.brandRisk}.`);
      setIsSpeaking(false);
    }
    
    setAnalyzingPostId(null);
  };

  const handleApprove = async (post: Post) => {
    try {
      await setDoc(doc(db, 'posts', post.id), {
        ...post,
        status: post.scheduledFor ? 'scheduled' : 'approved'
      }, { merge: true });
    } catch (error) {
      console.error("Error approving post:", error);
    }
  };

  const handleReject = async (post: Post) => {
    try {
      await setDoc(doc(db, 'posts', post.id), {
        ...post,
        status: 'rejected'
      }, { merge: true });
    } catch (error) {
      console.error("Error rejecting post:", error);
    }
  };

  const canEdit = (post: Post) => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    if (profile.role === 'manager' && (post.status === 'pending' || post.status === 'rejected' || post.status === 'draft')) return true;
    return false;
  };

  const canDelete = (post: Post) => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    if (profile.role === 'manager' && (post.status === 'pending' || post.status === 'draft')) return true;
    return false;
  };

  const [newComment, setNewComment] = useState<{ [postId: string]: string }>({});

  const handleAddComment = (postId: string) => {
    const text = newComment[postId];
    if (!text || !profile) return;

    addComment(postId, {
      id: Math.random().toString(36).substr(2, 9),
      author: profile.displayName || profile.email,
      text,
      sentiment: 'neutral',
      status: profile.role === 'admin' ? 'approved' : 'pending',
      createdAt: new Date().toISOString()
    });

    // Create notification for agency if client adds a comment
    if (profile.role === 'client' && currentClient) {
      const notificationId = Math.random().toString(36).substr(2, 9);
      setDoc(doc(db, 'notifications', notificationId), {
        id: notificationId,
        type: 'content',
        title: 'New Client Feedback',
        message: `Client ${currentClient.name} added feedback to post: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        time: new Date().toISOString(),
        read: false,
        priority: 'high',
        clientId: currentClient.id,
        userId: 'agency' // Special flag or we could target specific admins
      });
    }

    setNewComment(prev => ({ ...prev, [postId]: '' }));
  };

  const handleApproveComment = (postId: string, commentId: string) => {
    updateComment(postId, commentId, { status: 'approved' });
  };

  const handleRejectComment = (postId: string, commentId: string) => {
    updateComment(postId, commentId, { status: 'rejected' });
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {editingPost ? 'Edit Content' : 'Create Content'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Draft and schedule multi-platform posts for your clients.</p>
        </div>
        {editingPost && (
          <button 
            onClick={() => {
              setEditingPost(null);
              setTitle('');
              setCaption('');
              setSelectedPlatforms([]);
              setScheduledDate('');
            }}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm"
          >
            Cancel Editing
          </button>
        )}
      </div>

      {!currentClient ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-6 rounded-2xl flex items-center gap-4 text-amber-800 dark:text-amber-400">
          <Clock size={24} />
          <div>
            <p className="font-bold">No Client Selected</p>
            <p className="text-sm">Please select a client from the Clients Management page before creating content.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {/* Main Form */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Post Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Summer Campaign Teaser"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Caption / Body</label>
                  <div className="flex items-center gap-3">
                    {isSpeaking && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">
                        <Volume2 size={12} />
                        AI Speaking...
                      </div>
                    )}
                    <button 
                      onClick={handleGenerateAICaption}
                      disabled={isGeneratingCaption}
                      className={cn(
                        "text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300",
                        isGeneratingCaption && "animate-pulse opacity-50"
                      )}
                    >
                      <Wand2 size={12} />
                      {isGeneratingCaption ? 'Thinking...' : 'AI Suggestion'}
                    </button>
                  </div>
                </div>
                <textarea 
                  rows={6}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write your engaging caption here..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all resize-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Select Platforms (Connected Only)</label>
                {availablePlatforms.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {availablePlatforms.map(p => (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                          selectedPlatforms.includes(p.id) 
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" 
                            : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                        )}
                      >
                        <p.icon size={24} className={cn(selectedPlatforms.includes(p.id) ? p.color : "text-slate-400 dark:text-slate-600")} />
                        <span className={cn("text-xs font-bold mt-2", selectedPlatforms.includes(p.id) ? "text-indigo-900 dark:text-indigo-200" : "text-slate-500 dark:text-slate-400")}>
                          {p.label}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">No social accounts connected for this client. <button onClick={() => useAgencyStore.getState().setActiveView('accounts')} className="text-indigo-600 dark:text-indigo-400 font-bold">Connect one now</button></p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                      mediaUrl ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    <ImageIcon size={18} />
                    {mediaUrl ? 'Change Media' : 'Add Media'}
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleMediaUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button 
                    onClick={() => setShowImagePrompt(!showImagePrompt)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                      showImagePrompt ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    <Wand2 size={18} />
                    AI Image
                  </button>
                  {mediaUrl && (
                    <button 
                      onClick={() => setMediaUrl('')}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                    >
                      <Trash2 size={10} />
                      Remove Media
                    </button>
                  )}
                </div>
                {showImagePrompt && (
                  <div className="w-full space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Describe the image you want to generate..."
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateAIImage()}
                      />
                      <button
                        onClick={handleGenerateAIImage}
                        disabled={isGeneratingImage || !imagePrompt.trim()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {isGeneratingImage ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                        Generate
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                      Tip: Use descriptive keywords like "minimalist", "vibrant", or "cinematic lighting".
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold h-fit">
                  <CalendarIcon size={18} />
                  <input 
                    type="datetime-local" 
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-transparent border-none text-xs focus:ring-0 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button 
                onClick={() => {
                  setTitle('');
                  setCaption('');
                  setSelectedPlatforms([]);
                  setScheduledDate('');
                  setEditingPost(null);
                }}
                className="flex-1 sm:flex-none px-6 py-3 text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
              >
                Clear
              </button>
              <button 
                onClick={handleCreateOrUpdate}
                className="flex-1 sm:flex-none bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Send size={18} />
                {editingPost ? 'Update Post' : 'Submit for Approval'}
              </button>
            </div>

            {/* Recent Posts List */}
            <div className="space-y-6 pt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Content Workflow</h2>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    Pending
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    Approved
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Scheduled
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Published
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {clientPosts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                    No content pieces created yet.
                  </div>
                ) : (
                  // Group by groupId or id if no groupId
                  Object.values(clientPosts.reduce((acc, post) => {
                    const key = post.groupId || post.id;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(post);
                    return acc;
                  }, {} as { [key: string]: Post[] })).map(group => {
                    const mainPost = group[0];
                    return (
                      <div key={mainPost.groupId || mainPost.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                <FileText size={24} className="text-slate-400 dark:text-slate-500" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{mainPost.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex -space-x-2">
                                    {group.map(p => {
                                      const platform = platforms.find(pl => pl.id === p.platform);
                                      return (
                                        <div key={p.id} className={cn(
                                          "w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm",
                                          platform?.color.replace('text-', 'bg-').replace('600', '500').replace('500', '400') || "bg-slate-100 dark:bg-slate-800"
                                        )}>
                                          {platform && <platform.icon size={12} className="text-white" />}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">
                                    {group.length} {group.length === 1 ? 'Platform' : 'Platforms'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isAdmin && group.some(p => p.status === 'pending') && (
                                <div className="flex items-center gap-1 mr-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                                  <button 
                                    onClick={() => group.forEach(p => p.status === 'pending' && handleApprove(p))}
                                    className="p-2 bg-white dark:bg-slate-900 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all shadow-sm"
                                    title="Approve All"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button 
                                    onClick={() => group.forEach(p => p.status === 'pending' && handleReject(p))}
                                    className="p-2 bg-white dark:bg-slate-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all shadow-sm"
                                    title="Reject All"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              )}
                              <button 
                                onClick={() => handleAnalyzePost(mainPost)}
                                disabled={analyzingPostId === mainPost.id}
                                className={cn(
                                  "p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold",
                                  analyzingPostId === mainPost.id 
                                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 animate-pulse" 
                                    : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-100 dark:border-slate-700"
                                )}
                              >
                                <Wand2 size={16} />
                                {analyzingPostId === mainPost.id ? 'Analyzing...' : 'AI Audit'}
                              </button>
                            </div>
                          </div>

                          {/* Individual Platform Workflow */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.map(post => (
                              <div key={post.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group/item relative">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    {platforms.find(pl => pl.id === post.platform)?.icon({ size: 16, className: platforms.find(pl => pl.id === post.platform)?.color })}
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                      {platforms.find(pl => pl.id === post.platform)?.label}
                                    </span>
                                  </div>
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    post.status === 'published' ? "bg-emerald-500" :
                                    post.status === 'scheduled' ? "bg-blue-500" :
                                    post.status === 'approved' ? "bg-indigo-500" :
                                    post.status === 'rejected' ? "bg-rose-500" :
                                    "bg-amber-400"
                                  )} />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                                    post.status === 'published' ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" :
                                    post.status === 'scheduled' ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" :
                                    post.status === 'approved' ? "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400" :
                                    post.status === 'rejected' ? "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400" :
                                    "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                                  )}>
                                    {post.status}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    {canEdit(post) && (
                                      <button onClick={() => handleEdit(post)} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all">
                                        <Edit2 size={14} />
                                      </button>
                                    )}
                                    {canDelete(post) && (
                                      <button onClick={() => setPostToDelete(post)} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 shadow-sm transition-all">
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {post.scheduledFor && (
                                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                    <Clock size={12} />
                                    {new Date(post.scheduledFor).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Comments Section */}
                          {group.some(p => p.comments && p.comments.length > 0) && (
                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MessageSquare size={14} />
                                Feedback & Comments
                              </p>
                              <div className="space-y-4">
                                {group.flatMap(p => (p.comments || []).map(c => ({ ...c, postId: p.id }))).map(comment => (
                                  <div key={comment.id} className="flex gap-4 group/comment">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-xs border border-slate-200 dark:border-slate-700">
                                      {comment.author[0]}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{comment.author}</span>
                                        <span className={cn(
                                          "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded",
                                          comment.sentiment === 'positive' ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" :
                                          comment.sentiment === 'negative' ? "text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400" :
                                          "text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500"
                                        )}>
                                          {comment.sentiment}
                                        </span>
                                        {comment.status === 'pending' && (
                                          <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                                            Pending
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{comment.text}</p>
                                    </div>
                                    {isAdmin && comment.status === 'pending' && (
                                      <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => handleApproveComment(comment.postId, comment.id)}
                                          className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg" 
                                          title="Approve"
                                        >
                                          <Check size={14} />
                                        </button>
                                        <button 
                                          onClick={() => handleRejectComment(comment.postId, comment.id)}
                                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg" 
                                          title="Reject"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Add Comment Input */}
                          <div className="mt-6 flex gap-3">
                            <div className="flex-1 relative">
                              <input 
                                type="text" 
                                placeholder="Add internal feedback or client comment..."
                                value={newComment[mainPost.id] || ''}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [mainPost.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(mainPost.id)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none transition-all"
                              />
                            </div>
                            <button 
                              onClick={() => handleAddComment(mainPost.id)}
                              className="px-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
                            >
                              <Send size={14} />
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Preview Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden sticky top-24">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Live Preview</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    {currentClient.logo && <img src={currentClient.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{currentClient.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Sponsored</p>
                  </div>
                </div>
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 flex items-center justify-center text-slate-400 dark:text-slate-600 overflow-hidden">
                  {mediaUrl ? (
                    <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={48} strokeWidth={1} />
                  )}
                </div>
                <div className="text-sm text-slate-800 dark:text-slate-200 line-clamp-6 whitespace-pre-wrap prose prose-sm prose-slate dark:prose-invert max-w-none">
                  {caption ? (
                    <Markdown>{caption}</Markdown>
                  ) : (
                    <p className="text-slate-400 dark:text-slate-500 italic">Your caption will appear here...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* AI Audit Result Modal */}
      <AnimatePresence>
        {auditResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAuditResult(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Wand2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Content Audit</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Automated brand safety and sentiment analysis</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAuditResult(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sentiment</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-lg font-bold",
                        auditResult.sentiment.toLowerCase() === 'positive' ? "text-emerald-600 dark:text-emerald-400" :
                        auditResult.sentiment.toLowerCase() === 'negative' ? "text-rose-600 dark:text-rose-400" :
                        "text-slate-900 dark:text-white"
                      )}>
                        {auditResult.sentiment}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Brand Risk</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-lg font-bold",
                        auditResult.brandRisk.toLowerCase() === 'low' ? "text-emerald-600 dark:text-emerald-400" :
                        auditResult.brandRisk.toLowerCase() === 'medium' ? "text-amber-600 dark:text-amber-400" :
                        "text-rose-600 dark:text-rose-400"
                      )}>
                        {auditResult.brandRisk}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <FileText size={14} className="text-indigo-500" />
                      Detailed Analysis
                    </h4>
                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Markdown>{auditResult.analysis}</Markdown>
                    </div>
                  </div>

                  {auditResult.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        AI Recommendations
                      </h4>
                      <div className="space-y-2">
                        {auditResult.recommendations.map((rec, i) => (
                          <div key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400 bg-emerald-50/30 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <button 
                    onClick={() => setAuditResult(null)}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
                  >
                    Close Audit
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {postToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPostToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Post?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                  Are you sure you want to delete "<span className="font-semibold text-slate-700 dark:text-slate-200">{postToDelete.title}</span>"? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPostToDelete(null)}
                    className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 py-3 px-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg dark:shadow-none"
                  >
                    Delete Post
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
