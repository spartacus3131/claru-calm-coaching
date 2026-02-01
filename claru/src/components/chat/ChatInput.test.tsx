import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

describe('Chat UI - ChatInput', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('rendering', () => {
    it('renders a text input', () => {
      render(<ChatInput onSubmit={mockOnSubmit} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders a submit button', () => {
      render(<ChatInput onSubmit={mockOnSubmit} />);
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('renders placeholder text', () => {
      render(<ChatInput onSubmit={mockOnSubmit} />);
      expect(screen.getByPlaceholderText(/what's on your mind/i)).toBeInTheDocument();
    });
  });

  describe('submission', () => {
    it('calls onSubmit with input value when form is submitted', () => {
      render(<ChatInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Hello, Claru!' } });
      fireEvent.submit(input.closest('form')!);
      
      expect(mockOnSubmit).toHaveBeenCalledWith('Hello, Claru!');
    });

    it('clears input after submission', () => {
      render(<ChatInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Hello, Claru!' } });
      fireEvent.submit(input.closest('form')!);
      
      expect(input.value).toBe('');
    });

    it('does not submit empty messages', () => {
      render(<ChatInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.submit(input.closest('form')!);
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('does not submit whitespace-only messages', () => {
      render(<ChatInput onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.submit(input.closest('form')!);
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('disables input when disabled prop is true', () => {
      render(<ChatInput onSubmit={mockOnSubmit} disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('disables button when disabled prop is true', () => {
      render(<ChatInput onSubmit={mockOnSubmit} disabled />);
      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });
  });
});
