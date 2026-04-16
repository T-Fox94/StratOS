import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  RefreshCw, 
  Instagram, 
  Video, 
  CheckCircle2, 
  Plus, 
  Wand2,
  ChevronRight,
  Zap,
  ArrowUpRight,
  Target,
  X,
  Send,
  Calendar,
  BarChart3,
  Lightbulb,
  ArrowUp,
  Clock
} from 'lucide-react';
import { useAgencyStore, Trend, Post } from '../../store/useAgencyStore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export function TrendWatcher() {
  const { currentClient, trends, setTrends, addPost } = useAgencyStore();
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock content idea
  const [contentIdea, setContentIdea] = useState({
    title: '',
    caption: '',
    platform: ''
  });

  // Mock analysis data
  const analysisData = [
    { name: 'Day 1', engagement: 400, reach: 2400 },
    { name: 'Day 2', engagement: 600, reach: 3000 },
    { name: 'Day 3', engagement: 800, reach: 4500 },
    { name: 'Day 4', engagement: 1200, reach: 6000 },
    { name: 'Day 5', engagement: 1500, reach: 8000 },
    { name: 'Day 6', engagement: 2100, reach: 11000 },
    { name: 'Day 7', engagement: 2800, reach: 15000 },
  ];

  useEffect(() => {
    if (!selectedTrend && trends.length > 0) {
      setSelectedTrend(trends[0]);
    }
  }, [trends, selectedTrend]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram size={16} />;
      case 'tiktok': return <Video size={16} />;
      default: return <TrendingUp size={16} />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Trend Watcher</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">Discover trending content opportunities for your clients</p>
        </div>
        <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
          <TrendingUp size={14} className="text-indigo-500" />
          Recommendations for {currentClient?.name || 'All Clients'}
        </button>
      </div>

      {/* Banner Section */}
      <div className="bg-indigo-600/10 dark:bg-indigo-500/5 border border-indigo-200/50 dark:border-indigo-500/20 rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <Wand2 size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{trends.length} Trending Topics Detected</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Updated daily • Sorted by relevance score</p>
          </div>
        </div>
        <button 
          onClick={handleRefresh}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-xl"
        >
          <RefreshCw size={18} className={cn(isRefreshing && "animate-spin")} />
          Refresh Trends
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trends List */}
        <div className="lg:col-span-2 space-y-4">
          {trends.map((trend, index) => (
            <motion.div
              key={trend.id}
              layout
              onClick={() => setSelectedTrend(trend)}
              className={cn(
                "p-6 rounded-[24px] border transition-all cursor-pointer relative overflow-hidden group",
                selectedTrend?.id === trend.id 
                  ? "bg-white dark:bg-slate-900 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20" 
                  : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                      {trend.name}
                      <span className="text-slate-400">{getPlatformIcon(trend.platform)}</span>
                    </h3>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">{trend.description}</p>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1">
                  <span className="text-slate-400">Relevance Score</span>
                  <span className="text-slate-900 dark:text-white">{trend.relevanceScore.toFixed(1)}/10</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${trend.relevanceScore * 10}%` }}
                    className="h-full bg-indigo-500 rounded-full"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle2 size={12} />
                    Good fit for {currentClient?.name || 'Glow Cosmetics'}
                  </div>
                  <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-800">
                    {trend.riskLevel} Risk
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trend.platform}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trend Detail Sidebar */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedTrend ? (
              <motion.div
                key={selectedTrend.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-xl sticky top-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Wand2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedTrend.name}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                      {getPlatformIcon(selectedTrend.platform)}
                      {selectedTrend.platform}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedTrend.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Suitable Industries</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Fashion', 'Beauty', 'Fitness', 'Food', 'Pet Products'].map(industry => (
                        <span key={industry} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-100 dark:border-slate-700">
                          {industry}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Action for {currentClient?.name || 'Glow Cosmetics'}</h4>
                    <button 
                      onClick={() => {
                        if (!selectedTrend) return;
                        setIsGenerating(true);
                        setIsContentModalOpen(true);
                        // Simulate AI generation
                        setTimeout(() => {
                          setContentIdea({
                            title: `Trend Campaign: ${selectedTrend.name}`,
                            caption: `Leveraging the "${selectedTrend.name}" trend to showcase our latest collection. ${selectedTrend.description} #TrendAlert #${selectedTrend.platform} #BrandGrowth`,
                            platform: selectedTrend.platform
                          });
                          setIsGenerating(false);
                        }, 1500);
                      }}
                      className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg"
                    >
                      <Zap size={18} />
                      Create Content from Trend
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
                <Target className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Select a trend to view detailed insights and actions</p>
              </div>
            )}
          </AnimatePresence>

          {/* Additional Info Widget */}
          <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">AI Trend Prediction</h3>
              <p className="text-indigo-100 text-xs leading-relaxed mb-6">
                Our AI predicts a 45% increase in engagement for "{selectedTrend?.name || 'Behind-the-Reels'}" content over the next 7 days.
              </p>
              <button 
                onClick={() => setIsAnalysisModalOpen(true)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:gap-3 transition-all"
              >
                View Predictive Analysis <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Content Modal */}
      <AnimatePresence>
        {isContentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContentModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 pb-4 text-center relative border-b border-slate-50 dark:border-slate-800">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
                  <Wand2 size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Content Generator</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Generating a high-performing post idea based on the trend.
                </p>
                <button 
                  onClick={() => setIsContentModalOpen(false)} 
                  className="absolute right-6 top-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {isGenerating ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="animate-spin text-indigo-500" size={40} />
                    <p className="text-slate-500 font-medium animate-pulse">Analyzing trend patterns...</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Campaign Title</h4>
                        <p className="text-slate-900 dark:text-white font-bold">{contentIdea.title}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Generated Caption</h4>
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{contentIdea.caption}</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-wider w-fit">
                        {getPlatformIcon(contentIdea.platform)}
                        Optimized for {contentIdea.platform}
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => setIsContentModalOpen(false)}
                        className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        Discard
                      </button>
                      <button 
                        onClick={() => {
                          if (!currentClient) {
                            toast.error('Please select a client first');
                            return;
                          }
                          const newPost: Post = {
                            id: Math.random().toString(36).substr(2, 9),
                            title: contentIdea.title,
                            caption: contentIdea.caption,
                            platform: contentIdea.platform,
                            status: 'draft',
                            clientId: currentClient.id,
                            scheduledFor: new Date(Date.now() + 86400000).toISOString() // Tomorrow
                          };
                          addPost(newPost);
                          toast.success('Content idea saved to drafts!');
                          setIsContentModalOpen(false);
                        }}
                        className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                      >
                        <Calendar size={18} />
                        Save to Drafts
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Predictive Analysis Modal */}
      <AnimatePresence>
        {isAnalysisModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAnalysisModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4 text-center relative border-b border-slate-50 dark:border-slate-800">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
                  <BarChart3 size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Predictive Trend Analysis</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Projected growth and engagement for "{selectedTrend?.name || 'the selected trend'}".
                </p>
                <button 
                  onClick={() => setIsAnalysisModalOpen(false)} 
                  className="absolute right-6 top-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analysisData}>
                      <defs>
                        <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        hide 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="engagement" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorEngagement)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Growth Index</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">+45%</span>
                      <ArrowUp size={16} className="text-emerald-500" />
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Confidence</p>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">92%</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Peak Time</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">3 Days</span>
                      <Clock size={16} className="text-amber-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Lightbulb size={20} />
                    <h3 className="font-bold uppercase tracking-widest text-xs">AI Strategic Insights</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      'Engagement is expected to peak on Day 7, specifically between 6 PM and 9 PM.',
                      'The "Behind-the-Reels" format is currently outperforming standard carousels by 3.2x.',
                      'Early adopters of this trend are seeing a 12% increase in follower conversion rate.',
                      'Recommendation: Deploy content within the next 48 hours to maximize viral potential.'
                    ].map((insight, i) => (
                      <div key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 pt-0">
                <button 
                  onClick={() => setIsAnalysisModalOpen(false)}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:opacity-90 transition-all"
                >
                  Close Analysis
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
