import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ChatScreen } from '@/screens/ChatScreen';
import { ImpactScreen } from '@/screens/ImpactScreen';
import { ParkingLotScreen } from '@/screens/ParkingLotScreen';
import { HotSpotsScreen } from '@/screens/HotSpotsScreen';
import { HeroSection } from '@/components/landing/HeroSection';
import { useAuth } from '@/hooks/useAuth';
import { Challenge } from '@/types/claru';

const Index = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [pendingAutoMessage, setPendingAutoMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is not logged in, show the landing page
  if (!user) {
    return <HeroSection onStart={() => navigate('/try')} />;
  }

  const handleHotSpotsCheckin = (summary: string) => {
    setPendingAutoMessage(summary);
    setActiveTab('chat');
  };

  const handleStartFoundation = (foundation: Challenge) => {
    const message = `I want to start Foundation ${foundation.id}: ${foundation.title}`;
    setPendingAutoMessage(message);
    setActiveTab('chat');
  };

  // Logged in users go straight to the app
  const renderScreen = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatScreen autoMessage={pendingAutoMessage} onAutoMessageSent={() => setPendingAutoMessage(null)} />;
      case 'impact':
        return <ImpactScreen onStartFoundation={handleStartFoundation} />;
      case 'parking':
        return <ParkingLotScreen />;
      case 'hotspots':
        return <HotSpotsScreen onCheckinComplete={handleHotSpotsCheckin} />;
      default:
        return <ChatScreen />;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderScreen()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
