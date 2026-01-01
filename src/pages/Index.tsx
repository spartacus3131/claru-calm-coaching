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

const Index = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is not logged in, show the landing page
  if (!user) {
    return <HeroSection onStart={() => navigate('/try')} />;
  }

  // Logged in users go straight to the app
  const renderScreen = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatScreen />;
      case 'impact':
        return <ImpactScreen />;
      case 'parking':
        return <ParkingLotScreen />;
      case 'hotspots':
        return <HotSpotsScreen />;
      default:
        return <ChatScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden pb-20">
        {renderScreen()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
