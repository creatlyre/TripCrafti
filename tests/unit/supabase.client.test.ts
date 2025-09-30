import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: {} })),
}));

const importFresh = async () => {
  vi.resetModules();
  return await import("../../src/lib/supabase.ts");
};

const originalEnv = { ...process.env } as any;

describe("supabase client factory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    Object.assign(process.env, originalEnv);
    delete (process.env as any).PUBLIC_SUPABASE_URL;
    delete (process.env as any).PUBLIC_SUPABASE_ANON_KEY;
    delete (process.env as any).SUPABASE_URL;
    delete (process.env as any).SUPABASE_KEY;
  });

  it("uses PUBLIC_ variables when available", async () => {
    (process as any).env.PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    (process as any).env.PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const { supabase } = await importFresh();
    const { createClient } = await import("@supabase/supabase-js");
    expect(createClient).toHaveBeenCalledWith("https://example.supabase.co", "anon-key", expect.any(Object));
    expect(supabase).toBeTruthy();
  });

  it("falls back to legacy env names", async () => {
    (process as any).env.SUPABASE_URL = "https://legacy.supabase.co";
    (process as any).env.SUPABASE_KEY = "legacy-key";

    const { supabase } = await importFresh();
    const { createClient } = await import("@supabase/supabase-js");
    expect(createClient).toHaveBeenCalledWith("https://legacy.supabase.co", "legacy-key", expect.any(Object));
    expect(supabase).toBeTruthy();
  });

  it("warns when variables missing", async () => {
    for (const k of ["PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_URL", "SUPABASE_KEY"])
      delete (process.env as any)[k];
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { supabase } = await importFresh();
    expect(warnSpy).toHaveBeenCalled();
    expect(supabase).toBeTruthy();
    warnSpy.mockRestore();
  });
});
