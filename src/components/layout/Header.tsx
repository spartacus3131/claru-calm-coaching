import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3 glass border-b border-border/50">
      <h1 className="text-xl font-semibold text-foreground tracking-tight">Claru</h1>
      <Button variant="ghost" size="icon" className="text-muted-foreground">
        <User className="w-5 h-5" />
      </Button>
    </header>
  );
}
