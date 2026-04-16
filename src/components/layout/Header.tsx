import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, Globe, Menu, Shield, Moon, Sun, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAgencyStore } from '../../store/useAgencyStore';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export function Header() {
  const { currentClient, toggleSidebar, sidebarOpen, theme, setTheme, setActiveView } = useAgencyStore();
  const { logout, profile } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className={cn(
      "h-16 border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-all duration-300",
      theme === 'dark' 
        ? "bg-slate-900/80 border-slate-800 text-white backdrop-blur-md" 
        : "bg-white/80 border-slate-200 text-slate-900 backdrop-blur-md"
    )}>
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleSidebar}
          className={cn(
            "p-2.5 rounded-xl transition-colors lg:hidden",
            theme === 'dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"
          )}
        >
          <Menu size={20} />
        </button>
        
        <div className="relative hidden md:block group" ref={searchRef}>
          <motion.div
            initial={false}
            animate={{ width: isSearchExpanded ? 384 : 44 }}
            className={cn(
              "relative h-11 rounded-2xl overflow-hidden transition-all duration-300",
              theme === 'dark' 
                ? "bg-slate-800/50 hover:bg-slate-800" 
                : "bg-slate-100/50 hover:bg-slate-100"
            )}
          >
            <button
              onClick={() => setIsSearchExpanded(true)}
              className={cn(
                "absolute left-0 top-0 w-11 h-11 flex items-center justify-center transition-colors z-10",
                theme === 'dark' ? "text-slate-500 group-focus-within:text-indigo-400" : "text-slate-400 group-focus-within:text-indigo-600"
              )}
            >
              <Search size={18} />
            </button>
            <input 
              type="text" 
              placeholder="Search StratOS..."
              onFocus={() => setIsSearchExpanded(true)}
              className={cn(
                "w-full h-full border-transparent pl-12 pr-4 py-2 text-sm transition-all outline-none bg-transparent",
                theme === 'dark' ? "text-white" : "text-slate-900",
                !isSearchExpanded && "opacity-0 cursor-default"
              )}
            />
          </motion.div>
        </div>

        <div className="flex md:hidden items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Shield size={20} fill="currentColor" fillOpacity={0.2} />
          </div>
          <span className={cn(
            "font-bold text-lg tracking-tight",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>StratOS</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {currentClient && (
          <div className={cn(
            "hidden sm:flex items-center gap-3 pl-4 border-l",
            theme === 'dark' ? "border-slate-800" : "border-slate-200"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-lg overflow-hidden border shadow-sm",
              theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"
            )}>
              {currentClient.logo ? (
                <img src={currentClient.logo} alt={currentClient.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-indigo-600">
                  {currentClient.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <p className={cn(
                "text-xs font-bold leading-none",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>{currentClient.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest font-bold">Active Client</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className={cn(
              "p-2.5 rounded-xl transition-colors",
              theme === 'dark' ? "hover:bg-slate-800 text-amber-400" : "hover:bg-slate-100 text-slate-600"
            )}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button className={cn(
            "relative p-2.5 rounded-xl transition-colors",
            theme === 'dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"
          )}>
            <Bell size={20} />
            <span className={cn(
              "absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2",
              theme === 'dark' ? "border-slate-900" : "border-white"
            )}></span>
          </button>
          
          <div className={cn(
            "relative flex items-center gap-3 pl-3 border-l",
            theme === 'dark' ? "border-slate-800" : "border-slate-200"
          )} ref={menuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 group"
            >
              <div className="text-right hidden xl:block">
                <p className={cn(
                  "text-xs font-bold leading-none",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>{profile?.displayName || 'User'}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest font-bold capitalize">{profile?.role || 'Member'}</p>
              </div>
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg ring-2 transition-all",
                theme === 'dark' 
                  ? "bg-indigo-600 text-white shadow-indigo-900/20 ring-slate-900 group-hover:ring-indigo-500/50" 
                  : "bg-slate-900 text-white shadow-slate-200 ring-white group-hover:ring-slate-200"
              )}>
                {profile?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <ChevronDown size={14} className={cn(
                "text-slate-400 transition-transform duration-200",
                showUserMenu && "rotate-180"
              )} />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={cn(
                    "absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-2xl border overflow-hidden",
                    theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                  )}
                >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <p className={cn("text-sm font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>
                      {profile?.displayName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => {
                        setActiveView('profile-settings');
                        setShowUserMenu(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors",
                        theme === 'dark' ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <User size={18} />
                      Profile Settings
                    </button>
                    <button 
                      onClick={() => {
                        setActiveView('agency-config');
                        setShowUserMenu(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors",
                        theme === 'dark' ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Settings size={18} />
                      Agency Config
                    </button>
                  </div>
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => logout()}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
