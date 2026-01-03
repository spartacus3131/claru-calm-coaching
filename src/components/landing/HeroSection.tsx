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
        {/* H1 - The Question */}
        <section className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            In a world of constant distractions, how do you focus on what actually matters?
          </h1>
          <p className="text-lg text-muted-foreground">
            Your AI coach for calm productivity. A few minutes each morning. Total clarity.
          </p>
        </section>

        {/* The Journey - Visual */}
        <section className="mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Clarity</h4>
              <p className="text-sm text-muted-foreground">Know what matters</p>
            </div>
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-5 h-5 text-accent" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Systems</h4>
              <p className="text-sm text-muted-foreground">Build your infrastructure</p>
            </div>
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Capacity</h4>
              <p className="text-sm text-muted-foreground">Protect your energy</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
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

        {/* Supporting Copy */}
        <section className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-muted-foreground mb-8">
            Every app and notification is competing for your attention. You don't need another task manager. You need a way to cut through the noise.
          </p>
          <div className="bg-card/30 border border-border/50 rounded-xl p-6 inline-block">
            <p className="text-lg font-medium text-foreground mb-2">
              Two check-ins a day. A three-part journey. 22 foundations.
            </p>
            <p className="text-sm text-muted-foreground">
              15 minutes a day is all it takes.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
