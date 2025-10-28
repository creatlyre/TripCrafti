import { render, screen } from '@testing-library/react';

import { motion } from 'framer-motion';
import { describe, it, expect, vi } from 'vitest';

import TestimonialCard from '@/components/TestimonialCard';

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
    },
  };
});

describe('TestimonialCard', () => {
  const testProps = {
    text: 'This is a fantastic product!',
    author: 'Jane Doe',
    delay: 0,
  };

  it('renders the testimonial text and author', () => {
    render(<TestimonialCard {...testProps} />);

    // Check for the text content, including the quotes
    expect(screen.getByText(`“${testProps.text}”`)).toBeInTheDocument();

    // Check for the author, including the em dash
    expect(screen.getByText(`— ${testProps.author}`)).toBeInTheDocument();
  });

  it('passes the correct animation variants to motion.div', () => {
    render(<TestimonialCard {...testProps} />);

    expect(motion.div).toHaveBeenCalledWith(
      expect.objectContaining({
        initial: 'hidden',
        whileInView: 'visible',
        viewport: { once: true, amount: 0.5 },
      }),
      expect.anything()
    );
  });
});
