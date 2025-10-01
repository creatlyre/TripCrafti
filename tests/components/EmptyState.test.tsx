import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '@/components/EmptyState';
import { describe, it, expect, vi } from 'vitest';

// Mock the icon component
vi.mock('@/components/icons/SuitcaseIcon', () => ({
  default: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="suitcase-icon" {...props} />,
}));

describe('EmptyState', () => {
  const mockDict = {
    heading: 'No Trips Found',
    description: 'You have not created any trips yet. Get started by creating a new one.',
    action: 'Create New Trip',
  };
  const mockOnActionClick = vi.fn();

  it('renders the correct heading, description, and action text', () => {
    render(<EmptyState onActionClick={mockOnActionClick} dict={mockDict} />);

    expect(screen.getByText('No Trips Found')).toBeInTheDocument();
    expect(screen.getByText('You have not created any trips yet. Get started by creating a new one.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create New Trip' })).toBeInTheDocument();
  });

  it('renders the SuitcaseIcon', () => {
    render(<EmptyState onActionClick={mockOnActionClick} dict={mockDict} />);
    expect(screen.getByTestId('suitcase-icon')).toBeInTheDocument();
  });

  it('calls the onActionClick handler when the button is clicked', async () => {
    const user = userEvent.setup();
    render(<EmptyState onActionClick={mockOnActionClick} dict={mockDict} />);

    const actionButton = screen.getByRole('button', { name: 'Create New Trip' });
    await user.click(actionButton);

    expect(mockOnActionClick).toHaveBeenCalledTimes(1);
  });
});