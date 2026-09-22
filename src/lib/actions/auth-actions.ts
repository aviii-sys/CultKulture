'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export interface AuthActionResult {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  // 1. Determine client IP for rate limiting
  const headerList = await headers();
  const forwardedFor = headerList.get('x-forwarded-for');
  const realIp = headerList.get('x-real-ip');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1';

  // 2. Enforce DB rate limit: 5 attempts per 15 mins
  const rateLimit = await checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return {
      error: 'Too many login attempts. For security reasons, please wait 15 minutes before trying again.',
    };
  }

  // 3. Parse and validate input
  const emailRaw = formData.get('email');
  const passwordRaw = formData.get('password');

  const parsed = loginSchema.safeParse({
    email: typeof emailRaw === 'string' ? emailRaw.trim() : '',
    password: typeof passwordRaw === 'string' ? passwordRaw : '',
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || 'Invalid input provided.',
    };
  }

  const { email, password } = parsed.data;

  // 4. Strict owner check: only authorized store manager emails are permitted
  const authorizedEmails = (
    process.env.AUTHORIZED_EMAILS ||
    process.env.OWNER_EMAIL ||
    'avinavnegi7@gmail.com,rhythamsaini99@gmail.com'
  )
    .toLowerCase()
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  if (!authorizedEmails.includes(email.toLowerCase().trim())) {
    // Return generic error to prevent email enumeration
    return {
      error: 'Invalid email or password.',
    };
  }

  // 5. Authenticate via Supabase Auth
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return {
      error: 'Invalid email or password.',
    };
  }

  // 6. Verify owner row exists in public.app_owner table
  const { data: ownerRow, error: ownerError } = await supabase
    .from('app_owner')
    .select('id')
    .eq('id', authData.user.id)
    .single();

  if (ownerError || !ownerRow) {
    // Sign out unauthorized user immediately
    await supabase.auth.signOut();
    return {
      error: 'Access denied: User is not authorized as the store owner.',
    };
  }

  // Login successful
  redirect('/');
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
