import * as AuthHelpers from '@supabase/auth-helpers-react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { render, screen, fireEvent } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Login from '@/components/auth/Login';

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
  // Provide a lightweight location mock; keep existing properties where possible.
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      ...originalLocation,
      href: 'http://localhost:3000/login',
      pathname: '/login',
      replace: vi.fn(),
      search: '',
    },
  });
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
  (AuthHelpers.useSupabaseClient as unknown as { mockReturnValue: (v:any)=>void }).mockReturnValue(mockSupabaseClient);
  });

  describe('when user is not logged in', () => {
    beforeEach(() => {
  (AuthHelpers.useUser as unknown as { mockReturnValue: (v:any)=>void }).mockReturnValue(null);
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
  (AuthHelpers.useUser as unknown as { mockReturnValue: (v:any)=>void }).mockReturnValue(mockUser);
    });

    it('displays the signed-in user information', () => {
      render(<Login />);
      // Component defaults to Polish (pl) unless ?lang=en in location.
      // Polish dictionary value for signedInAs expected: 'Zalogowany jako'.
      expect(screen.getByText(/Zalogowany jako/i)).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('does not render the Supabase Auth UI', () => {
      render(<Login />);
      expect(screen.queryByTestId('supabase-auth-ui')).not.toBeInTheDocument();
    });

    it('renders a "Sign Out" button', () => {
      render(<Login />);
      // Polish sign out label expected: 'Wyloguj'
      expect(screen.getByRole('button', { name: /Wyloguj/i })).toBeInTheDocument();
    });

    it('calls supabase.auth.signOut when the "Sign Out" button is clicked', async () => {
      const user = userEvent.setup();
      render(<Login />);
      const signOutButton = screen.getByRole('button', { name: /Wyloguj/i });
      await user.click(signOutButton);
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('renders a link to the dashboard', () => {
      render(<Login />);
      // Polish translation expected: 'Przejdź do panelu'
      const dashboardLink = screen.getByRole('link', { name: /Przejdź do panelu/i });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/app?lang=pl');
    });
  });
});
