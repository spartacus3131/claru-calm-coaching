'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { signUp, signIn, signOut } from '@/modules/shared/auth/authService';
import { redirect } from 'next/navigation';

/**
 * Server Action: Sign up a new user.
 *
 * F001 requirement: Sign up with email/password
 * F029 modification: Returns success flag instead of redirecting.
 * Client handles migration and redirect.
 * 
 * After successful signup, automatically signs the user in so they
 * don't have to re-enter credentials.
 */
export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const supabase = await createServerSupabase();
  const result = await signUp(supabase.auth, email, password);

  if (!result.success) {
    return { error: result.error };
  }

  // Auto-sign-in after successful signup for better UX
  // This creates the session so user doesn't have to sign in again
  const signInResult = await signIn(supabase.auth, email, password);
  
  if (!signInResult.success) {
    // Signup worked but auto-signin failed - still return success
    // User can manually sign in
    console.warn('Auto-signin after signup failed:', signInResult.error);
  }

  // F029: Return success to allow client-side migration before redirect
  return { success: true };
}

/**
 * Server Action: Sign in an existing user.
 *
 * F001 requirement: Sign in
 * F029 modification: Returns success flag instead of redirecting.
 * Client handles migration and redirect.
 */
export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const supabase = await createServerSupabase();
  const result = await signIn(supabase.auth, email, password);

  if (!result.success) {
    return { error: result.error };
  }

  // F029: Return success to allow client-side migration before redirect
  return { success: true };
}

/**
 * Server Action: Sign out the current user.
 *
 * F001 requirement: Sign out
 */
export async function signOutAction() {
  const supabase = await createServerSupabase();
  await signOut(supabase.auth);
  redirect('/auth');
}
