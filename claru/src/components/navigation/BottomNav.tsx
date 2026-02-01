'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, FileText, Target, FolderKanban } from 'lucide-react';

/**
 * Navigation item configuration.
 */
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/challenges', label: 'Challenges', icon: Target },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
];

/**
 * Checks if a path is active for a nav item.
 * Matches exact path or any sub-path (e.g., /challenges matches /challenges/123).
 */
function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * BottomNav - F002 App Shell
 *
 * Fixed bottom navigation for mobile-first app design.
 * Shows 4 main sections: Chat, Notes, Challenges, Projects.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = isActivePath(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center w-full h-full px-2 py-1 transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
