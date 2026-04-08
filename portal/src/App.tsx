import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks';
import { NotFound } from './pages/NotFound';

import { Login, Signup, ForgotPassword, TwoFactorVerify } from './pages/auth';
import { Onboarding, OnboardingComplete } from './pages/onboarding';
import { Dashboard } from './pages/dashboard';
import { DepositFunds } from './pages/wallet';
// Transaction doctype is out of use — routes disabled
// import { Transactions, TransactionDetail } from './pages/transactions';
import { Orders, OrderDetail } from './pages/orders';
import { Ledger } from './pages/ledger';
import { Settlements, SettlementDetail } from './pages/settlements';
import { DevelopersLayout } from './pages/developers/DevelopersLayout';
import { Documentation } from './pages/developers/Documentation';
import { APIKeys } from './pages/developers/APIKeys';
import { Webhooks, APILogs, IPWhitelist, WebhookLogs } from './pages/developers';
import { Profile, Security, KYC, Team } from './pages/settings';
import { Notifications } from './pages/Notifications';
import { AdminDashboard, Merchants, MerchantDetail, KYCReviews, AdminSettings, AdminReports, AdminOrderDetail, AdminOrders, AdminVANLogs, AdminVirtualAccounts, SettlementDetail as AdminSettlementDetail } from './pages/admin';
// AdminTransactions and TransactionDetail disabled — Transaction doctype is out of use
// import { AdminTransactions, TransactionDetail as AdminTransactionDetail } from './pages/admin';
// Temporarily disabled - not implemented with real APIs:
// import { WebhookDetail } from './pages/developers';
// import { RiskAlerts, AdminUsers } from './pages/admin';

