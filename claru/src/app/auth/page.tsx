import { Metadata } from 'next';
import { AuthForm } from './AuthForm';

export const metadata: Metadata = {
  title: 'Sign In | Claru',
  description: 'Sign in to your Claru account',
};

/**
 * Auth Page - F001 User Authentication
 *
 * Public page for login/signup.
 */
export default function AuthPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Claru</h1>
          <p className="mt-2 text-muted-foreground">
            Your AI productivity coach
          </p>
        </div>
        <AuthForm />
      </div>
    </main>
  );
}
