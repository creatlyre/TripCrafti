import { render, screen } from '@testing-library/react';

import { describe, it, expect } from 'vitest';

import { TripCardSkeleton } from '@/components/TripCardSkeleton';

describe('TripCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<TripCardSkeleton />);
    // We can check for the presence of the main container with its pulse animation class
    const skeletonElement = container.firstChild;
    expect(skeletonElement).toBeInTheDocument();
    expect(skeletonElement).toHaveClass('animate-pulse');
  });

  it('contains placeholder elements for image, title, and details', () => {
    const { container } = render(<TripCardSkeleton />);
    // Check for the presence of the various placeholder divs
    const placeholders = container.querySelectorAll('.bg-slate-800');
    // Expecting 5 placeholders: 1 for image, 4 for text lines
    expect(placeholders.length).toBeGreaterThanOrEqual(4);
  });
});
