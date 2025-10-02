import { render, screen } from '@testing-library/react';

import { describe, it, expect } from 'vitest';

import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with default variant and size', () => {
    render(<Button>Default</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Default' });
    expect(buttonElement).toHaveClass('bg-primary text-primary-foreground');
    expect(buttonElement).toHaveClass('h-9 px-4 py-2');
  });

  it('renders with destructive variant', () => {
    render(<Button variant="destructive">Destructive</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Destructive' });
    expect(buttonElement).toHaveClass('bg-destructive text-white');
  });

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Outline' });
    expect(buttonElement).toHaveClass('border bg-background');
  });

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Secondary' });
    expect(buttonElement).toHaveClass('bg-secondary text-secondary-foreground');
  });

  it('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Ghost' });
    expect(buttonElement).toHaveClass('hover:bg-accent');
  });

  it('renders with link variant', () => {
    render(<Button variant="link">Link</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Link' });
    expect(buttonElement).toHaveClass('text-primary underline-offset-4 hover:underline');
  });

  it('renders with sm size', () => {
    render(<Button size="sm">Small</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Small' });
    expect(buttonElement).toHaveClass('h-8 rounded-md px-3');
  });

  it('renders with lg size', () => {
    render(<Button size="lg">Large</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Large' });
    expect(buttonElement).toHaveClass('h-10 rounded-md px-6');
  });

  it('renders with icon size', () => {
    render(<Button size="icon">I</Button>);
    const buttonElement = screen.getByRole('button', { name: 'I' });
    expect(buttonElement).toHaveClass('size-9');
  });

  it('renders as a child component', () => {
    render(
      <Button asChild>
        <a href="/">Link</a>
      </Button>
    );
    const linkElement = screen.getByRole('link', { name: 'Link' });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveClass('bg-primary');
  });

  it('is disabled when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Disabled' });
    expect(buttonElement).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Custom' });
    expect(buttonElement).toHaveClass('custom-class');
  });
});
