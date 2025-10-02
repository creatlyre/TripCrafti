import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useAuth } from '@/components/hooks/useAuth';
import TripDashboard from '@/components/TripDashboard';

// --- Mocks ---

// Mocking hooks and modules
vi.mock('@/components/hooks/useAuth');
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

vi.mock('@/lib/i18n', () => ({
  getDictionary: vi.fn().mockReturnValue({
    dashboard: {
      checking: 'Checking auth...',
      heading: 'My Trips',
      sub: 'Manage your adventures.',
      refresh: 'Refresh',
      loading: 'Loading...',
      create: {
        add: 'New Trip',
        heading: 'Create a New Trip',
        description: 'Fill in the details to get started.',
        title: 'Title',
        destination: 'Destination',
        budget: 'Budget',
        start: 'Start Date',
        end: 'End Date',
        or: 'or',
        duration: 'Duration (days)',
        cancel: 'Cancel',
        submit: 'Create Trip',
      },
      empty: {
        heading: 'No Trips Yet',
        description: 'Start your journey by creating a new trip.',
      },
      dates: 'Dates',
      budget: 'Budget',
      open: 'Open',
      openPlan: 'View Plan',
      delete: {
        confirm: 'Delete Trip',
      },
    },
  }),
}));

// Mock child components to isolate the dashboard
vi.mock('@/components/TripCard', () => ({
  TripCard: vi.fn(({ trip, onOpen, onDelete }) => (
    <li onClick={() => onOpen()}>
      <div data-testid={`trip-card-${trip.id}`}>{trip.title}</div>
      <button onClick={() => onDelete(trip)}>Delete</button>
    </li>
  )),
}));
vi.mock('@/components/TripCardSkeleton', () => ({
  TripCardSkeleton: vi.fn(() => <div data-testid="skeleton"></div>),
}));
vi.mock('@/components/EmptyState', () => ({
  EmptyState: vi.fn(({ onActionClick }) => (
    <div data-testid="empty-state">
      <button onClick={onActionClick}>Create a trip</button>
    </div>
  )),
}));

// --- Test Suite ---

describe('TripDashboard', () => {
  const mockUser = { id: 'user-123' };
  const mockSession = { access_token: 'fake-token' };
  const mockTrips = [
    { id: 'trip-1', title: 'Trip to Paris', itineraries: [] },
    { id: 'trip-2', title: 'Trip to Tokyo', itineraries: [] },
  ];
  const mockedUseAuth = vi.mocked(useAuth);

  // Mock fetch
  const mockFetch = vi.fn();
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockTrips,
    });
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication States', () => {
    it('shows loading message while auth is loading', () => {
      mockedUseAuth.mockReturnValue({ user: null, session: null, loading: true });
      render(<TripDashboard lang="en" />);
      expect(screen.getByText('Checking auth...')).toBeInTheDocument();
    });

    it('shows a login prompt if user is not authenticated', () => {
      mockedUseAuth.mockReturnValue({ user: null, session: null, loading: false });
      render(<TripDashboard lang="en" />);
      expect(screen.getByText('You must be signed in')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to login' })).toBeInTheDocument();
    });
  });

  describe('When user is authenticated', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({ user: mockUser, session: mockSession, loading: false });
    });

    it('fetches and displays a list of trips', async () => {
      render(<TripDashboard lang="en" />);
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/trips', expect.any(Object));
      });
      expect(await screen.findByTestId('trip-card-trip-1')).toBeInTheDocument();
      expect(await screen.findByTestId('trip-card-trip-2')).toBeInTheDocument();
    });

    it('shows skeletons while trips are loading', () => {
      // Don't resolve fetch immediately
      mockFetch.mockImplementation(() => new Promise(() => {}));
      render(<TripDashboard lang="en" />);
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('shows the empty state if there are no trips', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => [] });
      render(<TripDashboard lang="en" />);
      expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
    });

    it('opens the create trip modal when "New Trip" is clicked', async () => {
      const user = userEvent.setup();
      render(<TripDashboard lang="en" />);
      await user.click(screen.getByRole('button', { name: 'New Trip' }));
      expect(await screen.findByText('Create a New Trip')).toBeInTheDocument();
    });

    it('allows creating a new trip', async () => {
      const user = userEvent.setup();
      render(<TripDashboard lang="en" />);

      // Open modal
      await user.click(screen.getByRole('button', { name: 'New Trip' }));

      // Fill form
      await user.type(screen.getByLabelText('Title'), 'My New Adventure');
      await user.type(screen.getByLabelText('Destination'), 'The Mountains');
      await user.type(screen.getByLabelText('Start Date'), '2025-01-01');
      await user.type(screen.getByLabelText('End Date'), '2025-01-07');

      // Mock the POST request
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new-trip' }) });

      // Submit form
      await user.click(screen.getByRole('button', { name: 'Create Trip' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/trips',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('My New Adventure'),
          })
        );
      });

      // Modal should close after successful creation
      expect(screen.queryByText('Create a New Trip')).not.toBeInTheDocument();
    });
  });
});
