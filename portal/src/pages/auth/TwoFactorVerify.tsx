import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { AuthLayout } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../hooks';
import { useFrappePostCall } from 'frappe-react-sdk';
import { adminMethods } from '../../services/methods';

export function TwoFactorVerify() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');

    const { call: verify2FA, loading: isCallLoading } = useFrappePostCall(adminMethods.verify2FALogin);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otp.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        setError('');

        try {
            const result = await verify2FA({ otp });

            if (result.message?.success) {
                // Redirect based on user role
                if (user?.isAdmin) {
                    navigate('/admin/dashboard');
                } else if (user?.isMerchant) {
                    navigate('/dashboard');
                } else {
                    // Fallback to dashboard
                    navigate('/dashboard');
                }
            } else {
                setError(result.message?.message || 'Invalid verification code');
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please try again.');
        }
    };

    return (
        <AuthLayout
            title="Two-Factor Authentication"
            description="Enter the 6-digit code from your authenticator app"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3 text-sm text-error-700 bg-error-50 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-primary-600" />
                    </div>
                </div>

                <Input
                    label="Verification Code"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                    required
                    autoFocus
                />

                <Button type="submit" className="w-full" loading={isCallLoading}>
                    Verify
                </Button>

                <p className="text-center text-sm text-slate-600">
                    Open your authenticator app and enter the 6-digit code
                </p>

                <p className="text-center text-sm text-slate-600">
                    Having trouble?{' '}
                    <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                        Back to login
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
