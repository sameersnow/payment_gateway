import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layout';
import { Button, Input } from '../../components/ui';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <AuthLayout
        title="Check your email"
        description={`We've sent password reset instructions to ${email}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-success-600" />
          </div>

          <p className="text-sm text-slate-600 mb-6">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setSubmitted(false)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              try another email address
            </button>
          </p>

          <Link to="/login">
            <Button variant="secondary" className="w-full">
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email address and we'll send you instructions to reset your password"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email address"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <Button type="submit" className="w-full" loading={loading}>
          Send reset instructions
        </Button>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
