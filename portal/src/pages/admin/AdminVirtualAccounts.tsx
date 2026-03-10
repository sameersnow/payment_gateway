import { useState } from 'react';
import { Search, Calendar } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge, Button } from '../../components/ui';
import { formatDate } from '../../utils/formatters';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { adminMethods } from '../../services/methods';

function getStatusBadge(status: string) {
    switch (status?.toLowerCase()) {
        case 'active':
            return <Badge variant="success" dot>Active</Badge>;
        case 'inactive':
            return <Badge variant="slate" dot>Inactive</Badge>;
        case 'suspended':
            return <Badge variant="warning" dot>Suspended</Badge>;
        default:
            return <Badge variant="slate" dot>{status}</Badge>;
    }
}

export function AdminVirtualAccounts() {
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    // Fetch virtual accounts with SDK
    const { data: { message: accountsData } = {}, isLoading: loading } = useFrappeGetCall(
        adminMethods.getVirtualAccounts,
        {
            page,
            page_size: pageSize
        },
        `admin-virtual-accounts-${page}`
    );

    const accounts = accountsData?.accounts || [];
    const totalCount = accountsData?.total || 0;

    // Filter by search query on frontend
    const filteredAccounts = accounts.filter((account: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            account.account_number?.toLowerCase().includes(query) ||
            account.ifsc?.toLowerCase().includes(query) ||
            account.merchant_name?.toLowerCase().includes(query)
        );
    });

    return (
        <DashboardLayout isAdmin>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Virtual Accounts</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Manage virtual accounts across all merchants
                        </p>
                    </div>
                    <Button variant="secondary" size="sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        Download CSV
                    </Button>
                </div>

                <Card>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Account number, IFSC, merchant..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        />
                    </div>
                </Card>

                <Card padding="none">
                    {loading ? (
                        <div className="p-12 text-center">
                            <p className="text-sm text-slate-500">Loading virtual accounts...</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Account Details
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Merchant
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Bank
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Created
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredAccounts.map((account: any, index: number) => (
                                            <tr key={account.id || index} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-mono text-slate-900">{account.account_number}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">IFSC: {account.ifsc}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-900 font-medium">{account.merchant_name || 'Unknown'}</p>
                                                    <p className="text-xs text-slate-500">{account.merchant_id}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-600">{account.bank_name || 'N/A'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(account.status)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-500">{formatDate(account.date)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredAccounts.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                                        <Search className="w-8 h-8 mb-2 opacity-20" />
                                                        <p className="text-sm font-medium">No virtual accounts found</p>
                                                        <p className="text-xs">Try adjusting your search query</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                                <p className="text-sm text-slate-500 font-medium">
                                    Showing {filteredAccounts.length} of {totalCount} accounts
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={page * pageSize >= totalCount}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