import { ToastProvider } from './components/ui';
import { Toaster } from 'sonner';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false, requireMerchant = false, requireOwner = false }: { children: React.ReactNode; requireAdmin?: boolean; requireMerchant?: boolean; requireOwner?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  // This prevents premature redirects during page refresh
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // If route requires merchant access but user is admin, redirect to admin dashboard
  // Admins should not access merchant routes
  if (requireMerchant && user.isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Check owner requirement
  if (requireOwner && user.merchant?.role !== 'Owner') {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if merchant needs to complete onboarding
  // Skip onboarding check for admin users and onboarding routes
  if (
    user.isMerchant &&
    !user.isAdmin &&
    user.merchant?.onboarding_completed !== 1 &&
    !location.pathname.startsWith('/onboarding')
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (for login, signup, etc.)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If user is logged in, redirect to appropriate dashboard
  if (user) {
    if (user.isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}


function App() {

  return (
    <ToastProvider>
      <Toaster
        position="top-right"
        richColors
        expand={true}
        closeButton
        toastOptions={{
          className: 'z-[99999]',
          duration: 5000,
          classNames: {
            error: 'border-l-4 border-red-500 bg-white shadow-lg',
            success: 'border-l-4 border-green-500 bg-white shadow-lg',
            warning: 'border-l-4 border-yellow-500 bg-white shadow-lg',
            info: 'border-l-4 border-blue-500 bg-white shadow-lg',
            title: 'text-sm font-semibold',
            description: 'text-sm text-slate-600',
            actionButton: 'bg-primary-600 hover:bg-primary-700 text-white font-medium',
            closeButton: 'bg-white hover:bg-slate-100 border border-slate-200',
          }
        }}
      />
      <AuthProvider>
        <Router
          basename="/portal"
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/verify-2fa" element={<TwoFactorVerify />} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

            <Route path="/onboarding" element={<ProtectedRoute requireMerchant><Onboarding /></ProtectedRoute>} />
            <Route path="/onboarding/complete" element={<ProtectedRoute requireMerchant><OnboardingComplete /></ProtectedRoute>} />

            <Route path="/dashboard" element={<ProtectedRoute requireMerchant><Dashboard /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute requireMerchant><Notifications /></ProtectedRoute>} />

            <Route path="/wallet" element={<Navigate to="/wallet/deposit" replace />} />
            <Route path="/wallet/deposit" element={<ProtectedRoute requireMerchant><DepositFunds /></ProtectedRoute>} />

            {/* Transaction routes disabled — Transaction doctype is out of use */}
            {/* <Route path="/transactions" element={<ProtectedRoute requireMerchant><Transactions /></ProtectedRoute>} /> */}
            {/* <Route path="/transactions/:id" element={<ProtectedRoute requireMerchant><TransactionDetail /></ProtectedRoute>} /> */}

            <Route path="/orders" element={<ProtectedRoute requireMerchant><Orders /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute requireMerchant><OrderDetail /></ProtectedRoute>} />

            <Route path="/ledger" element={<ProtectedRoute requireMerchant><Ledger /></ProtectedRoute>} />

            <Route path="/settlements" element={<ProtectedRoute requireMerchant><Settlements /></ProtectedRoute>} />
            <Route path="/settlements/:id" element={<ProtectedRoute requireMerchant><SettlementDetail /></ProtectedRoute>} />

            <Route path="/developers" element={<ProtectedRoute><DevelopersLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/developers/documentation" replace />} />
              <Route path="documentation" element={<Documentation />} />
              <Route path="api-keys" element={<APIKeys />} />
              <Route path="ip-whitelist" element={<IPWhitelist />} />
              <Route path="webhooks" element={<Webhooks />} />
              <Route path="webhooks/:webhookId" element={<WebhookLogs />} />
              {/* Webhook detail temporarily disabled - needs real API integration */}
              {/* <Route path="webhooks/:id" element={<WebhookDetail />} /> */}
              <Route path="logs" element={<APILogs />} />
            </Route>

            {/* <Route path="/settings" element={<SettingsRedirect />} /> */}
            <Route path="/settings/profile" element={<ProtectedRoute requireMerchant><Profile /></ProtectedRoute>} />
            {/* Temporarily commented out */}
            <Route path="/settings/team" element={<ProtectedRoute requireMerchant><Team /></ProtectedRoute>} />
            <Route path="/settings/security" element={<ProtectedRoute requireMerchant><Security /></ProtectedRoute>} />
            {/* <Route path="/settings/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} /> */}

            <Route path="/settings/kyc" element={<ProtectedRoute requireMerchant requireOwner><KYC /></ProtectedRoute>} />

            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/merchants" element={<ProtectedRoute requireAdmin><Merchants /></ProtectedRoute>} />
            <Route path="/admin/merchants/:id" element={<ProtectedRoute requireAdmin><MerchantDetail /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/kyc-reviews" element={<ProtectedRoute requireAdmin><KYCReviews /></ProtectedRoute>} />
            {/* Admin transaction routes disabled — Transaction doctype is out of use */}
            {/* <Route path="/admin/transactions" element={<ProtectedRoute requireAdmin><AdminTransactions /></ProtectedRoute>} /> */}
            {/* <Route path="/admin/transactions/:id" element={<ProtectedRoute requireAdmin><AdminTransactionDetail /></ProtectedRoute>} /> */}
            <Route path="/admin/orders/:id" element={<ProtectedRoute requireAdmin><AdminOrderDetail /></ProtectedRoute>} />
            {/* Risk Alerts and Admin Users temporarily disabled - not implemented with real APIs */}
            {/* <Route path="/admin/risk-alerts" element={<ProtectedRoute requireAdmin><RiskAlerts /></ProtectedRoute>} /> */}
            {/* <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} /> */}
            <Route path="/admin/van-logs" element={<ProtectedRoute requireAdmin><AdminVANLogs /></ProtectedRoute>} />
            <Route path="/admin/settlements/:id" element={<ProtectedRoute requireAdmin><AdminSettlementDetail /></ProtectedRoute>} />
            <Route path="/admin/virtual-accounts" element={<ProtectedRoute requireAdmin><AdminVirtualAccounts /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router >
      </AuthProvider >
    </ToastProvider >
  );
}

export default App;
