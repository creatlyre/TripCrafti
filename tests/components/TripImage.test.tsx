import { render, screen, waitFor } from '@testing-library/react';
import { TripImage } from '@/components/TripImage';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('TripImage', () => {
  const mockFetch = vi.fn();
  beforeEach(() => {
    global.fetch = mockFetch;
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders a loading skeleton initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Prevent fetch from resolving
    const { container } = render(<TripImage destination="Paris" />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('renders an error message if the fetch fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to fetch' }),
    });
    render(<TripImage destination="Invalid Destination" />);
    await waitFor(() => {
      expect(screen.getByText('Invalid Destination')).toBeInTheDocument();
    });
  });

  it('renders an error message if no destination is provided', async () => {
    const { container } = render(<TripImage destination="" />);
    await waitFor(() => {
      // In the case of no destination, it renders the empty div but without text
      const errorContainer = container.firstChild;
      expect(errorContainer).toHaveClass('bg-secondary/30');
      expect(errorContainer.textContent).toBe('');
    });
  });

  it('renders the image and attribution on successful fetch', async () => {
    const mockImageData = {
      url: 'http://example.com/image.jpg',
      alt: 'A beautiful city',
      attribution: {
        name: 'John Doe',
        link: 'http://example.com/photographer',
      },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockImageData,
    });

    render(<TripImage destination="London" />);

    await waitFor(() => {
      const imageContainer = screen.getByRole('img');
      expect(imageContainer).toBeInTheDocument();
      expect(imageContainer).toHaveAttribute('aria-label', 'A beautiful city');
      expect(imageContainer).toHaveStyle('background-image: url(http://example.com/image.jpg)');
    });

    // Check for attribution link
    const attributionLink = screen.getByText('John Doe');
    expect(attributionLink).toBeInTheDocument();
    expect(attributionLink).toHaveAttribute('href', expect.stringContaining('http://example.com/photographer'));
  });
});