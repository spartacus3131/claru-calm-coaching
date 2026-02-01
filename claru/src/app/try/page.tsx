import { Metadata } from 'next';
import { TryInterface } from './TryInterface';

export const metadata: Metadata = {
  title: 'Try Claru | Free Check-in',
  description: 'Try Claru for free - no sign up required',
};

/**
 * Trial Page - Try the app without signing up
 */
export default function TryPage() {
  return <TryInterface />;
}
