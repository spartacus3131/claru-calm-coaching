import { Brain, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  onStart: () => void;
}

export function HeroSection({ onStart }: HeroSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background via-background to-accent/5">
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

      {/* Hero Section */}
      <main className="px-6 py-12 max-w-2xl mx-auto">
        {/* H1 - The Hook */}
        <section className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            Overwhelmed? Scattered? Struggling to focus?
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            In a world of endless distractions, your brain doesn't stand a chance - unless you have a system.
          </p>

          {/* Primary CTA */}
          <Button
            size="lg"
            variant="calm"
            onClick={onStart}
            className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Start your first check-in
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Free to try • No credit card required
          </p>
        </section>

        {/* The Brain Truth */}
        <section className="text-center mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <p className="text-lg text-foreground/80">
            Your brain wasn't designed to hold your to-do list. It was designed to solve problems and be creative. Let's get everything out of your head.
          </p>
        </section>

        {/* The Journey - Problem → Solution */}
        <section className="mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground italic mb-2">Too much in your head?</p>
              <h4 className="font-semibold text-foreground mb-2">Clarity</h4>
              <p className="text-sm text-muted-foreground">Daily check-ins to empty your mind and organize your thoughts</p>
            </div>
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground italic mb-2">Can't seem to follow through?</p>
              <h4 className="font-semibold text-foreground mb-2">Systems</h4>
              <p className="text-sm text-muted-foreground">22 research-backed foundations to build habits that stick</p>
            </div>
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground italic mb-2">Low energy? Brain fog?</p>
              <h4 className="font-semibold text-foreground mb-2">Capacity</h4>
              <p className="text-sm text-muted-foreground">Science-backed practices to protect your focus</p>
            </div>
          </div>
        </section>

        {/* The Promise */}
        <section className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="bg-card/30 border border-border/50 rounded-xl p-6 inline-block">
            <p className="text-lg font-medium text-foreground mb-2">
              Two check-ins a day. 15 minutes total.
            </p>
            <p className="text-muted-foreground">
              A three-part journey to unlock real productivity.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
