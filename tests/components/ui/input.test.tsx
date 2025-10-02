import { render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input data-testid="input" />);
    const inputElement = screen.getByTestId('input');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveClass('flex h-10 w-full rounded-md border border-input bg-background');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" data-testid="input" />);
    const inputElement = screen.getByTestId('input');
    expect(inputElement).toHaveClass('custom-class');
  });

  it('accepts standard input attributes', () => {
    render(<Input type="password" placeholder="Enter password" data-testid="input" />);
    const inputElement = screen.getByPlaceholderText('Enter password');
    expect(inputElement).toHaveAttribute('type', 'password');
  });

  it('is disabled when disabled prop is passed', () => {
    render(<Input disabled data-testid="input" />);
    const inputElement = screen.getByTestId('input');
    expect(inputElement).toBeDisabled();
  });

  it('handles user input correctly', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Username" />);
    const inputElement = screen.getByPlaceholderText('Username') as HTMLInputElement;
    await user.type(inputElement, 'testuser');
    expect(inputElement.value).toBe('testuser');
  });
});
