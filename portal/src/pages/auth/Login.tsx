import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../../components/layout';
import { Button, Input, useToast } from '../../components/ui';
import { useAuth } from '../../hooks';
import { useFrappePostCall } from 'frappe-react-sdk';
import { adminMethods } from '../../services/methods';

export function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { error: toastError } = useToast();

  const { call: get2FAStatus } = useFrappePostCall(adminMethods.get2FAStatus);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);

      // Check if user has 2FA enabled and verified
      try {
        const result = await get2FAStatus({});
        const twoFAStatus = result.message;

        // Only redirect to 2FA verification if both enabled AND verified
        if (twoFAStatus?.success && twoFAStatus?.enabled && twoFAStatus?.verified) {
          // Redirect to 2FA verification page
          navigate('/verify-2fa');
          return;
        }
      } catch (err) {
        // If 2FA check fails, continue with normal login flow
        console.error('2FA check failed:', err);
      }

      // Redirect based on user role (if no 2FA)
      // Note: user object in hook should be updated now or on next render
      // For immediate redirect based on role, we might need to rely on the role check from the 1st login attempt
      // but usually the session cookie is enough for subsequent navigate-driven loads to handle it.
      // However, to fix the lint error, we check user from the hook:
      if (user?.isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      toastError('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your account to continue"
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

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>

        <p className="text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-700">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
