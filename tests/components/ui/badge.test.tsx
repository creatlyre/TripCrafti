import { render, screen } from '@testing-library/react';

import { describe, it, expect } from 'vitest';

import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>Default</Badge>);
    const badgeElement = screen.getByText('Default');
    expect(badgeElement).toHaveClass('bg-primary/10 text-primary border-primary/20');
  });

  it('renders with success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    const badgeElement = screen.getByText('Success');
    expect(badgeElement).toHaveClass('bg-green-100 text-green-700 border-green-200');
  });

  it('renders with warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badgeElement = screen.getByText('Warning');
    expect(badgeElement).toHaveClass('bg-yellow-100 text-yellow-700 border-yellow-200');
  });

  it('renders with error variant', () => {
    render(<Badge variant="error">Error</Badge>);
    const badgeElement = screen.getByText('Error');
    expect(badgeElement).toHaveClass('bg-red-100 text-red-700 border-red-200');
  });

  it('renders with info variant', () => {
    render(<Badge variant="info">Info</Badge>);
    const badgeElement = screen.getByText('Info');
    expect(badgeElement).toHaveClass('bg-blue-100 text-blue-700 border-blue-200');
  });

  it('renders with outline variant', () => {
    render(<Badge variant="outline">Outline</Badge>);
    const badgeElement = screen.getByText('Outline');
    expect(badgeElement).toHaveClass('border-2 border-muted-foreground/20 text-foreground bg-transparent');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badgeElement = screen.getByText('Custom');
    expect(badgeElement).toHaveClass('custom-class');
  });

  it('forwards other html attributes', () => {
    render(<Badge data-testid="custom-badge">Attribute</Badge>);
    const badgeElement = screen.getByTestId('custom-badge');
    expect(badgeElement).toBeInTheDocument();
  });
});
