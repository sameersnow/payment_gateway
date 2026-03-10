import { useState, useEffect } from 'react';
import { Save, Shield, Activity, RefreshCw, Smartphone, Edit2, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Badge, Modal, useToast, Input, Select } from '../../components/ui';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import { adminMethods } from '../../services/methods';
import { formatCurrency } from '../../utils/formatters';

interface Product {
    name: string;
    product_name: string;
    is_active: number;
}

interface Integration {
    name: string;
    integration_name: string;
    integration_type: string;
    is_active: number;
    balance: number;
    api_endpoint?: string;
    client_id?: string;
    vpa?: string;
    secret_key?: string;
    default?: number;
    product_pricing: Array<{
        product: string;
        fee_type: string;
        fee: number;
        tax_fee_type: string;
        tax_fee: number;
        start_value: number;
        end_value: number;
    }>;
}

interface SecuritySettings {
    session_timeout: string;
    allow_login_after_fail: number;
    allow_consecutive_login_attempts: number;
    allow_password_reset_using_email: number;
}

export function AdminSettings() {
    const { success: showSuccess, error: showError } = useToast();
    const [security, setSecurity] = useState<SecuritySettings>({
        session_timeout: '170:00',
        allow_login_after_fail: 60,
        allow_consecutive_login_attempts: 3,
        allow_password_reset_using_email: 1
    });

    // 2FA state
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [qrCodeData, setQrCodeData] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit Processor Modal States
    const [showEditProcessorModal, setShowEditProcessorModal] = useState(false);
    const [editProcessorData, setEditProcessorData] = useState({
        name: '',
        integration_name: '',
        integration_type: '',
        balance: 0,
        api_endpoint: '',
        client_id: '',
        vpa: '',
        secret_key: '',
        product_pricing: [] as Array<{
            product: string;
        }>,
    });
    const [updatingProcessor, setUpdatingProcessor] = useState(false);
    const [showAddServiceDropdown, setShowAddServiceDropdown] = useState(false);
    const [showClientId, setShowClientId] = useState(false);
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [decryptedSecret, setDecryptedSecret] = useState('');

    const { call: createIntegration } = useFrappePostCall('frappe.client.insert');
    const { call: updateProcessor } = useFrappePostCall('frappe.client.set_value');

    // Call hooks
    const { call: updateProduct } = useFrappePostCall(adminMethods.updateProductStatus);
    const { call: updateIntegration } = useFrappePostCall(adminMethods.updateIntegrationStatus);
    const { call: updateSecurity } = useFrappePostCall(adminMethods.updateSecuritySettings);
    const { call: setup2FA } = useFrappePostCall(adminMethods.setup2FA);
    const { call: disable2FA } = useFrappePostCall(adminMethods.disable2FA);
    const { call: verify2FASetup } = useFrappePostCall(adminMethods.verify2FASetup);
    const { call: fetchIntegrationSecret } = useFrappePostCall(adminMethods.getIntegrationSecret);


    const { data: { message: settingsData } = {}, isLoading: loading, mutate: refetchSettings } = useFrappeGetCall(
        adminMethods.getPlatformSettings,
        {},
        'admin-platform-settings'
    );

    const { data: { message: authStatus } = {}, mutate: refetchAuth } = useFrappeGetCall(
        adminMethods.get2FAStatus,
        {},
        'admin-2fa-status'
    );

    useEffect(() => {
        if (settingsData?.security) {
            setSecurity(settingsData.security);
        }
    }, [settingsData]);

    useEffect(() => {
        if (authStatus) {
            setTwoFactorEnabled(authStatus.enabled);
        }
    }, [authStatus]);

    const products = settingsData?.products || [];
    const integrations = settingsData?.integrations || [];

    const handleEnable2FA = async () => {
        try {
            const result = await setup2FA({});
            if (result.message?.success && result.message?.otpauth_url) {
                setQrCodeData(result.message.otpauth_url);
                setShowQRCode(true);
            } else {
                showError('Error', 'Failed to generate QR code');
            }
        } catch (error: any) {
            console.error('Failed to enable 2FA:', error);
            showError('Error', error.message || 'Failed to enable 2FA');
        }
    };

    const handleDisable2FA = async () => {
        try {
            // Passing empty password assuming backend handles it for admin or doesn't verify strict password yet.
            // Adjust if password prompt required.
            const result = await disable2FA({ password: '' });
            if (result.message?.success) {
                setTwoFactorEnabled(false);
                setShowQRCode(false);
                setQrCodeData('');
                refetchAuth();
                showSuccess('Success', '2FA has been disabled');
            } else {
                showError('Error', result.message?.message || 'Failed to disable 2FA');
            }
        } catch (error: any) {
            console.error('Failed to disable 2FA:', error);
            showError('Error', error.message || 'Failed to disable 2FA');
        }
    };

    const handleVerify2FA = async () => {
        if (!otpCode || otpCode.length !== 6) return;

        try {
            setVerifying(true);
            const result = await verify2FASetup({ otp: otpCode });

            if (result.message?.success) {
                setTwoFactorEnabled(true);
                setShowQRCode(false);
                setOtpCode('');
                refetchAuth();
                showSuccess('Success', 'Two-factor authentication enabled successfully');
            } else {
                showError('Verification Failed', result.message?.message || 'Invalid verification code');
            }
        } catch (error: any) {
            console.error('Failed to verify 2FA:', error);
            showError('Error', error.message || 'Failed to verify 2FA');
        } finally {
            setVerifying(false);
        }
    };

    const handleProductToggle = async (productName: string, currentStatus: number) => {
        try {
            const newStatus = currentStatus === 1 ? 0 : 1;
            const result = await updateProduct({
                product_name: productName,
                is_active: newStatus === 1
            });

            if (result.message?.success) {
                refetchSettings();
            }
        } catch (error) {
            console.error('Failed to update product:', error);
        }
    };

    const handleIntegrationToggle = async (integrationName: string, currentStatus: number) => {
        try {
            const newStatus = currentStatus === 1 ? 0 : 1;
            const result = await updateIntegration({
                integration_name: integrationName,
                is_active: newStatus === 1
            });

            if (result.message?.success) {
                refetchSettings();
            }
        } catch (error) {
            console.error('Failed to update integration:', error);
        }
    };

    const handleSaveSecuritySettings = async () => {
        try {
            setSaving(true);
            const result = await updateSecurity({
                session_timeout: security.session_timeout,
                allow_login_after_fail: security.allow_login_after_fail,
                allow_consecutive_login_attempts: security.allow_consecutive_login_attempts
            });

            if (result.message?.success) {
                showSuccess('Success', 'Security settings updated');
                refetchSettings();
            }
        } catch (error: any) {
            console.error('Failed to save security settings:', error);
            showError('Error', 'Failed to save security settings');
        } finally {
            setSaving(false);
        }
    };

    const handleEditProcessor = (integration: Integration) => {
        setEditProcessorData({
            name: integration.name,
            integration_name: integration.integration_name,
            integration_type: integration.integration_type,
            api_endpoint: integration.api_endpoint || '',
            client_id: integration.client_id || '',
            vpa: integration.vpa || '',
            secret_key: integration.secret_key || '',
            balance: integration.balance || 0,
            product_pricing: integration.product_pricing || [],
        });
        setShowEditProcessorModal(true);
        // Reset decrypted secret when opening modal
        setDecryptedSecret('');
        setShowSecretKey(false);
    };

    const handleToggleSecretVisibility = async () => {
        if (showSecretKey) {
            // Hide secret
            setShowSecretKey(false);
        } else {
            // Fetch and show secret if not already decrypted
            if (!decryptedSecret && editProcessorData.secret_key === '********') {
                try {
                    const result = await fetchIntegrationSecret({
                        integration_name: editProcessorData.name
                    });

                    // Frappe API response is wrapped in 'message' object
                    const data = result.message || result;

                    if (data?.success) {
                        setDecryptedSecret(data.secret_key);
                    } else {
                        showError('Error', data?.error || 'Failed to fetch secret key');
                        return;
                    }
                } catch (error) {
                    showError('Error', 'Failed to fetch secret key');
                    return;
                }
            }
            setShowSecretKey(true);
        }
    };

    const handleSetDefaultProcessor = async (integrationName: string) => {
        try {
            await updateProcessor({
                doctype: 'Integration',
                name: integrationName,
                fieldname: {
                    default: 1
                }
            });
            showSuccess('Success', 'Default processor updated');
            refetchSettings();
        } catch (error) {
            console.error('Failed to set default processor:', error);
            showError('Error', 'Failed to set default processor');
        }
    };


    const handleAddServiceFromDropdown = (productName: string) => {
        // Check if product already exists
        const exists = editProcessorData.product_pricing.some(s => s.product === productName);
        if (exists) {
            showError('Duplicate', 'This product is already added');
            return;
        }

        setEditProcessorData({
            ...editProcessorData,
            product_pricing: [
                ...editProcessorData.product_pricing,
                {
                    product: productName,
                },
            ],
        });
        setShowAddServiceDropdown(false);
    };

    const handleRemoveService = (index: number) => {
        setEditProcessorData({
            ...editProcessorData,
            product_pricing: editProcessorData.product_pricing.filter((_, i) => i !== index),
        });
    };

    const handleAddProcessor = () => {
        setEditProcessorData({
            name: '',
            integration_name: '',
            integration_type: '',
            balance: 0,
            api_endpoint: '',
            client_id: '',
            vpa: '',
            secret_key: '',
            product_pricing: [],
        });
        setShowEditProcessorModal(true);
        setDecryptedSecret('');
        setShowSecretKey(false);
    };

    const handleServiceChange = (index: number, field: string, value: any) => {
        const updatedServices = [...editProcessorData.product_pricing];
        updatedServices[index] = {
            ...updatedServices[index],
            [field]: value,
        };
        setEditProcessorData({
            ...editProcessorData,
            product_pricing: updatedServices,
        });
    };

    const handleUpdateProcessor = async () => {
        if (!editProcessorData.integration_name.trim()) {
            showError('Required', 'Integration name is required');
            return;
        }

        if (!editProcessorData.name && !editProcessorData.integration_type) {
            showError('Required', 'Integration type is required');
            return;
        }

        setUpdatingProcessor(true);
        try {
            let response;

            if (editProcessorData.name) {
                // Update existing
                await updateProcessor({
                    doctype: 'Integration',
                    name: editProcessorData.name,
                    fieldname: {
                        integration_name: editProcessorData.integration_name,
                        api_endpoint: editProcessorData.api_endpoint,
                        client_id: editProcessorData.client_id,
                        vpa: editProcessorData.vpa,
                        ...(editProcessorData.secret_key && { secret_key: editProcessorData.secret_key }),
                        product_pricing: editProcessorData.product_pricing,
                    }
                });
            } else {
                // Create new
                await createIntegration({
                    doc: {
                        doctype: 'Integration',
                        integration_name: editProcessorData.integration_name,
                        integration_type: editProcessorData.integration_type,
                        api_endpoint: editProcessorData.api_endpoint,
                        client_id: editProcessorData.client_id,
                        vpa: editProcessorData.vpa,
                        secret_key: editProcessorData.secret_key,
                        product_pricing: editProcessorData.product_pricing,
                        is_active: 1,
                        balance: 0
                    }
                });
            }

            // If we reached here, operation was successful (frappe-react-sdk usually throws on error)
            showSuccess('Success', editProcessorData.name ? 'Processor updated successfully!' : 'Processor created successfully!');
            setShowEditProcessorModal(false);
            refetchSettings();

        } catch (err: any) {
            console.error('Error saving processor:', err);
            // Check if error response contains messages
            const message = err.message || (editProcessorData.name ? 'Failed to update processor' : 'Failed to create processor');
            showError('Error', message);
        } finally {
            setUpdatingProcessor(false);
        }
    };


    const getIntegrationBadgeVariant = (type: string) => {
        switch (type) {
            case 'Payment Gateway': return 'primary';
            case 'UPI': return 'success';
            case 'Wallet': return 'warning';
            case 'Bank Transfer': return 'info';
            default: return 'slate';
        }
    };

    if (loading) {
        return (
            <DashboardLayout isAdmin>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Loading settings...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout isAdmin>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Platform Settings</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Configure global products, integrations, and security policies
                        </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => refetchSettings()}>
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Security Policies */}
                        <Card>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-slate-900">Security Policies</h3>
                                    <p className="text-sm text-slate-500">System security and authentication settings</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Session Timeout (hours)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={security.session_timeout}
                                        onChange={(e) => setSecurity({ ...security, session_timeout: e.target.value })}
                                        placeholder="170:00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Login Retry After Fail (seconds)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={security.allow_login_after_fail}
                                        onChange={(e) => setSecurity({ ...security, allow_login_after_fail: parseInt(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Max Consecutive Login Attempts
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={security.allow_consecutive_login_attempts}
                                        onChange={(e) => setSecurity({ ...security, allow_consecutive_login_attempts: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button onClick={handleSaveSecuritySettings} disabled={saving}>
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Saving...' : 'Save Policies'}
                                </Button>
                            </div>
                        </Card>

                        {/* Two-Factor Authentication */}
                        <Card>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <Smartphone className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-slate-900">Two-Factor Authentication</h3>
                                    <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Enable 2FA</p>
                                        <p className="text-xs text-slate-500 mt-1">Secure your account with time-based one-time passwords</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={twoFactorEnabled}
                                            onChange={(e) => e.target.checked ? handleEnable2FA() : handleDisable2FA()}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>

                            </div>
                        </Card>

                        {/* Global Products */}
                        <Card>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-slate-900">Global Products</h3>
                                    <p className="text-sm text-slate-500">Platform-wide product availability</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {products.map((product: Product) => (
                                    <div
                                        key={product.name}
                                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{product.product_name}</p>
                                            <p className="text-xs text-slate-500">Product configuration</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={product.is_active === 1}
                                                onChange={() => handleProductToggle(product.name, product.is_active)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Payment Processors */}
                    <div className="space-y-6">
                        <Card>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-slate-900">Payment Processors</h3>
                                        <p className="text-sm text-slate-500">Manage processor integrations</p>
                                    </div>
                                </div>
                                <Button variant="secondary" size="sm" className="h-8 w-8 px-0 py-0" onClick={handleAddProcessor}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {integrations.map((integration: Integration) => (
                                    <div
                                        key={integration.name}
                                        className="p-4 border border-slate-200 rounded-lg"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-slate-900">{integration.integration_name}</p>
                                                    {integration.default === 1 && (
                                                        <Badge variant="success" size="sm">Default</Badge>
                                                    )}
                                                </div>
                                                <div className="mt-1">
                                                    <Badge variant={getIntegrationBadgeVariant(integration.integration_type)}>
                                                        {integration.integration_type}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={integration.is_active === 1}
                                                    onChange={() => handleIntegrationToggle(integration.name, integration.is_active)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div className="pt-3 border-t border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-500">Available Balance</span>
                                                <span className="text-sm font-semibold text-slate-900">
                                                    {formatCurrency(integration.balance || 0)}
                                                </span>
                                            </div>
                                        </div>

                                        {integration.product_pricing && integration.product_pricing.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                <p className="text-xs font-medium text-slate-500 mb-2">Services</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {integration.product_pricing.map((pricing: any, idx: number) => (
                                                        <Badge key={idx} variant="slate">
                                                            {pricing.product}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleEditProcessor(integration)}
                                                className="flex-1"
                                            >
                                                <Edit2 className="w-3.5 h-3.5 mr-2" />
                                                Edit
                                            </Button>
                                            {integration.default !== 1 && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleSetDefaultProcessor(integration.name)}
                                                    className="flex-1"
                                                >
                                                    Set as Default
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* 2FA Setup Modal */}
            <Modal
                isOpen={showQRCode}
                onClose={() => {
                    setShowQRCode(false);
                    setQrCodeData('');
                    setTwoFactorEnabled(false); // Reset toggle if cancelled
                }}
                title="Two-Factor Authentication"
                description="Secure your account with time-based one-time passwords"
            >
                <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                        {qrCodeData ? (
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`}
                                alt="QR Code"
                                className="w-48 h-48 border border-slate-200 rounded-lg"
                            />
                        ) : (
                            <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
                                Loading...
                            </div>
                        )}
                    </div>

                    <div className="text-center mb-4">
                        <p className="text-sm text-slate-600 mb-2">
                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Verification Code
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter 6-digit code"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                            <Button
                                onClick={handleVerify2FA}
                                disabled={verifying || otpCode.length !== 6}
                            >
                                {verifying ? 'Verifying...' : 'Verify & Enable'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Edit Processor Modal */}
            <Modal
                isOpen={showEditProcessorModal}
                onClose={() => setShowEditProcessorModal(false)}
                title={editProcessorData.name ? "Edit Processor" : "Add Processor"}
                description={editProcessorData.name ? `Update configuration for ${editProcessorData.integration_name}` : "Create a new payment processor integration"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Integration Name <span className="text-error-600">*</span>
                        </label>
                        <Input
                            value={editProcessorData.integration_name}
                            onChange={(e) => setEditProcessorData({ ...editProcessorData, integration_name: e.target.value })}
                            placeholder="Enter integration name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Integration Type <span className="text-error-600">*</span>
                        </label>
                        <Select
                            value={editProcessorData.integration_type}
                            onChange={(e) => setEditProcessorData({ ...editProcessorData, integration_type: e.target.value })}
                            options={[
                                { value: '', label: 'Select Type' },
                                { value: 'Payment Gateway', label: 'Payment Gateway' },
                                { value: 'UPI', label: 'UPI' },
                                { value: 'Wallet', label: 'Wallet' },
                                { value: 'Bank Transfer', label: 'Bank Transfer' },
                            ]}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            API Endpoint
                        </label>
                        <Input
                            type="url"
                            value={editProcessorData.api_endpoint}
                            onChange={(e) => setEditProcessorData({ ...editProcessorData, api_endpoint: e.target.value })}
                            placeholder="https://api.example.com"
                        />
                        {editProcessorData.api_endpoint && (
                            <p className="text-xs text-slate-500 mt-1">Current: {editProcessorData.api_endpoint}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            VPA
                        </label>
                        <Input
                            value={editProcessorData.vpa}
                            onChange={(e) => setEditProcessorData({ ...editProcessorData, vpa: e.target.value })}
                            placeholder="username@upi"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Client ID
                        </label>
                        <div className="relative">
                            <Input
                                type={showClientId ? "text" : "password"}
                                value={editProcessorData.client_id}
                                onChange={(e) => setEditProcessorData({ ...editProcessorData, client_id: e.target.value })}
                                placeholder="Enter client ID"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowClientId(!showClientId)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showClientId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Secret Key
                        </label>
                        <div className="relative">
                            <Input
                                type={showSecretKey ? "text" : "password"}
                                value={showSecretKey && decryptedSecret
                                    ? decryptedSecret
                                    : editProcessorData.secret_key
                                }
                                onChange={(e) => setEditProcessorData({ ...editProcessorData, secret_key: e.target.value })}
                                placeholder="Leave blank to keep current"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={handleToggleSecretVisibility}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Leave blank to keep the current secret key</p>
                    </div>

                    {/* Services Section */}
                    <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-slate-700">
                                Services
                            </label>
                            <div className="relative">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowAddServiceDropdown(!showAddServiceDropdown)}
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Add Service
                                </Button>

                                {showAddServiceDropdown && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowAddServiceDropdown(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-20 max-h-60 overflow-y-auto">
                                            {products
                                                .filter((p: Product) => !editProcessorData.product_pricing.some(s => s.product === p.name))
                                                .map((product: Product) => (
                                                    <button
                                                        key={product.name}
                                                        onClick={() => handleAddServiceFromDropdown(product.name)}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
                                                    >
                                                        {product.product_name}
                                                    </button>
                                                ))}
                                            {products.filter((p: Product) => !editProcessorData.product_pricing.some(s => s.product === p.name)).length === 0 && (
                                                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                                    All products added
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {editProcessorData.product_pricing.length === 0 ? (
                            <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-sm text-slate-500">No services configured</p>
                                <p className="text-xs text-slate-400 mt-1">Click "Add Service" to add products</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {editProcessorData.product_pricing.map((service, index) => {
                                    const product = products.find((p: Product) => p.name === service.product);
                                    return (
                                        <div
                                            key={index}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full border border-primary-200"
                                        >
                                            <span className="text-sm font-medium">
                                                {product?.product_name || service.product}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveService(index)}
                                                className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>


                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <Button
                            variant="secondary"
                            onClick={() => setShowEditProcessorModal(false)}
                            disabled={updatingProcessor}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpdateProcessor}
                            disabled={updatingProcessor || !editProcessorData.integration_name || (!editProcessorData.name && !editProcessorData.integration_type)}
                        >
                            {updatingProcessor ? 'Saving...' : (editProcessorData.name ? 'Update Processor' : 'Create Processor')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
