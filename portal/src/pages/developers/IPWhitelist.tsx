
import { useState } from 'react';
import { Card, Button, Modal, Input, Label } from '../../components/ui';
import { Shield, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useIPWhitelist } from '../../hooks';

export function IPWhitelist() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newIP, setNewIP] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [ipToDelete, setIpToDelete] = useState<{ name: string; ip: string } | null>(null);

    // Use the new SDK hook
    const {
        whitelistedIPs,
        addWhitelistedIP,
        deleteWhitelistedIP,
    } = useIPWhitelist();

    const handleAddIP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIP) return;

        setIsSubmitting(true);
        try {
            await addWhitelistedIP({ ip_address: newIP });
            setNewIP('');
            setIsAddModalOpen(false);
        } catch (error: any) {
            // Error already shown by hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteIP = async (ipName: string, ipAddress: string) => {
        setIpToDelete({ name: ipName, ip: ipAddress });
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!ipToDelete) return;

        try {
            await deleteWhitelistedIP(ipToDelete.name);
            setDeleteConfirmOpen(false);
            setIpToDelete(null);
        } catch (error: any) {
            // Error already shown by hook
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium text-slate-900">IP Whitelist</h2>
                    <p className="text-sm text-slate-500">
                        Manage valid IP addresses that can access your API
                    </p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add IP Address
                </Button>
            </div>

            <Card>
                {!whitelistedIPs || whitelistedIPs.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No Whitelisted IPs</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                            You haven't whitelisted any IP addresses yet. Access might be restricted depending on your security settings.
                        </p>
                        <Button onClick={() => setIsAddModalOpen(true)} variant="secondary">
                            Add IP Address
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        IP Address
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Added On
                                    </th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {whitelistedIPs.map((ip: any) => (
                                    <tr key={ip.name} className="group hover:bg-slate-50/50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Shield className="w-4 h-4 text-slate-600" />
                                                </div>
                                                <span className="font-mono text-sm text-slate-700">{ip.whitelisted_ip}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-slate-500">
                                                {new Date(ip.creation).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteIP(ip.name, ip.whitelisted_ip)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                    <h4 className="text-sm font-medium text-blue-900">Security Note</h4>
                    <p className="text-sm text-blue-700 mt-1">
                        Requests from non-whitelisted IP addresses will be blocked. Ensure you add your server's static IP address here.
                    </p>
                </div>
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add IP Address"
            >
                <form onSubmit={handleAddIP} className="space-y-4">
                    <div>
                        <Label htmlFor="ip">IP Address</Label>
                        <Input
                            id="ip"
                            placeholder="e.g. 192.168.1.1"
                            value={newIP}
                            onChange={(e) => setNewIP(e.target.value)}
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Enter a valid IPv4 address.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsAddModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" loading={isSubmitting}>
                            Add IP Address
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={deleteConfirmOpen}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setIpToDelete(null);
                }}
                title="Remove IP Address"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-700">
                                Are you sure you want to remove the IP address{' '}
                                <span className="font-mono font-semibold text-slate-900">{ipToDelete?.ip}</span>?
                            </p>
                            <p className="text-sm text-slate-500 mt-2">
                                Requests from this IP address will be blocked after removal.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setDeleteConfirmOpen(false);
                                setIpToDelete(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={confirmDelete}
                        >
                            Remove IP
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
