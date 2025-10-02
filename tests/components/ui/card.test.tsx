import { render, screen } from '@testing-library/react';

import { describe, it, expect } from 'vitest';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default classes', () => {
      render(<Card data-testid="card">Content</Card>);
      const cardElement = screen.getByTestId('card');
      expect(cardElement).toHaveClass('rounded-xl border border-slate-800/60 bg-slate-900/60');
    });

    it('applies custom className', () => {
      render(<Card className="custom-class">Content</Card>);
      const cardElement = screen.getByText('Content');
      expect(cardElement).toHaveClass('custom-class');
    });
  });

  describe('CardHeader', () => {
    it('renders with default classes', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const headerElement = screen.getByTestId('header');
      expect(headerElement).toHaveClass('flex flex-col space-y-1.5 p-6');
    });

    it('applies custom className', () => {
      render(<CardHeader className="custom-class">Header</CardHeader>);
      const headerElement = screen.getByText('Header');
      expect(headerElement).toHaveClass('custom-class');
    });
  });

  describe('CardTitle', () => {
    it('renders with default classes', () => {
      render(<CardTitle>Title</CardTitle>);
      const titleElement = screen.getByText('Title');
      expect(titleElement).toHaveClass('font-semibold leading-none tracking-tight');
    });

    it('applies custom className', () => {
      render(<CardTitle className="custom-class">Title</CardTitle>);
      const titleElement = screen.getByText('Title');
      expect(titleElement).toHaveClass('custom-class');
    });
  });

  describe('CardDescription', () => {
    it('renders with default classes', () => {
      render(<CardDescription>Description</CardDescription>);
      const descriptionElement = screen.getByText('Description');
      expect(descriptionElement).toHaveClass('text-sm text-slate-400');
    });

    it('applies custom className', () => {
      render(<CardDescription className="custom-class">Description</CardDescription>);
      const descriptionElement = screen.getByText('Description');
      expect(descriptionElement).toHaveClass('custom-class');
    });
  });

  describe('CardContent', () => {
    it('renders with default classes', () => {
      render(<CardContent>Content</CardContent>);
      const contentElement = screen.getByText('Content');
      expect(contentElement).toHaveClass('p-6 pt-0');
    });

    it('applies custom className', () => {
      render(<CardContent className="custom-class">Content</CardContent>);
      const contentElement = screen.getByText('Content');
      expect(contentElement).toHaveClass('custom-class');
    });
  });

  describe('CardFooter', () => {
    it('renders with default classes', () => {
      render(<CardFooter>Footer</CardFooter>);
      const footerElement = screen.getByText('Footer');
      expect(footerElement).toHaveClass('flex items-center p-6 pt-0');
    });

    it('applies custom className', () => {
      render(<CardFooter className="custom-class">Footer</CardFooter>);
      const footerElement = screen.getByText('Footer');
      expect(footerElement).toHaveClass('custom-class');
    });
  });
});
