import { render, screen } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';
import type { Message } from '@/modules/coaching/types';

describe('Chat UI - ChatMessage', () => {
  const userMessage: Message = {
    id: '1',
    role: 'user',
    content: 'I need to finish the roadmap today.',
    createdAt: new Date('2026-01-31T09:00:00Z'),
  };

  const assistantMessage: Message = {
    id: '2',
    role: 'assistant',
    content: 'Got it. Roadmap is your priority. What else is on your mind?',
    createdAt: new Date('2026-01-31T09:00:10Z'),
  };

  describe('rendering', () => {
    it('renders user message content', () => {
      render(<ChatMessage message={userMessage} />);
      expect(screen.getByText(/finish the roadmap/i)).toBeInTheDocument();
    });

    it('renders assistant message content', () => {
      render(<ChatMessage message={assistantMessage} />);
      expect(screen.getByText(/Roadmap is your priority/i)).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies user styling for user messages', () => {
      render(<ChatMessage message={userMessage} />);
      const messageElement = screen.getByText(/finish the roadmap/i).closest('div');
      expect(messageElement).toHaveClass('bg-blue-600');
    });

    it('applies assistant styling for assistant messages', () => {
      render(<ChatMessage message={assistantMessage} />);
      const messageElement = screen.getByText(/Roadmap is your priority/i).closest('div');
      expect(messageElement).toHaveClass('bg-gray-100');
    });
  });

  describe('accessibility', () => {
    it('has correct role for user messages', () => {
      render(<ChatMessage message={userMessage} />);
      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });

    it('has correct role for assistant messages', () => {
      render(<ChatMessage message={assistantMessage} />);
      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });
  });
});
