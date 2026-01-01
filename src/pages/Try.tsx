import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ChatScreen } from '@/screens/ChatScreen';
import { ChallengesScreen } from '@/screens/ChallengesScreen';
import { InsightsScreen } from '@/screens/InsightsScreen';
import { HotSpotsScreen } from '@/screens/HotSpotsScreen';
import { ParkingLot } from '@/components/ParkingLot';

const Try = () => {
  const [activeTab, setActiveTab] = useState('chat');

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

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header showBackToHome />
      <main className="flex-1 flex flex-col overflow-hidden pb-20">
        {renderScreen()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <ParkingLot />
    </div>
  );
};

export default Try;
