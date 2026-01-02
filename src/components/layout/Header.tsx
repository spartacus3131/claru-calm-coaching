import { User, LogOut, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  showBackToHome?: boolean;
}

export function Header({ showBackToHome }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-4 py-3 glass border-b border-border/50">
      <div className="flex items-center gap-2">
        {showBackToHome && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="text-accent hover:text-accent/80 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <h1 
          className="text-xl font-semibold text-foreground tracking-tight cursor-pointer"
          onClick={() => showBackToHome ? navigate('/') : null}
        >
          Claru
        </h1>
      </div>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/auth')}
          className="text-muted-foreground"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Sign in
        </Button>
      )}
    </header>
  );
}
