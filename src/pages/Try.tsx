import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ChatScreen } from '@/screens/ChatScreen';
import { ImpactScreen } from '@/screens/ImpactScreen';
import { ParkingLotScreen } from '@/screens/ParkingLotScreen';
import { HotSpotsScreen } from '@/screens/HotSpotsScreen';

const Try = () => {
  const [activeTab, setActiveTab] = useState('chat');

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
      <Header showBackToHome />
      <main className="flex-1 flex flex-col overflow-hidden pb-20">
        {renderScreen()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Try;
