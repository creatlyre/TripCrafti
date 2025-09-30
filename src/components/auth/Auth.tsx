// src/components/auth/Auth.tsx

import React from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createBrowserClient } from "@supabase/ssr";
import AuthLogin from './Login'; // We import the login UI here

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// This is our new "island" component.
// It contains BOTH the provider and the component that needs the provider's context.
export default function Auth() {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthLogin />
    </SessionContextProvider>
  );
}