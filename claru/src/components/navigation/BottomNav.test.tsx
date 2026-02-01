import { render, screen } from '@testing-library/react';
import { BottomNav } from './BottomNav';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from 'next/navigation';

const mockUsePathname = usePathname as jest.Mock;

describe('App Shell - BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/chat');
  });

  describe('renders navigation items', () => {
    it('renders Chat nav item', () => {
      render(<BottomNav />);
      expect(screen.getByRole('link', { name: /chat/i })).toBeInTheDocument();
    });

    it('renders Notes nav item', () => {
      render(<BottomNav />);
      expect(screen.getByRole('link', { name: /notes/i })).toBeInTheDocument();
    });

    it('renders Challenges nav item', () => {
      render(<BottomNav />);
      expect(screen.getByRole('link', { name: /challenges/i })).toBeInTheDocument();
    });

    it('renders Projects nav item', () => {
      render(<BottomNav />);
      expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
    });

    it('renders exactly 4 navigation links', () => {
      render(<BottomNav />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(4);
    });
  });

  describe('links to correct routes', () => {
    it('Chat links to /chat', () => {
      render(<BottomNav />);
      expect(screen.getByRole('link', { name: /chat/i })).toHaveAttribute('href', '/chat');
    });

    it('Notes links to /notes', () => {
      render(<BottomNav />);
      expect(screen.getByRole('link', { name: /notes/i })).toHaveAttribute('href', '/notes');
    });

    it('Challenges links to /challenges', () => {
      render(<BottomNav />);
      expect(screen.getByRole('link', { name: /challenges/i })).toHaveAttribute('href', '/challenges');
    });

    it('Projects links to /projects', () => {
      render(<BottomNav />);
      expect(screen.getByRole('link', { name: /projects/i })).toHaveAttribute('href', '/projects');
    });
  });

  describe('active state', () => {
    it('marks Chat as active when on /chat', () => {
      mockUsePathname.mockReturnValue('/chat');
      render(<BottomNav />);
      const chatLink = screen.getByRole('link', { name: /chat/i });
      expect(chatLink).toHaveAttribute('aria-current', 'page');
    });

    it('marks Notes as active when on /notes', () => {
      mockUsePathname.mockReturnValue('/notes');
      render(<BottomNav />);
      const notesLink = screen.getByRole('link', { name: /notes/i });
      expect(notesLink).toHaveAttribute('aria-current', 'page');
    });

    it('marks Challenges as active when on /challenges/123', () => {
      mockUsePathname.mockReturnValue('/challenges/123');
      render(<BottomNav />);
      const challengesLink = screen.getByRole('link', { name: /challenges/i });
      expect(challengesLink).toHaveAttribute('aria-current', 'page');
    });

    it('does not mark other items as active', () => {
      mockUsePathname.mockReturnValue('/chat');
      render(<BottomNav />);
      const notesLink = screen.getByRole('link', { name: /notes/i });
      expect(notesLink).not.toHaveAttribute('aria-current', 'page');
    });
  });
});
