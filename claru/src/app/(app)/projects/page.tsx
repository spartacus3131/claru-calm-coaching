import { Metadata } from 'next';
import { ProjectsContent } from './ProjectsContent';

export const metadata: Metadata = {
  title: 'Projects | Claru',
  description: 'Track your active work and recurring commitments',
};

/**
 * Projects Page - Ported from old src/screens/ProjectsScreen.tsx
 */
export default function ProjectsPage() {
  return <ProjectsContent />;
}
