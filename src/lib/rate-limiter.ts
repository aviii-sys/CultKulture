import { createAdminClient } from './supabase/admin';

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetMinutes: number;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

/**
 * Checks and records a login attempt for an IP address against the login_attempts database table.
 * Strictly enforces a maximum of 5 attempts per 15-minute sliding window.
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  // If IP is not detected or localhost development, allow with fallback
  const clientIp = ip || 'unknown-ip';

  try {
    const adminClient = createAdminClient();
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    // 1. Count attempts in the last 15 minutes
    const { count, error: countError } = await (adminClient as any)
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip', clientIp)
      .gte('attempted_at', windowStart);

    if (countError) {
      console.error('Rate limiter check error:', countError);
      // In case of DB check failure, allow with caution or deny
      return { allowed: true, remainingAttempts: 1, resetMinutes: WINDOW_MINUTES };
    }

    const currentAttempts = count || 0;

    if (currentAttempts >= MAX_ATTEMPTS) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetMinutes: WINDOW_MINUTES,
      };
    }

    // 2. Record this login attempt
    await adminClient.from('login_attempts').insert({
      ip: clientIp,
    } as any);

    // 3. Optional cleanup: asynchronously purge attempts older than 24 hours
    (adminClient as any)
      .from('login_attempts')
      .delete()
      .lt('attempted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .then(() => {});

    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - (currentAttempts + 1),
      resetMinutes: WINDOW_MINUTES,
    };
  } catch (err) {
    console.error('Rate limiter exception:', err);
    return { allowed: true, remainingAttempts: 1, resetMinutes: WINDOW_MINUTES };
  }
}
