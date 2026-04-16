import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Facebook,
  Clock,
  Calendar as CalendarIcon,
  RotateCw,
  MoreVertical,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAgencyStore, Post, Client } from '../../store/useAgencyStore';
import { cn } from '../../lib/utils';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';

const platformIcons = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
};

const platformColors = {
  instagram: 'text-pink-600 bg-pink-50',
  twitter: 'text-sky-500 bg-sky-50',
  linkedin: 'text-blue-700 bg-blue-50',
  facebook: 'text-blue-600 bg-blue-50',
};

export function Calendar() {
  const { posts, currentClient, clients, setCurrentClient } = useAgencyStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);

  const filteredPosts = posts.filter(p => 
    (!currentClient || p.clientId === currentClient.id) && p.scheduledFor
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const resetToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleClientSelect = (client: Client | null) => {
    setCurrentClient(client);
    setIsClientSelectorOpen(false);
  };

  const selectedDayPosts = filteredPosts.filter(p => isSameDay(new Date(p.scheduledFor!), selectedDate));

  // Calculate status counts for the selected client (filteredPosts already filters by client)
  const statusCounts = filteredPosts.reduce((acc, post) => {
    const status = post.status.toLowerCase();
    if (status === 'draft') acc.drafts++;
    else if (status === 'in-review') acc.inReview++;
    else if (status === 'approved') acc.approved++;
    else if (status === 'rejected') acc.rejected++;
    else if (status === 'scheduled') acc.scheduled++;
    else if (status === 'published') acc.published++;
    return acc;
  }, { drafts: 0, inReview: 0, approved: 0, rejected: 0, scheduled: 0, published: 0 });

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Content Calendar</h1>
          <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">
            {currentClient ? `Viewing posts for ${currentClient.name}` : 'Viewing all client schedules'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={resetToToday}
            title="Reset to today"
            className="p-2 lg:p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
          >
            <RotateCw size={20} className="text-slate-600 dark:text-slate-400 group-active:rotate-180 transition-transform duration-500" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsClientSelectorOpen(!isClientSelectorOpen)}
              title="Select Client"
              className={cn(
                "p-2 lg:p-2.5 bg-white dark:bg-slate-900 border rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1",
                isClientSelectorOpen 
                  ? "border-indigo-600 ring-2 ring-indigo-50 dark:ring-indigo-900/20" 
                  : "border-slate-200 dark:border-slate-800"
              )}
            >
              <CalendarIcon size={20} className={cn(isClientSelectorOpen ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400")} />
              {isClientSelectorOpen ? <ChevronUp size={14} className="text-indigo-600 dark:text-indigo-400" /> : <ChevronDown size={14} className="text-slate-400 dark:text-slate-500" />}
            </button>

            <AnimatePresence>
              {isClientSelectorOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Filter by Client</p>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                    <button
                      onClick={() => handleClientSelect(null)}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left",
                        currentClient === null 
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" 
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <span className="text-xs font-bold">All Clients</span>
                      {currentClient === null && <Check size={14} />}
                    </button>
                    {clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => handleClientSelect(client)}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left",
                          currentClient?.id === client.id 
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" 
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                            {client.logo ? (
                              <img src={client.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-400 dark:text-slate-500">
                                {client.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-bold truncate">{client.name}</span>
                        </div>
                        {currentClient?.id === client.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6 lg:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">{format(currentDate, 'MMMM yyyy')}</h2>
            <div className="flex gap-2">
              <button 
                onClick={prevMonth}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-t border-l border-slate-100 dark:border-slate-800">
            {/* Days Header */}
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={`${day}-${i}`} className="py-3 text-center text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/50 border-r border-b border-slate-100 dark:border-slate-800">
                {day}
              </div>
            ))}

            {/* Calendar Grid */}
            {calendarDays.map((day, idx) => {
              const dayPosts = filteredPosts.filter(p => isSameDay(new Date(p.scheduledFor!), day));
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);

              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center relative cursor-pointer border-r border-b border-slate-100 dark:border-slate-800 transition-all",
                    !isCurrentMonth && "text-slate-300 dark:text-slate-700 bg-slate-50/20 dark:bg-slate-800/20",
                    isToday && "ring-2 ring-inset ring-slate-900 dark:ring-white z-10",
                    isSelected && !isToday && "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
                    "hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <span className={cn(
                    "text-sm font-bold",
                    isSelected && "scale-110 transition-transform",
                    isCurrentMonth ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-700"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Post Indicators (Dots) */}
                  {dayPosts.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {dayPosts.slice(0, 3).map(post => (
                        <div 
                          key={post.id} 
                          className={cn(
                            "w-1 h-1 rounded-full",
                            post.platform === 'instagram' ? "bg-pink-500" :
                            post.platform === 'twitter' ? "bg-sky-400" :
                            post.platform === 'linkedin' ? "bg-blue-600" : "bg-blue-500"
                          )} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Posts - Mobile Friendly List */}
        <div className="space-y-6">
          {/* Status Summary Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Client Overview</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-white">{statusCounts.drafts}</p>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Drafts</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-center">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{statusCounts.inReview}</p>
                <p className="text-[9px] font-bold text-amber-400 dark:text-amber-500 uppercase tracking-widest">In Review</p>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-center">
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{statusCounts.approved}</p>
                <p className="text-[9px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-widest">Approved</p>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-center">
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{statusCounts.rejected}</p>
                <p className="text-[9px] font-bold text-rose-400 dark:text-rose-500 uppercase tracking-widest">Rejected</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-center">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{statusCounts.scheduled}</p>
                <p className="text-[9px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-widest">Scheduled</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{statusCounts.published}</p>
                <p className="text-[9px] font-bold text-emerald-400 dark:text-emerald-500 uppercase tracking-widest">Published</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
              </h3>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {selectedDayPosts.length} Posts
              </span>
            </div>

            <div className="space-y-3">
              {selectedDayPosts.length > 0 ? selectedDayPosts.map(post => {
                const Icon = platformIcons[post.platform as keyof typeof platformIcons] || CalendarIcon;
                return (
                  <div 
                    key={post.id}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={cn(
                        "p-2 rounded-lg", 
                        post.platform === 'instagram' ? "text-pink-600 bg-pink-50 dark:bg-pink-900/20" :
                        post.platform === 'twitter' ? "text-sky-500 bg-sky-50 dark:bg-sky-900/20" :
                        post.platform === 'linkedin' ? "text-blue-700 bg-blue-50 dark:bg-blue-900/20" :
                        "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      )}>
                        <Icon size={16} />
                      </div>
                      <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{post.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <Clock size={12} />
                      {format(new Date(post.scheduledFor!), 'h:mm a')}
                    </div>
                  </div>
                );
              }) : (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon size={20} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">No posts scheduled for this day.</p>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-[32px] shadow-xl text-white border dark:border-slate-800">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Platform Guide</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(platformIcons).map(([platform, Icon]) => (
                <div key={platform} className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center", 
                    platform === 'instagram' ? "text-pink-600 bg-pink-50 dark:bg-pink-900/20" :
                    platform === 'twitter' ? "text-sky-500 bg-sky-50 dark:bg-sky-900/20" :
                    platform === 'linkedin' ? "text-blue-700 bg-blue-50 dark:bg-blue-900/20" :
                    "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  )}>
                    <Icon size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-300 capitalize">{platform}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
