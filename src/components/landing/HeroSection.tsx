import { ArrowDown, Brain, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  onStart: () => void;
}

export function HeroSection({ onStart }: HeroSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
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
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-2xl mx-auto">
        {/* Greeting */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Mic className="w-4 h-4" />
            Voice-first productivity coach
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Hey, I'm Claru.
          </h1>
        </div>

        {/* The Problem */}
        <div className="space-y-4 text-lg text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <p>
            Here's something I've noticed: most people feel like they're <span className="text-foreground font-medium">constantly behind</span>.
          </p>
          <p>
            Too many tabs open. Too many things pulling at your attention. And at the end of the day, you're not even sure what you actually accomplished.
          </p>
        </div>

        {/* The Solution */}
        <div className="space-y-4 text-lg mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-foreground font-medium">
            It doesn't have to be that way.
          </p>
          <p className="text-muted-foreground">
            Every morning, we spend a few minutes getting clear on what actually matters. Every evening, we close the loop.
          </p>
          <p className="text-muted-foreground">
            And over time, I'll walk you through <span className="text-foreground font-medium">22 practices</span> backed by decades of research on how humans actually focus, build habits, and get meaningful work done.
          </p>
        </div>

        {/* The Vibe */}
        <p className="text-sm text-muted-foreground mb-10 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          No hacks. No hustle culture. Just the stuff that works.
        </p>

        {/* CTA */}
        <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <Button
            size="lg"
            variant="calm"
            onClick={onStart}
            className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Ready to start?
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
