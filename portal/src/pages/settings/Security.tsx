import { useState, useEffect } from 'react';
import { Lock, Smartphone, Monitor, MapPin, Clock, LogOut, Shield, Key } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Input, Badge, Modal, useToast } from '../../components/ui';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import { merchantMethods } from '../../services';

export function Security() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  // 2FA State
  const [qrCode, setQrCode] = useState('');
  const [qrSecret, setQrSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [setupStep, setSetupStep] = useState<'intro' | 'scan' | 'verify'>('intro');
  const [manageStep, setManageStep] = useState<'view' | 'disable'>('view');
  const [disablePassword, setDisablePassword] = useState('');

  const { success, error: toastError } = useToast();

  // Fetch Security Status
  const { data: { message: statusData } = {}, mutate: refetchStatus } = useFrappeGetCall(
    merchantMethods.getSecurityStatus,
    undefined,
    'security-status'
  );

  // Fetch logs
  const { data: { message: logsResponse } = {}, mutate: refetchLogs } = useFrappeGetCall(
    merchantMethods.getSecurityLogs,
    undefined,
    'security-logs'
  );

  const logs = logsResponse?.logs || [];
  const twoFactorEnabled = statusData?.two_factor_enabled || false;
  const lastPasswordUpdate = statusData?.password_last_update;

  // Actions
  const { call: changePassword } = useFrappePostCall(merchantMethods.changePassword);
  const { call: setup2FA } = useFrappePostCall(merchantMethods.setup2FA);
  const { call: verify2FA } = useFrappePostCall(merchantMethods.verify2FA);
  const { call: disable2FACall } = useFrappePostCall(merchantMethods.disable2FA);


  const handlePasswordUpdate = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toastError('Error', "Passwords do not match");
      return;
    }
    if (passwordData.new.length < 8) {
      toastError('Error', "Password must be at least 8 characters");
      return;
    }

    try {
      const response = await changePassword({
        current_password: passwordData.current,
        new_password: passwordData.new
      });

      const res = response.message;

      if (!res || !res.success) {
        throw new Error(res?.message || 'Failed to change password');
      }

      success('Password Updated', 'Your password has been changed successfully');
      setShowPasswordModal(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      refetchStatus();
      refetchLogs();
    } catch (err: any) {
      toastError('Update Failed', err.message || 'Could not update password');
    }
  };

  const start2FASetup = async () => {
    try {
      const response = await setup2FA({});
      const res = response.message;

      if (res && res.otpauth_url) {
        setQrCode(res.otpauth_url);
        setQrSecret(res.secret);
        setSetupStep('scan');
        setShow2FAModal(true);
      } else {
        toastError('Error', 'Could not get QR code');
      }
    } catch (err: any) {
      toastError('Error', 'Could not start 2FA setup');
    }
  };

  const verifyAndEnable2FA = async () => {
    try {
      const response = await verify2FA({
        token: verificationCode
      });
      const res = response.message;

      if (res && res.success) {
        success('2FA Enabled', 'Two-factor authentication is now active');
        setShow2FAModal(false);
        setVerificationCode('');
        setSetupStep('intro');
        refetchStatus();
        refetchLogs();
      } else {
        toastError('Verification Failed', res?.message || 'Invalid code');
      }
    } catch (err: any) {
      toastError('Error', err.message);
    }
  };

  const disable2FA = async () => {
    try {
      await disable2FACall({
        password: disablePassword
      });

      success('2FA Disabled', 'Two-factor authentication has been turned off');
      setShow2FAModal(false);
      setDisablePassword('');
      setManageStep('view');
      refetchStatus();
      refetchLogs();
    } catch (err: any) {
      toastError('Error', err.message || 'Incorrect password');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Security</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your account security settings
          </p>
        </div>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Password</p>
                <p className="text-xs text-slate-500">
                  {lastPasswordUpdate ? `Last changed ${formatRelativeTime(lastPasswordUpdate)}` : 'Last changed never'}
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
              Change password
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${twoFactorEnabled ? 'bg-success-100' : 'bg-slate-100'
                }`}>
                <Smartphone className={`w-5 h-5 ${twoFactorEnabled ? 'text-success-600' : 'text-slate-600'
                  }`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">Two-factor authentication</p>
                  {twoFactorEnabled && <Badge variant="success">Enabled</Badge>}
                </div>
                <p className="text-xs text-slate-500">
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>
            <Button
              variant={twoFactorEnabled ? 'secondary' : 'primary'}
              onClick={() => {
                if (twoFactorEnabled) {
                  setManageStep('view');
                  setShow2FAModal(true);
                } else {
                  start2FASetup();
                }
              }}
            >
              {twoFactorEnabled ? 'Manage' : 'Enable'}
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-slate-900 mb-4">Login History</h3>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No activity logs found.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${log.status === 'Success' || log.status === 'Success' ? 'bg-success-500' : 'bg-slate-400'
                      }`} />
                    <div>
                      <p className="text-sm text-slate-900">{log.operation || "Login"}</p>
                      <p className="text-xs text-slate-500">{log.ip} • {log.device || "Web"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">
                      {formatDateTime(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        description="Enter your current password and choose a new one"
      >
        <div className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={passwordData.current}
            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
          />
          <Input
            label="New password"
            type="password"
            value={passwordData.new}
            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
            hint="Must be at least 8 characters"
          />
          <Input
            label="Confirm new password"
            type="password"
            value={passwordData.confirm}
            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordUpdate}>
              Update password
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2FA Modal */}
      <Modal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        title="Two-Factor Authentication"
        description={twoFactorEnabled ? 'Manage your 2FA settings' : 'Set up 2FA for your account'}
      >
        <div className="space-y-6">
          {!twoFactorEnabled ? (
            <>
              {setupStep === 'scan' && (
                <div className="text-center">
                  <div className="p-4 bg-slate-50 rounded-lg inline-block mb-4">
                    {qrCode ? (
                      <div className="bg-white p-2">
                        {/* Use an QRCode lib or image if backend returns XML/SVG. 
                                 Wait, frappe returns otpauth url. We need to render it.
                                 For simplicity we can prompt user to use key or use a library.
                                 Let's assume we don't have a QR lib installed.
                                 "frappe.twofactor.get_qr_svg_url"? No that returns base64 image often.
                                 Let's check if we can just show the secret for now or basic text.
                                 
                                 Actually for polished look, we might need 'qrcode.react' or similar.
                                 Checking package.json? No access.
                                 
                                 I'll use a simple external QR API for this demo or just show the code?
                                 Showing code is safer if no dependencies.
                                 
                                 But wait, `setup_2fa` in python returned `otpauth_url`.
                                 I'll use a public QR generator for the demo or just text.
                                 
                                 Let's try to fetch a QR image from google charts or similar? 
                                 Or just display the text key clearly.
                             */}
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCode)}`} alt="QR Code" />
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-slate-200 animate-pulse"></div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    Scan with Google Authenticator or Authy
                  </p>
                  <p className="text-xs font-mono bg-slate-100 p-2 rounded">
                    Secret: {qrSecret}
                  </p>
                </div>
              )}

              <Input
                label="Verification code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShow2FAModal(false)}>
                  Cancel
                </Button>
                <Button onClick={verifyAndEnable2FA} disabled={!verificationCode}>
                  Verify & Enable
                </Button>
              </div>
            </>
          ) : (
            // Manage Mode
            manageStep === 'view' ? (
              <>
                <div className="p-4 bg-success-50 border border-success-200 rounded-lg flex items-center gap-3">
                  <Shield className="w-5 h-5 text-success-600" />
                  <div>
                    <p className="text-sm font-medium text-success-800">2FA is enabled</p>
                    <p className="text-xs text-success-700">Your account is secure.</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="danger" onClick={() => setManageStep('disable')}>
                    Disable 2FA
                  </Button>
                </div>
              </>
            ) : (
              // Disable confirm
              <>
                <p className="text-sm text-slate-600 mb-4">
                  Please enter your password to disable Two-Factor Authentication.
                </p>
                <Input
                  type="password"
                  label="Current Password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                />
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="secondary" onClick={() => setManageStep('view')}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={disable2FA} disabled={!disablePassword}>
                    Confirm Disable
                  </Button>
                </div>
              </>
            )
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
