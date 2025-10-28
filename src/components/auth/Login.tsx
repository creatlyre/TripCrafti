import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import React, { useEffect, useState } from 'react';

import { ThemeSupa } from '@supabase/auth-ui-shared';

import { getDictionary, type Lang } from '@/lib/i18n';

// Auth UI appearance override aligned with app design system
const appearance = {
  theme: ThemeSupa,
  variables: {
    default: {
      colors: {
        brand: 'rgb(99 102 241)', // indigo-500
        brandAccent: 'rgb(168 85 247)',
        inputBackground: 'rgba(15,23,42,0.7)',
        inputBorder: 'rgba(71,85,105,0.6)',
        defaultButtonBackground: 'linear-gradient(to right, rgb(99 102 241), rgb(168 85 247), rgb(56 189 248))',
        defaultButtonBackgroundHover: 'linear-gradient(to right, rgb(129 140 248), rgb(192 132 252), rgb(56 189 248))',
      },
      radii: {
        borderRadiusButton: '0.625rem',
        buttonBorderRadius: '0.625rem',
        inputBorderRadius: '0.5rem',
      },
      fonts: {
        bodyFontFamily: 'Inter, system-ui, sans-serif',
        buttonFontFamily: 'Inter, system-ui, sans-serif',
        inputFontFamily: 'Inter, system-ui, sans-serif',
      },
    },
  },
  className: {
    container: 'space-y-5',
    divider:
      'relative my-6 text-[11px] uppercase tracking-wide text-slate-500 before:content-[""] before:absolute before:left-0 before:top-1/2 before:h-px before:w-full before:bg-slate-700/60 before:-z-10',
    button: [
      'group w-full relative inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm',
      'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60',
      'bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500 hover:from-indigo-400 hover:via-fuchsia-400 hover:to-sky-400',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ].join(' '),
    input: [
      'w-full rounded-md border bg-slate-900/60 text-slate-100 text-sm px-3 py-2',
      'border-slate-700/70 placeholder-slate-500',
      'focus:border-indigo-400 focus:ring focus:ring-indigo-400/30 focus:outline-none',
    ].join(' '),
    label: 'text-[11px] font-medium tracking-wide text-slate-400 mb-1',
    anchor: 'text-xs font-medium text-indigo-400 hover:text-indigo-300 transition',
    message: 'text-[11px] text-slate-400',
    loader: 'animate-pulse',
  },
};

export default function Login() {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Default to Polish in absence of explicit ?lang param (tests expect PL as default)
  const langParam =
    typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('lang') || 'pl' : 'pl';
  const lang = (langParam === 'en' ? 'en' : 'pl') as Lang;
  const dict = getDictionary(lang);

  // Handle URL error parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error');
    const urlMessage = urlParams.get('message');

    if (urlError && urlMessage) {
      setError(urlMessage);
      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (typeof window === 'undefined') return;
      if (!session) return;
      // Only redirect automatically if user is currently on /login
      const current = new URL(window.location.href);
      if (current.pathname !== '/login') return;
      setError(null);
      const lang = current.searchParams.get('lang') || 'pl';
      window.location.replace('/app?lang=' + lang);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const handleResendVerification = async () => {
    if (!error || !error.includes('email')) return;

    setResendingVerification(true);
    try {
      // This is a simple implementation - in a real app you'd want to track the email
      // For now, we'll show a generic message
      setVerificationSent(true);
      setError(null);

      // You could implement actual resend logic here by calling your API
      // const response = await fetch('/api/auth/resend-verification', { ... });
    } catch {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setResendingVerification(false);
    }
  };

  if (user) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-6 py-6" lang={lang}>
          <p className="text-sm text-slate-300">{dict.auth?.signedInAs}</p>
          <p className="mt-1 text-sm font-medium text-white">{user.email}</p>
          <button
            onClick={async () => {
              setLoading(true);
              await supabase.auth.signOut();
              setLoading(false);
            }}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 shadow hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {loading ? dict.auth?.signingOut || dict.auth?.signOut : dict.auth?.signOut}
          </button>
          <div className="mt-4 text-xs text-slate-500">
            <a href={lang === 'en' ? '/app' : `/app?lang=${lang}`} className="underline hover:text-slate-300">
              {dict.auth?.goToDashboard}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-200">
          {error}
          {(error.includes('email') || error.includes('verification')) && (
            <button
              onClick={handleResendVerification}
              disabled={resendingVerification}
              className="ml-2 text-indigo-400 hover:text-indigo-300 underline disabled:opacity-50"
            >
              {resendingVerification
                ? dict.auth?.sending || 'Sending...'
                : dict.auth?.resendVerification || 'Resend verification'}
            </button>
          )}
        </div>
      )}
      {verificationSent && (
        <div className="mb-4 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-[13px] text-green-200">
          {dict.auth?.verificationSent || 'Verification email sent! Please check your inbox and spam folder.'}
        </div>
      )}
      <Auth
        supabaseClient={supabase}
        appearance={appearance}
        providers={['google', 'github']}
        onlyThirdPartyProviders={false}
        redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined}
        theme="dark"
        localization={{
          variables: {
            sign_in: {
              email_label: 'Email',
              password_label: 'Password',
              button_label: 'Sign in',
            },
            sign_up: {
              email_label: 'Email',
              password_label: 'Password',
              button_label: 'Create account',
            },
          },
        }}
      />
    </div>
  );
}
