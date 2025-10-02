import { render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import type { Trip, GeneratedItinerary } from '@/types';

import { TripCard } from '@/components/TripCard';

// Mock the child TripImage component
vi.mock('@/components/TripImage', () => ({
  TripImage: vi.fn(({ destination }) => <div data-testid="trip-image" data-destination={destination} />),
}));

describe('TripCard', () => {
  const mockOnOpen = vi.fn();
  const mockOnDelete = vi.fn();
  const mockDict = {
    dates: 'Dates',
    budget: 'Budget',
    open: 'Open',
    openPlan: 'View Plan',
    deleteAction: 'Delete',
  };

  const baseTrip: Trip = {
    id: '1',
    user_id: 'user1',
    title: 'Summer in Paris',
    destination: 'Paris, France',
    start_date: '2024-07-01',
    end_date: '2024-07-10',
    budget: 2000,
    currency: 'USD',
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const tripWithItinerary: Trip & { itineraries: GeneratedItinerary[] } = {
    ...baseTrip,
    itineraries: [{ id: 'iti1', status: 'COMPLETED', content: '', trip_id: '1', created_at: '' }],
  };

  const tripWithoutItinerary: Trip & { itineraries: GeneratedItinerary[] } = {
    ...baseTrip,
    id: '2',
    itineraries: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trip details correctly', () => {
    render(<TripCard trip={tripWithoutItinerary} onOpen={mockOnOpen} onDelete={mockOnDelete} dict={mockDict} />);

    expect(screen.getByText('Summer in Paris')).toBeInTheDocument();
    expect(screen.getByText('Paris, France')).toBeInTheDocument();
    expect(screen.getByText(/2024-07-01 → 2024-07-10/)).toBeInTheDocument();
    expect(screen.getByText(/2,000 USD/)).toBeInTheDocument();
    expect(screen.getByTestId('trip-image')).toHaveAttribute('data-destination', 'Paris, France');
  });

  it('calls onOpen when the main card area is clicked', async () => {
    const user = userEvent.setup();
    render(<TripCard trip={tripWithoutItinerary} onOpen={mockOnOpen} onDelete={mockOnDelete} dict={mockDict} />);

    // The card title is within the clickable area
    await user.click(screen.getByText('Summer in Paris'));
    expect(mockOnOpen).toHaveBeenCalledWith();
    expect(mockOnOpen).toHaveBeenCalledTimes(1);
  });

  describe('without a completed itinerary', () => {
    it('renders the "Open" button and calls onOpen without args on click', async () => {
      const user = userEvent.setup();
      render(<TripCard trip={tripWithoutItinerary} onOpen={mockOnOpen} onDelete={mockOnDelete} dict={mockDict} />);

      const openButton = screen.getByRole('button', { name: 'Open' });
      expect(openButton).toBeInTheDocument();

      await user.click(openButton);
      expect(mockOnOpen).toHaveBeenCalledWith();
      expect(mockOnOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('with a completed itinerary', () => {
    it('renders the "View Plan" button and calls onOpen with "itinerary" on click', async () => {
      const user = userEvent.setup();
      render(<TripCard trip={tripWithItinerary} onOpen={mockOnOpen} onDelete={mockOnDelete} dict={mockDict} />);

      const openPlanButton = screen.getByRole('button', { name: 'View Plan' });
      expect(openPlanButton).toBeInTheDocument();

      await user.click(openPlanButton);
      expect(mockOnOpen).toHaveBeenCalledWith('itinerary');
      expect(mockOnOpen).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onDelete with the trip object when the delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<TripCard trip={tripWithoutItinerary} onOpen={mockOnOpen} onDelete={mockOnDelete} dict={mockDict} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    expect(deleteButton).toBeInTheDocument();

    await user.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith(tripWithoutItinerary);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('does not render the delete button if dict.deleteAction is not provided', () => {
    const dictWithoutDelete = { ...mockDict, deleteAction: undefined };
    render(
      <TripCard trip={tripWithoutItinerary} onOpen={mockOnOpen} onDelete={mockOnDelete} dict={dictWithoutDelete} />
    );

    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});
