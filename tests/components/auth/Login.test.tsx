import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '@/components/auth/Login';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as AuthHelpers from '@supabase/auth-helpers-react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';

// Mock the external dependencies
vi.mock('@supabase/auth-helpers-react', () => ({
  useUser: vi.fn(),
  useSupabaseClient: vi.fn(),
}));

vi.mock('@supabase/auth-ui-react', () => ({
  Auth: vi.fn(() => <div data-testid="supabase-auth-ui">Auth UI</div>),
}));

// Mock window location
const originalLocation = window.location;
beforeEach(() => {
  // @ts-ignore
  delete window.location;
  window.location = {
    ...originalLocation,
    href: 'http://localhost:3000/login',
    pathname: '/login',
    replace: vi.fn(),
    search: '',
  };
});

describe('Login Component', () => {
  const mockSignOut = vi.fn().mockResolvedValue({});
  const mockSupabaseClient = {
    auth: {
      signOut: mockSignOut,
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (AuthHelpers.useSupabaseClient as vi.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('when user is not logged in', () => {
    beforeEach(() => {
      (AuthHelpers.useUser as vi.Mock).mockReturnValue(null);
    });

    it('renders the Supabase Auth UI', () => {
      render(<Login />);
      expect(screen.getByTestId('supabase-auth-ui')).toBeInTheDocument();
    });

    it('passes the correct props to the Supabase Auth component', () => {
      render(<Login />);
      expect(SupabaseAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          supabaseClient: mockSupabaseClient,
          providers: ['google', 'github'],
          theme: 'dark',
        }),
        expect.anything()
      );
    });
  });

  describe('when user is logged in', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      // Add other necessary user properties
    };

    beforeEach(() => {
      (AuthHelpers.useUser as vi.Mock).mockReturnValue(mockUser);
    });

    it('displays the signed-in user information', () => {
      render(<Login />);
      expect(screen.getByText('Signed in as')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('does not render the Supabase Auth UI', () => {
      render(<Login />);
      expect(screen.queryByTestId('supabase-auth-ui')).not.toBeInTheDocument();
    });

    it('renders a "Sign Out" button', () => {
      render(<Login />);
      expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
    });

    it('calls supabase.auth.signOut when the "Sign Out" button is clicked', async () => {
      const user = userEvent.setup();
      render(<Login />);
      const signOutButton = screen.getByRole('button', { name: 'Sign Out' });
      await user.click(signOutButton);
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('renders a link to the dashboard', () => {
      render(<Login />);
      const dashboardLink = screen.getByRole('link', { name: /go to dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/app');
    });
  });
});