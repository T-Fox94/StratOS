import React from 'react';
import { 
  Bell, 
  AlertTriangle, 
  FileText, 
  Users, 
  CheckCircle2, 
  Clock, 
  Trash2,
  Filter,
  Search,
  MoreHorizontal,
  Settings,
  ChevronLeft,
  Calendar,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { useAgencyStore, Notification } from '../../store/useAgencyStore';
import { db } from '../../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

export function NotificationCenter() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } = useAgencyStore();
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');
  const [search, setSearch] = React.useState('');
  const [selectedNotification, setSelectedNotification] = React.useState<Notification | null>(null);

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
      markNotificationAsRead(id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      const promises = unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }));
      await Promise.all(promises);
      markAllNotificationsAsRead();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      deleteNotification(id);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.read) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'crisis': return <AlertTriangle className="text-rose-500" />;
      case 'content': return <FileText className="text-indigo-500" />;
      case 'team': return <Users className="text-emerald-500" />;
      case 'system': return <Clock className="text-amber-500" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <AnimatePresence mode="wait">
        {selectedNotification ? (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setSelectedNotification(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              Back to all notifications
            </button>

            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-8 sm:p-12">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                      {getIcon(selectedNotification.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          getPriorityColor(selectedNotification.priority)
                        )}>
                          {selectedNotification.priority} Priority
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{selectedNotification.time}</span>
                      </div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                        {selectedNotification.title}
                      </h1>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-xl hover:text-rose-600"
                      onClick={() => {
                        handleDelete(selectedNotification.id);
                        setSelectedNotification(null);
                      }}
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedNotification.message}
                  </p>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-50 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Received</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedNotification.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">{selectedNotification.type}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-end gap-4">
                  <Button variant="outline" className="rounded-2xl px-8 py-6 h-auto font-bold" onClick={() => setSelectedNotification(null)}>
                    Dismiss
                  </Button>
                  <Button className="rounded-2xl px-8 py-6 h-auto font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none">
                    Take Action
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                  Notification Center
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">Stay updated with your agency's latest activities</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  className="rounded-xl font-bold"
                  onClick={handleMarkAllAsRead}
                >
                  Mark all as read
                </Button>
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <Settings size={20} />
                </Button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                  <button 
                    onClick={() => setFilter('all')}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                      filter === 'all' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500"
                    )}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilter('unread')}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                      filter === 'unread' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500"
                    )}
                  >
                    Unread
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search notifications..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredNotifications.length > 0 ? filteredNotifications.map((notification) => (
                  <motion.div 
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors flex gap-4 group cursor-pointer",
                      !notification.read && "bg-indigo-50/30 dark:bg-indigo-900/5"
                    )}
                    onClick={() => {
                      handleMarkAsRead(notification.id);
                      setSelectedNotification(notification);
                    }}
                  >
                    <div className="shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-sm">
                        {getIcon(notification.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">{notification.title}</h3>
                          {!notification.read && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{notification.time}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          getPriorityColor(notification.priority)
                        )}>
                          {notification.priority}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                          View Details
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                )) : (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bell size={32} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No notifications found</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">You're all caught up!</p>
                  </div>
                )}
              </div>

              {filteredNotifications.length > 0 && (
                <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-50 dark:border-slate-800 text-center">
                  <button className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                    Load more notifications
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
