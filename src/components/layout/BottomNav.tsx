import { MessageCircle, Sparkles, Inbox, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'impact', label: 'Impact', icon: Sparkles },
  { id: 'parking', label: 'Parking Lot', icon: Inbox },
  { id: 'hotspots', label: 'Hot Spots', icon: Gauge },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="glass border-t border-border/50 pb-safe shrink-0">
      <div className="flex items-center justify-around px-1 py-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="nav"
            data-active={activeTab === tab.id}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'min-w-[68px] px-2'
            )}
          >
            <tab.icon className={cn('w-6 h-6', activeTab === tab.id && 'stroke-[2.5]')} />
            <span className="text-xs font-medium">{tab.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
