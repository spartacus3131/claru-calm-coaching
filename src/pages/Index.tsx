import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { AppFrame } from '@/components/layout/AppFrame';
import { BottomNav } from '@/components/layout/BottomNav';
import { ChatScreen } from '@/screens/ChatScreen';
import { ImpactScreen } from '@/screens/ImpactScreen';
import { ParkingLotScreen } from '@/screens/ParkingLotScreen';
import { HotSpotsScreen } from '@/screens/HotSpotsScreen';
import { HeroSection } from '@/components/landing/HeroSection';
import { useAuth } from '@/hooks/useAuth';
import { Challenge, Foundation } from '@/types/claru';

const Index = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [pendingAutoMessage, setPendingAutoMessage] = useState<string | null>(null);
  const [pendingFoundation, setPendingFoundation] = useState<Foundation | null>(null);
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

  const handleStartFoundation = (foundation: Foundation) => {
    const message = `I want to start Foundation ${foundation.id}: ${foundation.title}`;
    setPendingAutoMessage(message);
    setPendingFoundation(foundation);
    setActiveTab('chat');
  };

  const handleAutoMessageSent = () => {
    setPendingAutoMessage(null);
    setPendingFoundation(null);
  };

  // Render all screens but only show active one (preserves state across tab switches)
  return (
    <AppFrame>
      <Header />
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        <div className={`flex-1 min-h-0 flex flex-col ${activeTab === 'chat' ? '' : 'hidden'}`}>
          <ChatScreen
            autoMessage={pendingAutoMessage}
            autoFoundation={pendingFoundation}
            onAutoMessageSent={handleAutoMessageSent}
          />
        </div>
        <div className={`flex-1 min-h-0 flex flex-col overflow-hidden ${activeTab === 'impact' ? '' : 'hidden'}`}>
          <ImpactScreen onStartFoundation={handleStartFoundation} />
        </div>
        <div className={`flex-1 min-h-0 flex flex-col overflow-hidden ${activeTab === 'parking' ? '' : 'hidden'}`}>
          <ParkingLotScreen />
        </div>
        <div className={`flex-1 min-h-0 flex flex-col overflow-hidden ${activeTab === 'hotspots' ? '' : 'hidden'}`}>
          <HotSpotsScreen onCheckinComplete={handleHotSpotsCheckin} />
        </div>
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </AppFrame>
  );
};

export default Index;
