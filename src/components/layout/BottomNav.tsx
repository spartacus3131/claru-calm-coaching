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
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around px-1 py-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="nav"
            data-active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'min-w-[56px] px-2',
              activeTab === tab.id && 'text-primary'
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
