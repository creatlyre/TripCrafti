import type { APIRoute } from 'astro';

import { z } from 'zod';

import { createSupabaseServer } from '@/lib/supabase';

export const prerender = false;

const resendVerificationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email } = resendVerificationSchema.parse(body);

    const supabase = createSupabaseServer(cookies);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/api/auth/confirm`,
      },
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: 'resend_failed',
          message: error.message || 'Failed to resend verification email',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Verification email sent. Please check your inbox.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: error.errors[0]?.message || 'Invalid email address',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'server_error',
        message: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
