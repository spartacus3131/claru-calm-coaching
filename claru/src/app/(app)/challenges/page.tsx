/**
 * @file page.tsx
 * @description Challenges page showing available, active, and completed challenges
 * @module app/challenges
 *
 * Displays the 22 productivity challenges organized by journey part:
 * - Clarity (1-7): Know what matters
 * - Systems (8-15): Build your infrastructure
 * - Capacity (16-22): Protect your energy
 *
 * Users can view challenge details and start new challenges from this page.
 */

import { Metadata } from 'next';
import { ChallengesContent } from './ChallengesContent';

export const metadata: Metadata = {
  title: 'Foundations | Claru',
  description: 'Build sustainable habits with guided productivity foundations',
};

export default function ChallengesPage() {
  return <ChallengesContent />;
}
