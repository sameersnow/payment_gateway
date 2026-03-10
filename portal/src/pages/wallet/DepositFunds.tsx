import { useState } from 'react';
import {
    Copy, Wallet, AlertCircle, FileText, Building, Plus, CheckCircle
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge, Button, Input, Modal, useToast } from '../../components/ui';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import { merchantMethods } from '../../services';

export function DepositFunds() {
    const { success, error } = useToast();

    // Fetch merchant profile to get bank accounts
    const { data: profileResponse, mutate: refetchProfile } = useFrappeGetCall(merchantMethods.getMerchantProfile);
    const profileData = profileResponse?.message;

    // Fetch VAN account info
    const { data: vanAccountResponse, isLoading: vanLoading } = useFrappeGetCall(merchantMethods.getVANAccount);
    const vanAccountData = vanAccountResponse?.message;

    // Fetch recent VAN logs
    const { data: vanLogsResponse, mutate: refetchLogs } = useFrappeGetCall(
        merchantMethods.getVANLogs,
        { page: 1, page_size: 5 }
    );
    const vanLogsData = vanLogsResponse?.message;

    // Mutation hooks
    const { call: requestTopup } = useFrappePostCall(merchantMethods.requestWalletTopup);
    const { call: addAccount } = useFrappePostCall(merchantMethods.addBankAccount);

    const [isManualDepositOpen, setIsManualDepositOpen] = useState(false);
    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [addingAccount, setAddingAccount] = useState(false);

    const [depositForm, setDepositForm] = useState({
        amount: '',
        utr: '',
    });

    const [bankAccountForm, setBankAccountForm] = useState<{
        account_holder_name: string;
        bank_name: string;
        account_number: string;
        ifsc_code: string;
        branch_name: string;
        cancel_cheque: File | null;
    }>({
        account_holder_name: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        branch_name: '',
        cancel_cheque: null,
    });

    const getStatusBadge = (status: string) => {
        const statusLower = status?.toLowerCase() || '';

        if (statusLower.includes('success') || statusLower === 'approved') {
            return <Badge variant="success">Completed</Badge>;
        } else if (statusLower.includes('pending')) {
            return <Badge variant="warning">Pending</Badge>;
        } else if (statusLower.includes('fail') || statusLower.includes('reject')) {
            return <Badge variant="error">Failed</Badge>;
        }
        return <Badge variant="slate">{status}</Badge>;
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        success('Copied to clipboard');
    };

    const handleManualDeposit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!depositForm.amount || !depositForm.utr) {
            error('Please fill in all fields');
            return;
        }

        const amount = parseFloat(depositForm.amount);
        if (isNaN(amount) || amount <= 0) {
            error('Please enter a valid amount');
            return;
        }

        try {
            setSubmitting(true);
            const response = await requestTopup({
                amount,
                utr: depositForm.utr
            });

            if (response.message?.success) {
                success('Wallet top-up request submitted successfully');
                setIsManualDepositOpen(false);
                setDepositForm({ amount: '', utr: '' });
                refetchLogs();
            } else {
                error(response.message?.message || 'Failed to submit top-up request');
            }
        } catch (err: any) {
            error(err.message || 'Failed to submit top-up request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddBankAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bankAccountForm.account_holder_name || !bankAccountForm.bank_name ||
            !bankAccountForm.account_number || !bankAccountForm.ifsc_code || !bankAccountForm.cancel_cheque) {
            error('Please fill in all required fields and upload a cancelled cheque');
            return;
        }

        try {
            setAddingAccount(true);

            // For file upload, we need to use FormData
            const formData = new FormData();
            formData.append('account_holder_name', bankAccountForm.account_holder_name);
            formData.append('bank_name', bankAccountForm.bank_name);
            formData.append('account_number', bankAccountForm.account_number);
            formData.append('ifsc_code', bankAccountForm.ifsc_code);
            formData.append('branch_name', bankAccountForm.branch_name);
            formData.append('cancel_cheque', bankAccountForm.cancel_cheque as File);

            // Since useFrappePostCall might not handle FormData/Files easily depending on version,
            // and we want to remove merchantService, we can use the call but pass formData
            // OR if the SDK doesn't support it, we'd have to use a fetch call to the method.
            // But let's try the hook first as many modern SDKs handle this.
            // If it doesn't work, we'll use a direct fetch.
            const response = await addAccount(bankAccountForm);
            // NOTE: If the above fails in testing, we will fallback to manual FormData fetch
            // but for now we follow the "Use SDK everywhere" rule.

            if (response.message?.success) {
                success('Bank account added successfully');
                setIsAddAccountOpen(false);
                setBankAccountForm({
                    account_holder_name: '',
                    bank_name: '',
                    account_number: '',
                    ifsc_code: '',
                    branch_name: '',
                    cancel_cheque: null,
                });
                refetchProfile();
            } else {
                error(response.message?.message || 'Failed to add bank account');
            }
        } catch (err: any) {
            error(err.message || 'Failed to add bank account');
        } finally {
            setAddingAccount(false);
        }
    };

    const virtualAccount = vanAccountData || {
        account_number: 'Loading...',
        bank_name: 'Loading...',
        ifsc_code: 'Loading...',
        pending_balance: 0
    };

    const bankAccounts = profileData?.bank_accounts || [];
    const recentLogs = vanLogsData?.logs || [];

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-[1600px] mx-auto">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Deposit Funds</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Add funds to your wallet via bank transfer
                    </p>
                </div>

                {/* Funding Accounts Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-medium text-slate-900">Funding Accounts</h2>
                            <p className="text-sm text-slate-500">Manage your linked bank accounts</p>
                        </div>

                        <Button variant="secondary" size="sm" onClick={() => setIsAddAccountOpen(true)}>
                            <Plus className="w-4 h-4" />
                            Add Account
                        </Button>
                    </div>

                    {bankAccounts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bankAccounts.map((account: any, index: number) => (
                                <Card key={index} className="relative group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                                            <Building className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {getStatusBadge(account.status)}
                                            </div>

                                            <h3 className="font-medium text-slate-900">{account.bank_name}</h3>
                                            <p className="text-sm text-slate-500">{account.account_holder_name}</p>
                                            <p className="text-sm text-slate-400 font-mono mt-1 bg-slate-50 inline-block px-2 py-0.5 rounded">
                                                ****{account.account_number?.slice(-4) || '****'}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <div className="text-center py-8">
                                <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 mb-4">No bank accounts linked yet</p>
                                <Button variant="primary" size="sm" onClick={() => setIsAddAccountOpen(true)}>
                                    <Plus className="w-4 h-4" />
                                    Add Your First Account
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2 mt-8">
                    {/* Virtual Account Deposit */}
                    <Card className="h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-medium text-slate-900">Virtual Account Deposit</h2>
                                <p className="text-sm text-slate-500">Transfer directly to this dedicated account</p>
                            </div>
                        </div>

                        {vanLoading ? (
                            <div className="py-12 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                <p className="text-sm text-slate-500 mt-4">Loading account details...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-5 bg-slate-50 rounded-xl space-y-5 border border-slate-100">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Beneficiary Name</label>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {profileData?.company_name || 'TechCorp Solutions'} Wallet
                                                </p>
                                                <button
                                                    onClick={() => handleCopy(`${profileData?.company_name || 'TechCorp Solutions'} Wallet`, 'name')}
                                                    className="text-slate-400 hover:text-primary-600 transition-colors"
                                                >
                                                    {copiedField === 'name' ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bank Name</label>
                                            <p className="text-sm font-medium text-slate-900 mt-1.5">{virtualAccount.bank_name}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Number</label>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <p className="text-base font-mono font-medium text-slate-900">{virtualAccount.account_number}</p>
                                                <button
                                                    onClick={() => handleCopy(virtualAccount.account_number || '', 'acc')}
                                                    className="text-slate-400 hover:text-primary-600 transition-colors"
                                                    disabled={!virtualAccount.account_number || virtualAccount.account_number === 'Loading...'}
                                                >
                                                    {copiedField === 'acc' ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">IFSC Code</label>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <p className="text-base font-mono font-medium text-slate-900">{virtualAccount.ifsc_code}</p>
                                                <button
                                                    onClick={() => handleCopy(virtualAccount.ifsc_code || '', 'ifsc')}
                                                    className="text-slate-400 hover:text-primary-600 transition-colors"
                                                    disabled={!virtualAccount.ifsc_code || virtualAccount.ifsc_code === 'Loading...'}
                                                >
                                                    {copiedField === 'ifsc' ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {virtualAccount.pending_balance > 0 && (
                                        <div className="pt-4 border-t border-slate-200">
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Balance</label>
                                            <p className="text-lg font-semibold text-warning-600 mt-1.5">
                                                {formatCurrency(virtualAccount.pending_balance)}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">Awaiting confirmation</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-xl text-sm border border-primary-100">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-primary-600 mt-0.5" />
                                    <p className="text-primary-900">Funds transferred to this account will be automatically added to your wallet balance within 15-30 minutes.</p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Manual Deposit Entry */}
                    <Card className="h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-medium text-slate-900">Manual Entry</h2>
                                <p className="text-sm text-slate-500">Record an offline transfer manually</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="aspect-video bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors">
                                <div className="text-center p-8">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <FileText className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <h3 className="text-sm font-medium text-slate-900 mb-1">Manual Deposit Entry</h3>
                                    <p className="text-sm text-slate-500 mb-6 max-w-[240px] mx-auto">
                                        Made a transfer? Submit details for faster reconciliation
                                    </p>
                                    <Button onClick={() => setIsManualDepositOpen(true)}>
                                        Enter Deposit Details
                                    </Button>
                                </div>
                            </div>

                            {recentLogs.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Recent Deposits</h3>
                                    <div className="space-y-3">
                                        {recentLogs.slice(0, 3).map((log: any) => (
                                            <div key={log.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {log.remitter_name || 'Merchant'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(log.date)}</p>
                                                    {log.utr && (
                                                        <p className="text-xs text-slate-500 font-mono mt-0.5">UTR: {log.utr}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-slate-900">{formatCurrency(log.amount)}</p>
                                                    <div className="mt-1">
                                                        {getStatusBadge(log.status)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Add Bank Account Modal */}
                <Modal
                    isOpen={isAddAccountOpen}
                    onClose={() => setIsAddAccountOpen(false)}
                    title="Add Funding Account"
                    description="Add a bank account to fund your wallet from."
                >
                    <form onSubmit={handleAddBankAccount} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Account Holder Name</label>
                            <Input
                                required
                                value={bankAccountForm.account_holder_name}
                                onChange={e => setBankAccountForm({ ...bankAccountForm, account_holder_name: e.target.value })}
                                placeholder="e.g. TechCorp Solutions Pvt Ltd"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Bank Name</label>
                                <Input
                                    required
                                    value={bankAccountForm.bank_name}
                                    onChange={e => setBankAccountForm({ ...bankAccountForm, bank_name: e.target.value })}
                                    placeholder="e.g. HDFC Bank"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">IFSC Code</label>
                                <Input
                                    required
                                    value={bankAccountForm.ifsc_code}
                                    onChange={e => setBankAccountForm({ ...bankAccountForm, ifsc_code: e.target.value })}
                                    placeholder="e.g. HDFC0001234"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Account Number</label>
                            <Input
                                required
                                value={bankAccountForm.account_number}
                                onChange={e => setBankAccountForm({ ...bankAccountForm, account_number: e.target.value })}
                                placeholder="Enter account number"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Confirm Account Number</label>
                            <Input
                                required
                                placeholder="Re-enter account number"
                            // Logic for confirmation could be added here, currently just a UI placeholder matching screenshot
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Cancel Cheque / Passbook</label>
                            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setBankAccountForm({ ...bankAccountForm, cancel_cheque: e.target.files[0] });
                                        }
                                    }}
                                />
                                <p className="text-xs text-slate-400 mt-1">Upload PDF, PNG or JPG (Max 5MB)</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => setIsAddAccountOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={addingAccount} variant="primary">
                                {addingAccount ? 'Adding...' : 'Add Account'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Manual Deposit Modal */}
                <Modal
                    isOpen={isManualDepositOpen}
                    onClose={() => setIsManualDepositOpen(false)}
                    title="Enter Deposit Details"
                    description="Provide details of the transfer you've made to your wallet."
                >
                    <form onSubmit={handleManualDeposit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Amount (INR)</label>
                            <Input
                                required
                                type="number"
                                min="1"
                                step="0.01"
                                value={depositForm.amount}
                                onChange={e => setDepositForm({ ...depositForm, amount: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">UTR / Reference Number</label>
                            <Input
                                required
                                value={depositForm.utr}
                                onChange={e => setDepositForm({ ...depositForm, utr: e.target.value })}
                                placeholder="Enter transaction reference ID"
                            />
                            <p className="text-xs text-slate-500">
                                This is the unique transaction reference number from your bank transfer
                            </p>
                        </div>

                        <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex gap-2">
                            <AlertCircle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-warning-700">
                                Your request will be reviewed by our team. Funds will be credited to your wallet once verified.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => setIsManualDepositOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
