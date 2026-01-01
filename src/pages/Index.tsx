import { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ChatScreen } from '@/screens/ChatScreen';
import { ChallengesScreen } from '@/screens/ChallengesScreen';
import { InsightsScreen } from '@/screens/InsightsScreen';
import { HotSpotsScreen } from '@/screens/HotSpotsScreen';
import { ParkingLot } from '@/components/ParkingLot';
import { HeroSection } from '@/components/landing/HeroSection';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [hasStarted, setHasStarted] = useState(false);
  const { user } = useAuth();
  const appRef = useRef<HTMLDivElement>(null);

  // If user is logged in, skip hero and go straight to app
  const showHero = !user && !hasStarted;

  const handleStart = () => {
    setHasStarted(true);
    // Smooth scroll to app
    setTimeout(() => {
      appRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatScreen />;
      case 'challenges':
        return <ChallengesScreen />;
      case 'hotspots':
        return <HotSpotsScreen />;
      case 'insights':
        return <InsightsScreen />;
      default:
        return <ChatScreen />;
    }
  };

  if (showHero) {
    return <HeroSection onStart={handleStart} />;
  }

  return (
    <div ref={appRef} className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden pb-20">
        {renderScreen()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <ParkingLot />
    </div>
  );
};

export default Index;
