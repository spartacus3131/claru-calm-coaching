import { ArrowDown, Brain, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  onStart: () => void;
}

export function HeroSection({ onStart }: HeroSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-accent" />
          </div>
          <span className="font-semibold text-foreground">Claru</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/auth')}
          className="text-muted-foreground"
        >
          Sign in
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-xl mx-auto">
        {/* Greeting */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-base font-medium mb-6">
            <Mic className="w-4 h-4" />
            Voice-first productivity coach
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Hey, I'm Claru.
          </h1>
        </div>

        {/* The Hook */}
        <div className="space-y-4 text-lg text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <p>
            Do you feel <span className="text-accent font-medium">overwhelmed</span> by what you have to get done and uncertain of how to do it?
          </p>
          <p>
            Do you want to feel more <span className="text-accent font-medium">fulfilled</span> in your daily life and more <span className="text-accent font-medium">productive</span>?
          </p>
        </div>

        {/* The Promise */}
        <p className="text-xl text-foreground font-medium mb-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          I'm here to help.
        </p>

        {/* CTA */}
        <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button
            size="lg"
            variant="calm"
            onClick={onStart}
            className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Let's start
          </Button>
        </div>

        {/* Scroll indicator */}
        <div className="mt-12 animate-bounce text-muted-foreground">
          <ArrowDown className="w-5 h-5" />
        </div>
      </main>

      {/* Footer hint */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        Free to try • No credit card required
      </footer>
    </div>
  );
}
