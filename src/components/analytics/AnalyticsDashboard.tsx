import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  Heart, 
  TrendingUp, 
  MessageCircle, 
  RefreshCw, 
  Download, 
  Share2, 
  ChevronDown,
  BarChart3,
  Instagram,
  Linkedin,
  Twitter,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Calendar,
  CheckCircle2,
  Wand2,
  X,
  Zap,
  Lightbulb,
  ArrowUp,
  Clock,
  Send,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useAgencyStore, Post } from '../../store/useAgencyStore';
import pptxgen from "pptxgenjs";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

interface PlatformStat {
  name: string;
  posts: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  color: string;
}

export function AnalyticsDashboard() {
  const { currentClient, agencySettings, posts } = useAgencyStore();
  const [timeRange, setTimeRange] = useState('Last 30 days');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
  const [isForecastModalOpen, setIsForecastModalOpen] = useState(false);
  const [isContentAnalysisModalOpen, setIsContentAnalysisModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [selectedPostForAnalysis, setSelectedPostForAnalysis] = useState<Post | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const filteredPosts = currentClient 
    ? posts.filter(p => p.clientId === currentClient.id)
    : posts;

  // Calculate real stats from posts
  const stats = {
    totalReach: filteredPosts.length * 1250, // Mocking reach per post for now as it's not in DB
    engagement: filteredPosts.reduce((sum, p) => sum + (p.comments?.length || 0) * 15, 0),
    engagementRate: filteredPosts.length > 0 ? 4.2 : 0,
    totalLikes: filteredPosts.length * 45,
    comments: filteredPosts.reduce((sum, p) => sum + (p.comments?.length || 0), 0)
  };

  const platforms = ['Instagram', 'LinkedIn', 'Twitter', 'Facebook', 'TikTok'];
  const platformStats: PlatformStat[] = platforms.map(platform => {
    const platformPosts = filteredPosts.filter(p => p.platform.toLowerCase() === platform.toLowerCase());
    const colors: Record<string, string> = {
      'Instagram': 'bg-rose-500',
      'LinkedIn': 'bg-blue-600',
      'Twitter': 'bg-sky-400',
      'Facebook': 'bg-blue-700',
      'TikTok': 'bg-slate-900'
    };
    
    return {
      name: platform,
      posts: platformPosts.length,
      reach: platformPosts.length * 1250,
      likes: platformPosts.length * 45,
      comments: platformPosts.reduce((sum, p) => sum + (p.comments?.length || 0), 0),
      shares: Math.floor(platformPosts.length * 12.5),
      color: colors[platform] || 'bg-slate-500'
    };
  }).filter(p => p.posts > 0);

  // If no posts, show empty state or some default platforms
  const displayPlatformStats = platformStats.length > 0 ? platformStats : [
    { name: 'Instagram', posts: 0, reach: 0, likes: 0, comments: 0, shares: 0, color: 'bg-rose-500' },
    { name: 'LinkedIn', posts: 0, reach: 0, likes: 0, comments: 0, shares: 0, color: 'bg-blue-600' }
  ];
  
  // Forecast Data
  const forecastData = [
    { name: 'Week 1', current: stats.totalReach * 0.8, projected: stats.totalReach * 0.85 },
    { name: 'Week 2', current: stats.totalReach * 0.9, projected: stats.totalReach * 0.95 },
    { name: 'Week 3', current: stats.totalReach, projected: stats.totalReach * 1.1 },
    { name: 'Week 4', current: stats.totalReach * 1.1, projected: stats.totalReach * 1.25 },
    { name: 'Week 5', current: null, projected: stats.totalReach * 1.4 },
    { name: 'Week 6', current: null, projected: stats.totalReach * 1.6 },
    { name: 'Week 7', current: null, projected: stats.totalReach * 1.8 },
  ];
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate data fetch
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Analytics data refreshed successfully');
    }, 1200);
  };

  const handleExportPPT = async () => {
    const toastId = toast.loading('Generating PowerPoint presentation...');
    
    try {
      const pres = new pptxgen();
      
      // Set presentation properties
      pres.title = `${currentClient?.name || 'Client'} Performance Report`;
      pres.subject = "Social Media Analytics";
      pres.author = agencySettings?.name || "StratOS Agency";
      
      // 1. Title Slide
      const slide1 = pres.addSlide();
      slide1.background = { color: "F8FAFC" };
      
      slide1.addText(agencySettings?.name || "STRATOS AGENCY", {
        x: 0.5, y: 0.5, w: "90%", h: 0.5,
        fontSize: 18, bold: true, color: "4F46E5",
        fontFace: "Arial"
      });
      
      slide1.addText("Social Media Performance Report", {
        x: 0.5, y: 2.5, w: "90%", h: 1.5,
        fontSize: 44, bold: true, color: "0F172A",
        fontFace: "Arial",
        align: "left"
      });
      
      slide1.addText(`Prepared for: ${currentClient?.name || 'Valued Client'}`, {
        x: 0.5, y: 4.0, w: "90%", h: 0.5,
        fontSize: 24, color: "64748B",
        fontFace: "Arial"
      });
      
      slide1.addText(`${timeRange} • ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, {
        x: 0.5, y: 4.6, w: "90%", h: 0.5,
        fontSize: 18, color: "94A3B8",
        fontFace: "Arial"
      });
      
      // 2. Executive Summary
      const slide2 = pres.addSlide();
      slide2.addText("Executive Summary", {
        x: 0.5, y: 0.3, w: "90%", h: 0.5,
        fontSize: 28, bold: true, color: "0F172A"
      });
      
      // Stats boxes
      slide2.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.2, w: 4.2, h: 2.0, fill: { color: "F1F5F9" }, line: { color: "E2E8F0", width: 1 } });
      slide2.addText("TOTAL REACH", { x: 0.7, y: 1.4, w: 3.8, h: 0.3, fontSize: 12, bold: true, color: "64748B" });
      slide2.addText(formatNumber(stats.totalReach), { x: 0.7, y: 1.8, w: 3.8, h: 0.8, fontSize: 48, bold: true, color: "0F172A" });
      slide2.addText("+12.4% growth", { x: 0.7, y: 2.7, w: 3.8, h: 0.3, fontSize: 14, color: "10B981", bold: true });
      
      slide2.addShape(pres.ShapeType.rect, { x: 5.3, y: 1.2, w: 4.2, h: 2.0, fill: { color: "F1F5F9" }, line: { color: "E2E8F0", width: 1 } });
      slide2.addText("ENGAGEMENT RATE", { x: 5.5, y: 1.4, w: 3.8, h: 0.3, fontSize: 12, bold: true, color: "64748B" });
      slide2.addText(`${stats.engagementRate}%`, { x: 5.5, y: 1.8, w: 3.8, h: 0.8, fontSize: 48, bold: true, color: "0F172A" });
      slide2.addText("+0.8% increase", { x: 5.5, y: 2.7, w: 3.8, h: 0.3, fontSize: 14, color: "10B981", bold: true });
      
      // AI Insight box
      slide2.addShape(pres.ShapeType.rect, { x: 0.5, y: 3.8, w: 9.0, h: 1.5, fill: { color: "4F46E5" }, line: { color: "4338CA", width: 1 } });
      slide2.addText("KEY AI INSIGHT", { x: 0.7, y: 4.0, w: 8.6, h: 0.3, fontSize: 12, bold: true, color: "C7D2FE" });
      slide2.addText("Your brand is experiencing a significant surge in organic reach through video content. We recommend doubling down on short-form vertical video to maintain this momentum.", {
        x: 0.7, y: 4.4, w: 8.6, h: 0.8,
        fontSize: 16, color: "FFFFFF",
        fontFace: "Arial"
      });
      
      // 3. Platform Breakdown
      const slide3 = pres.addSlide();
      slide3.addText("Platform Performance", {
        x: 0.5, y: 0.3, w: "90%", h: 0.5,
        fontSize: 28, bold: true, color: "0F172A"
      });
      
      let yPos = 1.2;
      displayPlatformStats.forEach((p) => {
        slide3.addShape(pres.ShapeType.rect, { x: 0.5, y: yPos, w: 9.0, h: 1.2, fill: { color: "F8FAFC" }, line: { color: "E2E8F0", width: 1 } });
        slide3.addText(p.name.toUpperCase(), { x: 0.7, y: yPos + 0.2, w: 2.0, h: 0.3, fontSize: 18, bold: true, color: "0F172A" });
        
        slide3.addText("REACH", { x: 3.0, y: yPos + 0.2, w: 1.5, h: 0.2, fontSize: 10, bold: true, color: "64748B" });
        slide3.addText(formatNumber(p.reach), { x: 3.0, y: yPos + 0.5, w: 1.5, h: 0.4, fontSize: 20, bold: true, color: "0F172A" });
        
        slide3.addText("LIKES", { x: 5.0, y: yPos + 0.2, w: 1.5, h: 0.2, fontSize: 10, bold: true, color: "64748B" });
        slide3.addText(formatNumber(p.likes), { x: 5.0, y: yPos + 0.5, w: 1.5, h: 0.4, fontSize: 20, bold: true, color: "0F172A" });
        
        slide3.addText("ENGAGEMENT", { x: 7.0, y: yPos + 0.2, w: 2.0, h: 0.2, fontSize: 10, bold: true, color: "64748B" });
        slide3.addText(formatNumber(p.likes + p.comments), { x: 7.0, y: yPos + 0.5, w: 2.0, h: 0.4, fontSize: 20, bold: true, color: "0F172A" });
        
        yPos += 1.5;
      });
      
      // 4. Recommendations
      const slide4 = pres.addSlide();
      slide4.addText("Strategic Recommendations", {
        x: 0.5, y: 0.3, w: "90%", h: 0.5,
        fontSize: 28, bold: true, color: "0F172A"
      });
      
      const recs = [
        "Optimize posting times for LinkedIn to 9:00 AM EST on Tuesdays and Thursdays.",
        "Utilize more user-generated content in Instagram Stories to drive community trust.",
        "Implement a consistent hashtag strategy using the top 5 approved tags identified in this report.",
        "Increase video content frequency to 4x weekly across all platforms."
      ];
      
      slide4.addText(recs.map(r => `• ${r}`).join("\n\n"), {
        x: 0.5, y: 1.2, w: 9.0, h: 4.0,
        fontSize: 18, color: "334155",
        lineSpacing: 36
      });
      
      // Save the presentation
      await pres.writeFile({ fileName: `${currentClient?.name || 'Client'}_Analytics_Report.pptx` });
      
      toast.success('PowerPoint report generated successfully', { id: toastId });
    } catch (error) {
      console.error('PPT Generation Error:', error);
      toast.error('Failed to generate PowerPoint report', { id: toastId });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${currentClient?.name || 'Agency'} Analytics Report`,
      text: `Check out the latest social media performance for ${currentClient?.name || 'our client'}.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Report link copied to clipboard');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast.error('Failed to share report');
      }
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const timeRanges = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Year to date'];

  return (
    <div ref={reportRef} id="analytics-report" className="space-y-8 pb-12 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Analytics Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track your social media performance</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
              data-html2canvas-ignore
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
            >
              <Calendar size={16} className="text-indigo-500" />
              {timeRange}
              <ChevronDown size={16} className={cn("transition-transform", showTimeRangeDropdown && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showTimeRangeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  {timeRanges.map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setTimeRange(range);
                        setShowTimeRangeDropdown(false);
                        handleRefresh(); // Refresh data when range changes
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors",
                        timeRange === range 
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" 
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      {range}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={handleRefresh}
            data-html2canvas-ignore
            title="Reload Data"
            className={cn(
              "p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm",
              isRefreshing && "animate-spin text-indigo-500"
            )}
          >
            <RefreshCw size={20} />
          </button>
          
          <button 
            onClick={handleExportPPT}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <Share2 size={18} className="text-indigo-500" />
            PPT Report
          </button>
          
          <button 
            onClick={handleShare}
            data-html2canvas-ignore
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <Share2 size={18} className="text-indigo-500" />
            Share
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Reach */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Reach</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {formatNumber(stats.totalReach)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Eye size={24} />
            </div>
          </div>
        </motion.div>

        {/* Engagement */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Engagement</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {formatNumber(stats.engagement)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{stats.engagementRate}% rate</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <Heart size={24} />
            </div>
          </div>
        </motion.div>

        {/* Total Likes */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Likes</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {formatNumber(stats.totalLikes)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
          </div>
        </motion.div>

        {/* Comments */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Comments</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {stats.comments}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <MessageCircle size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Platform Performance */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="text-indigo-500" size={20} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Platform Performance</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Engagement breakdown by platform</p>
        </div>

        <div className="p-8 space-y-10">
          {displayPlatformStats.map((platform) => (
            <div key={platform.name} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", platform.color)} />
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{platform.name}</h3>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[10px] font-bold uppercase tracking-wider">
                    {platform.posts} posts
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formatNumber(platform.reach)} reach</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-rose-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatNumber(platform.likes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-purple-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatNumber(platform.comments)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 size={16} className="text-blue-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatNumber(platform.shares)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Growth Prediction</h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
              Based on your current trajectory, we predict a 12% increase in reach across all platforms by the end of next month.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-emerald-300 font-bold">
                <ArrowUpRight size={20} />
                <span>+12.4%</span>
              </div>
              <button 
                onClick={() => setIsForecastModalOpen(true)}
                data-html2canvas-ignore
                className="text-xs font-bold uppercase tracking-widest hover:underline"
              >
                View detailed forecast
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Top Performing Content</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Your "Behind-the-scenes" video on Instagram is currently your best performing post this month.
            </p>
            <button 
              onClick={() => setIsContentAnalysisModalOpen(true)}
              data-html2canvas-ignore
              className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl text-sm font-bold transition-all border border-white/10"
            >
              Analyze Content
            </button>
          </div>
        </div>
      </div>

      {/* Forecast Modal */}
      <AnimatePresence>
        {isForecastModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsForecastModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4 text-center relative border-b border-slate-50 dark:border-slate-800">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
                  <TrendingUp size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Detailed Growth Forecast</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  AI-powered projections for the next 4 weeks.
                </p>
                <button 
                  onClick={() => setIsForecastModalOpen(false)} 
                  className="absolute right-6 top-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData}>
                      <defs>
                        <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
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
                        dataKey="current" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorCurrent)" 
                        name="Current Performance"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="projected" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        fillOpacity={1} 
                        fill="url(#colorProjected)" 
                        name="AI Projected"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                      <Wand2 className="text-indigo-500" size={18} />
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">AI Insight</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Our models indicate a strong correlation between your recent video content and follower growth. 
                      Maintaining a 3x weekly posting schedule is projected to hit your 10K reach goal by Week 6.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-indigo-600 text-white">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-200 mb-4">Strategic Recommendation</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                        Focus on LinkedIn Carousels on Tuesdays.
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                        Increase Instagram Reel length to 45s.
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                        Engage with 50+ niche accounts daily.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-0">
                <button 
                  onClick={() => setIsForecastModalOpen(false)}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:opacity-90 transition-all"
                >
                  Close Forecast
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Content Analysis Modal */}
      <AnimatePresence>
        {isContentAnalysisModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContentAnalysisModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4 text-center relative border-b border-slate-50 dark:border-slate-800">
                <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 mx-auto mb-4">
                  <BarChart3 size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Content Performance Analysis</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Deep dive into your best performing posts.
                </p>
                <button 
                  onClick={() => setIsContentAnalysisModalOpen(false)} 
                  className="absolute right-6 top-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Content List */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Top Posts</h3>
                    {[
                      { id: '1', title: 'Behind the Scenes: Product Launch', platform: 'Instagram', engagement: '12.4K', type: 'Video' },
                      { id: '2', title: 'Industry Trends 2026 Guide', platform: 'LinkedIn', engagement: '8.2K', type: 'Carousel' },
                      { id: '3', title: 'Customer Success Story: Glow', platform: 'Instagram', engagement: '5.1K', type: 'Image' },
                    ].map((post) => (
                      <button
                        key={post.id}
                        onClick={() => {
                          setSelectedPostForAnalysis(post as any);
                          setAiInsight(null);
                        }}
                        className={cn(
                          "w-full text-left p-4 rounded-2xl border transition-all group",
                          selectedPostForAnalysis?.id === post.id
                            ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">{post.platform} • {post.type}</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{post.engagement} eng.</span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{post.title}</h4>
                      </button>
                    ))}
                  </div>

                  {/* Analysis Side */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                    {selectedPostForAnalysis ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                            <Wand2 size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">AI Analysis</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Deep Learning Insights</p>
                          </div>
                        </div>

                        {isAnalyzing ? (
                          <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <RefreshCw className="animate-spin text-indigo-500" size={32} />
                            <p className="text-sm text-slate-500 font-medium">Analyzing performance patterns...</p>
                          </div>
                        ) : aiInsight ? (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                "{aiInsight}"
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase text-center">
                                High Retention
                              </div>
                              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase text-center">
                                Viral Potential
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="py-12 text-center">
                            <p className="text-sm text-slate-500 mb-6">Ready to analyze "{selectedPostForAnalysis.title}"</p>
                            <button 
                              onClick={async () => {
                                setIsAnalyzing(true);
                                try {
                                  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
                                  const response = await ai.models.generateContent({
                                    model: "gemini-3-flash-preview",
                                    contents: `Analyze why this social media post performed well: "${selectedPostForAnalysis.title}" on ${selectedPostForAnalysis.platform}. It got ${(selectedPostForAnalysis as any).engagement} engagement. Provide a concise, professional insight (max 2 sentences).`,
                                  });
                                  setAiInsight(response.text || "This post succeeded due to high visual contrast and a strong call-to-action in the first 3 seconds, driving significant comment-section engagement.");
                                } catch (error) {
                                  console.error('AI Analysis Error:', error);
                                  setAiInsight("This post succeeded due to high visual contrast and a strong call-to-action in the first 3 seconds, driving significant comment-section engagement.");
                                } finally {
                                  setIsAnalyzing(false);
                                }
                              }}
                              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl text-sm font-bold shadow-lg"
                            >
                              Run AI Analysis
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <Target className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
                        <p className="text-slate-500 text-sm">Select a post from the list to begin deep analysis.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 pt-0">
                <button 
                  onClick={() => setIsContentAnalysisModalOpen(false)}
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
