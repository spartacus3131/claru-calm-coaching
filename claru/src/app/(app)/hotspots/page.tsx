/**
 * @file page.tsx
 * @description Hot Spots page - F027 weekly check-in for 7 life areas
 * @module app/(app)/hotspots
 *
 * Per domain-language.mdc: Use "Hot Spots", "life areas", "weekly check-in".
 */

import { Metadata } from 'next';
import { HotSpotsContent } from './HotSpotsContent';

export const metadata: Metadata = {
  title: 'Hot Spots | Claru',
  description: 'Weekly check-in for your 7 key life areas',
};

export default function HotSpotsPage() {
  return <HotSpotsContent />;
}
