import { SessionContextProvider } from '@supabase/auth-helpers-react';
// Unified Supabase provider using the already configured client in lib/supabase.
// Avoids pulling in @supabase/ssr (geared for Next.js) and its NEXT_PUBLIC_* env expectations.
import React from 'react';

import { supabase } from '../../lib/supabase';

interface Props {
  children: React.ReactNode;
}

export default function SupabaseProvider({ children }: Props) {
  return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
}
