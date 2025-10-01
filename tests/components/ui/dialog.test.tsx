import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { describe, it, expect } from 'vitest';

describe('Dialog Components', () => {
  const TestDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>This is the dialog description.</DialogDescription>
        </DialogHeader>
        <p>This is the main content of the dialog.</p>
        <DialogFooter>
          <Button variant="secondary">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  it('opens the dialog when the trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    // Initially, the dialog content should not be visible
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();

    // Click the trigger button
    const triggerButton = screen.getByRole('button', { name: /open dialog/i });
    await user.click(triggerButton);

    // Now, the dialog content should be visible
    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('This is the dialog description.')).toBeInTheDocument();
    expect(screen.getByText('This is the main content of the dialog.')).toBeInTheDocument();
  });

  it('closes the dialog when the close button is clicked', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    // Open the dialog first
    const triggerButton = screen.getByRole('button', { name: /open dialog/i });
    await user.click(triggerButton);
    expect(screen.getByText('Dialog Title')).toBeInTheDocument();

    // There are two "Close" buttons. We want the one that is an icon.
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    const iconButton = closeButtons.find(btn => btn.querySelectorAll('svg').length > 0);
    expect(iconButton).toBeInTheDocument();
    await user.click(iconButton!);

    // The dialog content should no longer be visible
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
  });

  it('renders DialogHeader with correct classes', () => {
    render(<DialogHeader className="custom-header">Header</DialogHeader>);
    const headerElement = screen.getByText('Header');
    expect(headerElement).toHaveClass('flex flex-col space-y-1.5 text-center sm:text-left');
    expect(headerElement).toHaveClass('custom-header');
  });

  it('renders DialogFooter with correct classes', () => {
    render(<DialogFooter className="custom-footer">Footer</DialogFooter>);
    const footerElement = screen.getByText('Footer');
    expect(footerElement).toHaveClass('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2');
    expect(footerElement).toHaveClass('custom-footer');
  });

  it('renders DialogTitle with correct classes', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="custom-title">Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    const titleElement = screen.getByText('Title');
    expect(titleElement).toHaveClass('text-lg font-semibold leading-none tracking-tight');
    expect(titleElement).toHaveClass('custom-title');
  });

  it('renders DialogDescription with correct classes', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>A Title</DialogTitle>
            <DialogDescription className="custom-description">Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    const descriptionElement = screen.getByText('Description');
    expect(descriptionElement).toHaveClass('text-sm text-muted-foreground');
    expect(descriptionElement).toHaveClass('custom-description');
  });
});