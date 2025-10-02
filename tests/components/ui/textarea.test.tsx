import { render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('renders with default props', () => {
    render(<Textarea data-testid="textarea" />);
    const textareaElement = screen.getByTestId('textarea');
    expect(textareaElement).toBeInTheDocument();
    expect(textareaElement).toHaveClass('flex min-h-[80px] w-full rounded-md border border-input bg-background');
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-class" data-testid="textarea" />);
    const textareaElement = screen.getByTestId('textarea');
    expect(textareaElement).toHaveClass('custom-class');
  });

  it('accepts standard textarea attributes', () => {
    render(<Textarea placeholder="Enter text" rows={5} data-testid="textarea" />);
    const textareaElement = screen.getByPlaceholderText('Enter text');
    expect(textareaElement).toHaveAttribute('rows', '5');
  });

  it('is disabled when disabled prop is passed', () => {
    render(<Textarea disabled data-testid="textarea" />);
    const textareaElement = screen.getByTestId('textarea');
    expect(textareaElement).toBeDisabled();
  });

  it('handles user input correctly', async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="Comment" />);
    const textareaElement = screen.getByPlaceholderText('Comment') as HTMLTextAreaElement;
    await user.type(textareaElement, 'This is a test comment.');
    expect(textareaElement.value).toBe('This is a test comment.');
  });
});
