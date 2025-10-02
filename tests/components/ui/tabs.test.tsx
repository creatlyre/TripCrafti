import { render, screen, fireEvent } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

describe('Tabs Components', () => {
  const TestTabs = ({ onValueChange }: { onValueChange?: (value: string) => void }) => (
    <Tabs defaultValue="account" onValueChange={onValueChange}>
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p>Account content</p>
      </TabsContent>
      <TabsContent value="password">
        <p>Password content</p>
      </TabsContent>
    </Tabs>
  );

  it('renders with the default tab active', () => {
    render(<TestTabs />);
    const accountTrigger = screen.getByRole('button', { name: 'Account' });
    const passwordTrigger = screen.getByRole('button', { name: 'Password' });

    expect(accountTrigger).toHaveClass('bg-background text-foreground');
    expect(passwordTrigger).not.toHaveClass('bg-background text-foreground');
    expect(screen.getByText('Account content')).toBeInTheDocument();
    expect(screen.queryByText('Password content')).not.toBeInTheDocument();
  });

  it('switches to a different tab on click', async () => {
    const user = userEvent.setup();
    render(<TestTabs />);

    const passwordTrigger = screen.getByRole('button', { name: 'Password' });
    await user.click(passwordTrigger);

    const accountTrigger = screen.getByRole('button', { name: 'Account' });

    expect(passwordTrigger).toHaveClass('bg-background text-foreground');
    expect(accountTrigger).not.toHaveClass('bg-background text-foreground');
    expect(screen.getByText('Password content')).toBeInTheDocument();
    expect(screen.queryByText('Account content')).not.toBeInTheDocument();
  });

  it('calls onValueChange when a new tab is selected', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TestTabs onValueChange={onValueChange} />);

    const passwordTrigger = screen.getByRole('button', { name: 'Password' });
    await user.click(passwordTrigger);

    expect(onValueChange).toHaveBeenCalledWith('password');
  });

  it('does not render content for inactive tabs', () => {
    render(<TestTabs />);
    expect(screen.queryByText('Password content')).not.toBeInTheDocument();
  });

  it('renders TabsList with correct classes', () => {
    render(<TabsList className="custom-list">List</TabsList>);
    const listElement = screen.getByText('List');
    expect(listElement).toHaveClass(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground'
    );
    expect(listElement).toHaveClass('custom-list');
  });
});
