import { Metadata } from 'next';
import { ImpactContent } from './ImpactContent';

export const metadata: Metadata = {
  title: 'Impact | Claru',
  description: 'Your progress, goals, and patterns',
};

/**
 * Impact Page - Ported from old src/screens/ImpactScreen.tsx
 * 
 * Shows Daily Note panel, Foundations list, and Patterns.
 */
export default function ImpactPage() {
  return <ImpactContent />;
}
