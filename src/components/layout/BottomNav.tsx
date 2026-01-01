import { MessageCircle, Trophy, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'challenges', label: 'Challenges', icon: Trophy },
  { id: 'reflections', label: 'Reflections', icon: BookOpen },
  { id: 'insights', label: 'Insights', icon: Sparkles },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="nav"
            data-active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'min-w-[64px]',
              activeTab === tab.id && 'text-primary'
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[11px] font-medium">{tab.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
