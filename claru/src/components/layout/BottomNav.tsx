'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Sparkles, Inbox, Gauge, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'chat', label: 'Chat', icon: MessageCircle, href: '/chat' },
  { id: 'impact', label: 'Impact', icon: Sparkles, href: '/impact' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, href: '/projects' },
  { id: 'parking', label: 'Parking Lot', icon: Inbox, href: '/parking' },
  { id: 'hotspots', label: 'Hot Spots', icon: Gauge, href: '/hotspots' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass border-t border-border/50 pb-safe shrink-0">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-1 px-2 py-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Button
              key={tab.id}
              variant="nav"
              data-active={isActive}
              aria-current={isActive ? 'page' : undefined}
              asChild
              className={cn('flex-1')}
            >
              <Link href={tab.href}>
                <tab.icon className={cn('w-5 h-5', isActive && 'stroke-[2]')} />
                <span className="font-medium leading-none truncate">{tab.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
