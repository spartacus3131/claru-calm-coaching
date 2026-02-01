'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInAction, signUpAction } from './actions';
import { getTrialMessages, clearTrialMessages } from '@/hooks/useTryMode';
import { migrateTrialMessages } from '@/modules/shared/auth/tryModeMigration';

/**
 * Auth Form Component - F001 User Authentication + F029 Try Mode Migration
 *
 * Client component for login/signup form with state management.
 * Handles migration of trial messages on successful signup.
 *
 * Per nextjs-app-router.mdc: Use "use client" when you need useState, event handlers.
 */
export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /**
   * F029: Migrate trial messages after successful auth.
   * Called after signup/signin completes successfully.
   */
  async function migrateTrialData(): Promise<void> {
    const trialMessages = getTrialMessages();
    if (trialMessages.length === 0) return;

    try {
      const result = await migrateTrialMessages(trialMessages);
      if (result.success) {
        clearTrialMessages();
        console.log(`Migrated ${result.migratedCount} trial messages`);
      } else {
        // Log but don't block - trial data is not critical
        console.error('Trial migration failed:', result.error);
      }
    } catch (err) {
      console.error('Trial migration error:', err);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);

    try {
      const action = mode === 'signin' ? signInAction : signUpAction;
      const result = await action(formData);
      
      if (result?.error) {
        setError(result.error);
        return;
      }

      // F029: Migrate trial messages after successful auth
      // This runs on the client after the server action completes
      await migrateTrialData();

      // Navigate to chat (server action would have redirected, but we handle it here for migration)
      router.push('/chat');
    } catch {
      // Redirect will throw NEXT_REDIRECT, which is expected behavior
      // Still try to migrate before the redirect completes
      await migrateTrialData();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="bg-card p-8 rounded-lg shadow-md border border-border/50">
      <h2 className="text-xl font-semibold mb-6 text-foreground">
        {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={8}
            className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending
            ? 'Please wait...'
            : mode === 'signin'
            ? 'Sign in'
            : 'Create account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
          }}
          className="text-sm text-primary hover:text-primary/80"
        >
          {mode === 'signin'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
