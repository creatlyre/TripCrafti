import { vi } from 'vitest';

// Create a generic mock for the Supabase client
const mockSupabaseClient = {
  auth: {
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    // Add other auth methods that might be used by the components under test
  },
  from: vi.fn(() => ({
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    update: vi.fn().mockResolvedValue({ data: [], error: null }),
    delete: vi.fn().mockResolvedValue({ data: [], error: null }),
  })),
};

// Export the mocked objects and functions to match the original module's exports
export const supabase = mockSupabaseClient;
export const createSupabaseServer = vi.fn().mockReturnValue(mockSupabaseClient);
export const createSupabase = vi.fn().mockReturnValue(mockSupabaseClient);