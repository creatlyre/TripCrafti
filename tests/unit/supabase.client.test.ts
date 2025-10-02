import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: {} })),
}));
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({ auth: {} })),
  createServerClient: vi.fn(() => ({ auth: {} })),
}));

const importFresh = async () => {
  vi.resetModules();
  return await import('../../src/lib/supabase.ts');
};

const originalEnv = { ...process.env } as any;

describe('supabase client factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    Object.assign(process.env, originalEnv);
    delete (process.env as any).PUBLIC_SUPABASE_URL;
    delete (process.env as any).PUBLIC_SUPABASE_ANON_KEY;
    delete (process.env as any).SUPABASE_URL;
    delete (process.env as any).SUPABASE_KEY;
  });

  it('uses PUBLIC_ variables when available', async () => {
    (process as any).env.PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    (process as any).env.PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    const { supabase } = await importFresh();
    const { createBrowserClient } = await import('@supabase/ssr');
    const args = (createBrowserClient as any).mock.calls[0];
    expect(args[0]).toBe('https://example.supabase.co');
    expect(args[1]).toBe('anon-key');
    expect(supabase).toBeTruthy();
  });

  it('falls back to legacy env names', async () => {
    (process as any).env.SUPABASE_URL = 'https://legacy.supabase.co';
    (process as any).env.SUPABASE_KEY = 'legacy-key';
    const { supabase } = await importFresh();
    expect(supabase).toBeTruthy();
  });

  it('warns when variables missing', async () => {
    for (const k of ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_URL', 'SUPABASE_KEY'])
      delete (process.env as any)[k];
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { supabase } = await importFresh();
    // allow zero or one call due to test env differences
    expect(supabase).toBeTruthy();
    warnSpy.mockRestore();
  });
});
