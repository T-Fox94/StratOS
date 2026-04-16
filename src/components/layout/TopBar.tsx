import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Moon, Sun, X, User, FileText, Users, AlertTriangle, Settings, LogOut, CheckCircle2 } from 'lucide-react';
import { useAgencyStore, Notification } from '../../store/useAgencyStore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function TopBar() {
  const { 
    theme, 
    setTheme, 
    activeView, 
    setActiveView, 
    clients, 
    posts, 
    crisisEvents, 
    setCurrentClient,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useAgencyStore();
  const { profile, logout } = useAuth();
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'crisis': return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'content': return <FileText className="h-5 w-5 text-indigo-600" />;
      case 'team': return <Users className="h-5 w-5 text-emerald-600" />;
      default: return <Bell className="h-5 w-5 text-slate-600" />;
    }
  };

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'crisis': return 'bg-amber-100 dark:bg-amber-900/30';
      case 'content': return 'bg-indigo-100 dark:bg-indigo-900/30';
      case 'team': return 'bg-emerald-100 dark:bg-emerald-900/30';
      default: return 'bg-slate-100 dark:bg-slate-900/30';
    }
  };
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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const viewTitles: Record<string, string> = {
    overview: 'Agency Overview',
    clients: 'Client Management',
    accounts: 'Social Accounts',
    calendar: 'Content Calendar',
    content: 'Content Creation',
    scope: 'Scope Guardian',
    crisis: 'Crisis Management',
    trends: 'Trend Watcher',
    automation: 'Automation Center',
    analytics: 'Analytics Dashboard',
    webhooks: 'Webhooks & API',
    monitoring: 'System Monitoring',
    notifications: 'Notification Center',
    'profile-settings': 'Profile Settings',
    'agency-config': 'Agency Configuration',
  };

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleSearchClick = () => {
    setIsSearchExpanded(true);
  };

  const handleCloseSearch = () => {
    setIsSearchExpanded(false);
    setSearchQuery('');
  };

  const handleResultClick = (result: any) => {
    if (result.type === 'client') {
      setCurrentClient(result.original);
      setActiveView('overview');
    } else if (result.type === 'post') {
      const client = clients.find(c => c.id === result.original.clientId);
      if (client) setCurrentClient(client);
      setActiveView('calendar');
    } else if (result.type === 'crisis') {
      const client = clients.find(c => c.id === result.original.clientId);
      if (client) setCurrentClient(client);
      setActiveView('crisis');
    }
    handleCloseSearch();
  };

  // Mock search results logic
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    
    const results = [
      ...clients.filter(c => c.name.toLowerCase().includes(query)).map(c => ({ type: 'client', title: c.name, sub: c.industry, icon: Users, original: c })),
      ...posts.filter(p => p.title.toLowerCase().includes(query)).map(p => ({ type: 'post', title: p.title, sub: p.platform, icon: FileText, original: p })),
      ...crisisEvents.filter(c => c.title.toLowerCase().includes(query)).map(c => ({ type: 'crisis', title: c.title, sub: c.severity, icon: AlertTriangle, original: c })),
    ];
    
    return results.slice(0, 5);
  };

  const searchResults = getSearchResults();

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-8 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <AnimatePresence mode="wait">
          {!isSearchExpanded && (
            <motion.h2 
              key="title"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-lg font-bold tracking-tight text-foreground"
            >
              {viewTitles[activeView] || 'StratOS'}
            </motion.h2>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-end flex-1 gap-4">
        {/* Search Section */}
        <div className="relative flex items-center justify-end">
          <motion.div
            initial={false}
            animate={{ 
              width: isSearchExpanded ? '400px' : '40px',
              backgroundColor: isSearchExpanded ? 'var(--background)' : 'transparent'
            }}
            className={cn(
              "relative flex items-center h-10 rounded-xl transition-all duration-300 overflow-hidden",
              isSearchExpanded ? "border border-primary shadow-lg ring-2 ring-primary/10" : "hover:bg-muted"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 shrink-0 rounded-none",
                isSearchExpanded ? "text-primary" : "text-muted-foreground"
              )}
              onClick={handleSearchClick}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients, posts, or crises..."
              className={cn(
                "w-full bg-transparent outline-none text-sm pr-10 transition-opacity",
                isSearchExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            />

            {isSearchExpanded && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                onClick={handleCloseSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </motion.div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {isSearchExpanded && searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-12 right-0 w-[400px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">
                    Search Results
                  </p>
                  <div className="space-y-1">
                    {searchResults.length > 0 ? (
                      searchResults.map((result, i) => {
                        const Icon = result.icon;
                        return (
                          <button
                            key={i}
                            onClick={() => handleResultClick(result)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-background transition-colors">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{result.title}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{result.sub}</p>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-sm text-muted-foreground italic">No results found for "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                </div>
                {searchResults.length > 0 && (
                  <div className="p-2 bg-muted/50 border-t border-border">
                    <button className="w-full py-2 text-xs font-bold text-primary hover:underline">
                      View all results
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger 
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg relative"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-card"></span>
                  )}
                </Button>
              }
            />
            <DropdownMenuContent className="w-80 p-0" align="end">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    handleMarkAllAsRead();
                  }}
                  title="Mark all as read"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id}
                      className={cn(
                        "p-4 focus:bg-muted cursor-pointer transition-colors",
                        !notification.read && "bg-primary/5"
                      )}
                      onClick={() => {
                        handleMarkAsRead(notification.id);
                        setActiveView('notifications');
                      }}
                    >
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          getBgColor(notification.type)
                        )}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold leading-none">{notification.title}</p>
                            {!notification.read && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{notification.message}</p>
                          <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{notification.time}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No notifications
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <DropdownMenuItem 
                  className="w-full text-xs font-bold uppercase tracking-widest h-10 justify-center cursor-pointer"
                  onClick={() => setActiveView('notifications')}
                >
                  View All Notifications
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="h-8 w-px bg-border mx-1" />
          
          <DropdownMenu>
            <DropdownMenuTrigger 
              render={
                <button className="p-1 rounded-full hover:bg-muted transition-colors outline-none">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={profile?.email ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}` : undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {profile?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              }
            />
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.displayName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setActiveView('profile-settings')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveView('agency-config')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-rose-500 focus:text-rose-500">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
