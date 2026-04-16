import React from 'react';
import { 
  House, 
  Users, 
  Pencil, 
  Calendar, 
  AlertTriangle 
} from 'lucide-react';
import { useAgencyStore, ViewType } from '../../store/useAgencyStore';
import { cn } from '../../lib/utils';

export function MobileNav() {
  const { activeView, setActiveView } = useAgencyStore();

  const navItems: { label: string; view: ViewType; icon: React.ElementType }[] = [
    { label: 'Overview', view: 'overview', icon: House },
    { label: 'Clients', view: 'clients', icon: Users },
    { label: 'Create', view: 'content', icon: Pencil },
    { label: 'Calendar', view: 'calendar', icon: Calendar },
    { label: 'Crisis', view: 'crisis', icon: AlertTriangle },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border safe-area-bottom transition-all duration-300">
      <div className="flex items-center justify-around h-20 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          
          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg transition-all min-w-[64px]",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

