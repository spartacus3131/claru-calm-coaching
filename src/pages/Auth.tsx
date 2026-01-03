import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Brain, Loader2, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email');

type AuthStep = 'email' | 'otp';

export default function Auth() {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const { error } = await sendOtp(email);
      if (error) {
        toast.error(error.message);
      } else {
        setStep('otp');
        toast.success('Code sent to your email');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const { error } = await verifyOtp(email, otp);
      if (error) {
        toast.error('Invalid or expired code. Please try again.');
        setOtp('');
      }
      // Success handled by useEffect watching user
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setOtp('');
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const { error } = await sendOtp(email);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('New code sent');
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Enter code</h1>
            <p className="text-muted-foreground text-sm mt-1">
              We sent a 6-digit code to {email}
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                ref={otpInputRef}
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                disabled={loading}
                className="text-center text-2xl tracking-widest"
                autoComplete="one-time-code"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              variant="calm"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Verify'
              )}
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              disabled={loading}
            >
              <ArrowLeft className="w-3 h-3" />
              Change email
            </button>
            <button
              type="button"
              onClick={handleResend}
              className="text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              Resend code
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Claru</h1>
          <p className="text-muted-foreground text-sm mt-1">Your productivity coach</p>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            variant="calm"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Continue'
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          We'll send you a verification code. No password needed.
        </p>
      </div>
    </div>
  );
}
