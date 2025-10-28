import { render, screen } from '@testing-library/react';

import { describe, it, expect } from 'vitest';

import { Progress } from '@/components/ui/progress';

describe('Progress', () => {
  it('renders with default props', () => {
    render(<Progress data-testid="progress" />);
    const progressElement = screen.getByTestId('progress');
    const indicator = progressElement.firstChild as HTMLElement;

    expect(progressElement).toBeInTheDocument();
    expect(progressElement).toHaveClass('h-2'); // default size 'md'
    expect(indicator).toHaveClass('bg-primary'); // default variant
    expect(indicator.style.transform).toBe('translateX(-100%)');
  });

  it('renders with a specific value', () => {
    render(<Progress value={50} data-testid="progress" />);
    const progressElement = screen.getByTestId('progress');
    const indicator = progressElement.firstChild as HTMLElement;
    expect(indicator.style.transform).toBe('translateX(-50%)');
  });

  it('clamps value to a maximum of 100%', () => {
    render(<Progress value={120} max={100} data-testid="progress" />);
    const progressElement = screen.getByTestId('progress');
    const indicator = progressElement.firstChild as HTMLElement;
    // Note: The calculation results in `translateX(-0%)` which is valid.
    expect(indicator.style.transform).toBe('translateX(-0%)');
  });

  it('clamps value to a minimum of 0%', () => {
    render(<Progress value={-10} data-testid="progress" />);
    const progressElement = screen.getByTestId('progress');
    const indicator = progressElement.firstChild as HTMLElement;
    expect(indicator.style.transform).toBe('translateX(-100%)');
  });

  it('renders with success variant', () => {
    render(<Progress variant="success" value={50} data-testid="progress" />);
    const progressElement = screen.getByTestId('progress');
    const indicator = progressElement.firstChild as HTMLElement;
    expect(indicator).toHaveClass('bg-green-500');
  });

  it('renders with warning variant', () => {
    render(<Progress variant="warning" value={50} data-testid="progress" />);
    const progressElement = screen.getByTestId('progress');
    const indicator = progressElement.firstChild as HTMLElement;
    expect(indicator).toHaveClass('bg-yellow-500');
  });

  it('renders with error variant', () => {
    render(<Progress variant="error" value={50} data-testid="progress" />);
    const progressElement = screen.getByTestId('progress');
    const indicator = progressElement.firstChild as HTMLElement;
    expect(indicator).toHaveClass('bg-red-500');
  });

  it('renders with sm size', () => {
    render(<Progress size="sm" data-testid="progress" />);
    const progressElement = screen.getByTestId('progress');
    expect(progressElement).toHaveClass('h-1');
  });

  it('renders with lg size', () => {
    render(<Progress size="lg" data-testid="progress" />);
    const progressElement = screen.getByTestId('progress');
    expect(progressElement).toHaveClass('h-3');
  });

  it('applies custom className', () => {
    render(<Progress className="custom-class" data-testid="progress" />);
    const progressElement = screen.getByTestId('progress');
    expect(progressElement).toHaveClass('custom-class');
  });
});
