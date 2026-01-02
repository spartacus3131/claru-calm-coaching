import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ChatScreen } from '@/screens/ChatScreen';
import { ImpactScreen } from '@/screens/ImpactScreen';
import { ParkingLotScreen } from '@/screens/ParkingLotScreen';
import { HotSpotsScreen } from '@/screens/HotSpotsScreen';

const Try = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [pendingHotSpotsSummary, setPendingHotSpotsSummary] = useState<string | null>(null);

  const handleHotSpotsCheckin = (summary: string) => {
    setPendingHotSpotsSummary(summary);
    setActiveTab('chat');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatScreen autoMessage={pendingHotSpotsSummary} onAutoMessageSent={() => setPendingHotSpotsSummary(null)} />;
      case 'impact':
        return <ImpactScreen />;
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
      <Header showBackToHome />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderScreen()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Try;
