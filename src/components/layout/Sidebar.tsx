import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Link2, 
  Calendar, 
  PenTool, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  BarChart3, 
  Webhook, 
  Activity,
  ChevronLeft,
  ChevronRight,
  Shield,
  Wand2,
  ChevronsUpDown,
  LogOut,
  Settings,
  X
} from 'lucide-react';
import { useAgencyStore, ViewType, Client } from '../../store/useAgencyStore';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
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

export const navItems: { id: ViewType; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'accounts', label: 'Social Accounts', icon: Link2 },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'content', label: 'Create Content', icon: PenTool },
  { id: 'scope', label: 'Scope Guardian', icon: FileText },
  { id: 'crisis', label: 'Crisis Mgmt', icon: AlertTriangle },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'creative-lab', label: 'Creative Lab', icon: Wand2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
];

interface SidebarProps {
  onNavigate?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ onNavigate, isMobile = false }: SidebarProps) {
  const { 
    activeView, 
    setActiveView, 
    sidebarOpen, 
    toggleSidebar, 
    currentClient,
    setCurrentClient,
    clients,
    clearClientContext
  } = useAgencyStore();
  const { profile, logout } = useAuth();

  const isCollapsed = !sidebarOpen && !isMobile;

  const handleNavigate = (view: ViewType) => {
    setActiveView(view);
    if (onNavigate) onNavigate();
  };

  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-card transition-all duration-300",
        isMobile ? "w-full" : cn(sidebarOpen ? "w-64" : "w-16", "fixed left-0 top-0 z-40 border-r border-border hidden md:flex")
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center h-14 px-4 shrink-0",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          {(!isCollapsed || isMobile) && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg tracking-tight whitespace-nowrap"
            >
              StratOS
            </motion.span>
          )}
        </div>
        
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <Separator />

      {/* Client Context */}
      <div className="p-3 space-y-2">
        <div className={cn("space-y-2", isCollapsed && !isMobile && "flex flex-col items-center")}>
          {(!isCollapsed || isMobile) && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Active Client</p>
          )}
          {currentClient ? (
            profile?.role === 'client' ? (
              <div className={cn(
                "flex items-center gap-3 p-1 rounded-lg w-full text-left",
                isCollapsed && !isMobile && "justify-center"
              )}>
                <Avatar className={cn(
                  "h-8 w-8 border-2 shrink-0",
                  currentClient.primaryColor ? `border-[${currentClient.primaryColor}]` : "border-primary"
                )}>
                  <AvatarImage src={currentClient.logo} alt={currentClient.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                    {currentClient.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {(!isCollapsed || isMobile) && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{currentClient.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{currentClient.industry}</p>
                  </div>
                )}
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger 
                  render={
                    <button className={cn(
                      "flex items-center gap-3 group p-1 rounded-lg transition-colors cursor-pointer w-full text-left",
                      !isCollapsed || isMobile ? "hover:bg-muted/50" : ""
                    )}>
                      <Avatar className={cn(
                        "h-8 w-8 border-2 transition-colors shrink-0",
                        currentClient.primaryColor ? `border-[${currentClient.primaryColor}]` : "border-primary"
                      )}>
                        <AvatarImage src={currentClient.logo} alt={currentClient.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                          {currentClient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {(!isCollapsed || isMobile) && (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{currentClient.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{currentClient.industry}</p>
                          </div>
                          <ChevronsUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
                        </>
                      )}
                    </button>
                  }
                />
                <DropdownMenuContent className="w-56" align={isCollapsed && !isMobile ? "center" : "end"} side={isCollapsed && !isMobile ? "right" : "bottom"}>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Switch Client</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-[200px]">
                      {clients.map((client) => (
                        <DropdownMenuItem 
                          key={client.id}
                          onClick={() => setCurrentClient(client)}
                          className={cn(
                            "flex items-center gap-2 cursor-pointer",
                            currentClient.id === client.id && "bg-muted font-bold"
                          )}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={client.logo} />
                            <AvatarFallback className="text-[8px]">{client.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{client.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </ScrollArea>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={clearClientContext}
                    className="text-rose-500 focus:text-rose-500 cursor-pointer"
                  >
                    <X className="mr-2 h-4 w-4" />
                    <span>Clear Selection</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger 
                render={
                  <button className={cn(
                    "flex items-center gap-3 text-muted-foreground italic p-1 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors w-full text-left",
                    isCollapsed && !isMobile && "justify-center"
                  )}>
                    <Shield className="h-5 w-5 opacity-50 shrink-0" />
                    {(!isCollapsed || isMobile) && (
                      <>
                        <span className="text-xs flex-1">No client</span>
                        <ChevronsUpDown className="h-3 w-3 opacity-30" />
                      </>
                    )}
                  </button>
                }
              />
              <DropdownMenuContent className="w-56" align={isCollapsed && !isMobile ? "center" : "end"} side={isCollapsed && !isMobile ? "right" : "bottom"}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Select Client</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-[200px]">
                    {clients.map((client) => (
                      <DropdownMenuItem 
                        key={client.id}
                        onClick={() => setCurrentClient(client)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={client.logo} />
                          <AvatarFallback className="text-[8px]">{client.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{client.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-3 py-2 rounded-lg transition-all group",
                  isActive 
                    ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isCollapsed && !isMobile && "justify-center px-0"
                )}
                onClick={() => handleNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {(!isCollapsed || isMobile) && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="mt-auto border-t border-border">
        {/* Settings & Logout (Always visible) */}
        <div className="p-2 space-y-1">
          {profile?.role === 'admin' && (
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 px-3 py-2 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all",
                isCollapsed && !isMobile && "justify-center px-0"
              )}
              onClick={() => handleNavigate('developer-settings')}
              title={isCollapsed ? "Developer Settings" : undefined}
            >
              <Shield className="h-5 w-5 shrink-0" />
              {(!isCollapsed || isMobile) && (
                <span className="text-sm font-medium">Developer Settings</span>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all",
              isCollapsed && !isMobile && "justify-center px-0"
            )}
            onClick={logout}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {(!isCollapsed || isMobile) && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </Button>
        </div>

        <Separator />

        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Activity className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest">StratOS v1.0.4</span>
              <span className="text-[9px] opacity-70 italic">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

