import { Metadata } from 'next';
import { ParkingLotContent } from './ParkingLotContent';

export const metadata: Metadata = {
  title: 'Parking Lot | Claru',
  description: 'Park ideas, tasks, and thoughts to deal with later',
};

/**
 * Parking Lot Page - Ported from old src/screens/ParkingLotScreen.tsx
 */
export default function ParkingLotPage() {
  return <ParkingLotContent />;
}
