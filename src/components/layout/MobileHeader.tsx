import React, { useState } from 'react';
import { Menu, Shield, Settings, LogOut, Moon, Sun, User, Bell, AlertTriangle, FileText, Users, CheckCircle2 } from 'lucide-react';
import { useAgencyStore, Notification } from '../../store/useAgencyStore';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../ui/sheet';
import { Sidebar } from './Sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const { 
    theme, 
    setTheme, 
    setActiveView, 
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

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 z-50 bg-background border-b border-border flex items-center justify-between px-4 transition-all duration-300">
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger 
            render={
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            }
          />
          <SheetContent side="left" className="p-0 w-72">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <Sidebar isMobile onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <span className="font-bold text-lg tracking-tight">StratOS</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
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
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-background"></span>
                )}
              </Button>
            }
          />
          <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-80 p-0" align="end">
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
                  markAllNotificationsAsRead();
                }}
                title="Mark all as read"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id}
                    className={cn(
                      "p-4 focus:bg-muted cursor-pointer transition-colors",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => {
                      markNotificationAsRead(notification.id);
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
              {profile?.role === 'admin' && (
                <DropdownMenuItem onClick={() => setActiveView('developer-settings')}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Developer Settings</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-rose-500 focus:text-rose-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
