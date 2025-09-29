// src/components/auth/Auth.tsx

import React from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createSupabase } from '../../lib/supabase';
import AuthLogin from './Login'; // We import the login UI here

const supabase = createSupabase();

// This is our new "island" component.
// It contains BOTH the provider and the component that needs the provider's context.
export default function Auth() {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthLogin />
    </SessionContextProvider>
  );
}