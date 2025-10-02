import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import { describe, it, expect, vi } from 'vitest';

import { ItineraryPreferencesFormEnhanced } from '../../src/components/itinerary/ItineraryPreferencesFormEnhanced';

// Minimal dictionary dependency shim via manual mock (could alternatively mock getDictionary)
vi.mock('../../src/lib/i18n', () => ({
  getDictionary: () => ({
    itineraryPreferences: {
      title: 'Itinerary Preferences',
      subtitle: 'Test subtitle',
      interestsLabel: 'Interests',
      interestsHint: 'Pick some',
      travelStyleLabel: 'Travel Style',
      budgetLabel: 'Budget',
      validation: { kidsAgesMismatch: 'Provide an age for each child' },
      budgetOptions: [
        { value: 'Low', label: 'Low' },
        { value: 'Mid-Range', label: 'Mid' },
        { value: 'High', label: 'High' },
      ],
      travelStyles: [
        { value: 'Relaxed', label: 'Relaxed' },
        { value: 'Balanced', label: 'Balanced' },
        { value: 'Intense', label: 'Intense' },
      ],
      interests: [
        { key: 'history', label: 'History' },
        { key: 'food', label: 'Food' },
      ],
      submit: 'Generate',
      generating: 'Generating...',
    },
  }),
}));

describe('ItineraryPreferencesFormEnhanced', () => {
  it('renders dynamic kids age inputs when kids count entered', async () => {
    const handleSubmit = vi.fn();
    render(
      <ItineraryPreferencesFormEnhanced
        tripId="trip1"
        onSubmit={handleSubmit}
        isGenerating={false}
        language="English"
        tripBudget={null}
      />
    );

    // select at least one interest to satisfy validation
    const interestChip = screen.getByText('History');
    fireEvent.click(interestChip);

    // Enter kids count
    const kidsInput = screen.getByPlaceholderText('Kids');
    fireEvent.change(kidsInput, { target: { value: '2' } });

    // Expect two numeric inputs for ages to appear (aria-label Kid 1 age etc.)
    const ageInput1 = screen.getByLabelText('Kid 1 age');
    const ageInput2 = screen.getByLabelText('Kid 2 age');
    expect(ageInput1).toBeInTheDocument();
    expect(ageInput2).toBeInTheDocument();

    fireEvent.change(ageInput1, { target: { value: '5' } });
    fireEvent.change(ageInput2, { target: { value: '9' } });

    // Provide required travel style (already default Balanced) and budget (Mid-Range default)
    const submitBtn = screen.getByRole('button', { name: /generate/i });
    fireEvent.click(submitBtn);
    await waitFor(() => expect(handleSubmit).toHaveBeenCalled());
    const submitted = (handleSubmit as any).mock.calls[0][0];
    expect(submitted.kidsCount).toBe(2);
  });

  it('shows validation error when kids ages missing', async () => {
    const handleSubmit = vi.fn();
    render(
      <ItineraryPreferencesFormEnhanced
        tripId="trip1"
        onSubmit={handleSubmit}
        isGenerating={false}
        language="English"
        tripBudget={null}
      />
    );
    // select interest
    fireEvent.click(screen.getByText('History'));
    fireEvent.change(screen.getByPlaceholderText('Kids'), { target: { value: '2' } });
    // only provide one age
    fireEvent.change(screen.getByLabelText('Kid 1 age'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    // Should not submit
    expect(handleSubmit).not.toHaveBeenCalled();
    // Expect error message (localized mapping may transform - check substring)
    await waitFor(() => {
      expect(screen.getByText(/Provide an age/)).toBeInTheDocument();
    });
  });
});
