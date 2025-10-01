import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
} from '@/components/ui/select';
import { describe, it, expect, vi, beforeAll } from 'vitest';

// JSDOM doesn't implement hasPointerCapture or scrollIntoView, so we polyfill them.
beforeAll(() => {
  // @ts-ignore
  Element.prototype.hasPointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

describe('Select Components', () => {
  const TestSelect = () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  it('renders with a placeholder', () => {
    render(<TestSelect />);
    expect(screen.getByText('Select a fruit')).toBeInTheDocument();
  });

  it('opens the dropdown on trigger click and shows options', async () => {
    const user = userEvent.setup();
    const { container } = render(<TestSelect />);

    const trigger = container.querySelector('[data-slot="select-trigger"]');
    expect(trigger).toBeInTheDocument();
    await user.click(trigger!);

    expect(await screen.findByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Blueberry')).toBeInTheDocument();
  });

  it('selects an item and updates the displayed value', async () => {
    const user = userEvent.setup();
    const { container } = render(<TestSelect />);

    const trigger = container.querySelector('[data-slot="select-trigger"]');
    await user.click(trigger!);

    const bananaOption = await screen.findByText('Banana');
    await user.click(bananaOption);

    // After selection, the dropdown closes and the value updates
    expect(screen.queryByText('Banana')).toBeInTheDocument();
    expect(screen.queryByText('Select a fruit')).not.toBeInTheDocument();
    // The 'Apple' option should no longer be visible as the dropdown is closed
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
  });

  it('disables an item if it has the disabled attribute', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana" disabled>
            Banana
          </SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = container.querySelector('[data-slot="select-trigger"]');
    await user.click(trigger!);

    const bananaOption = await screen.findByRole('option', { name: 'Banana' });
    expect(bananaOption).toHaveAttribute('data-disabled');
  });

  it('renders SelectLabel with correct classes', () => {
    render(
      <Select open>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="custom-label">Label</SelectLabel>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    const labelElement = screen.getByText('Label');
    expect(labelElement).toHaveClass('text-muted-foreground px-2 py-1.5 text-xs');
    expect(labelElement).toHaveClass('custom-label');
  });
});