import { useState } from 'react';
import { Plus, MoreVertical, Mail, Trash2, Shield, UserCheck, ShieldAlert } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Badge, Avatar, Modal, Input, Dropdown, DropdownItem, DropdownSeparator } from '../../components/ui';
import { adminUsers } from '../../data/mockData';
import { formatDateTime } from '../../utils/formatters';

const adminRoles = [
    { value: 'super_admin', label: 'Super Admin', description: 'Full system access and configuration' },
    { value: 'admin', label: 'Admin', description: 'General administration and merchant management' },
    { value: 'operator', label: 'Operator', description: 'Manage transactions and basic merchant updates' },
    { value: 'support', label: 'Support', description: 'Read-only access with ability to manage risk alerts' },
];

function getAdminRoleBadge(role: string) {
    switch (role) {
        case 'super_admin':
            return <Badge variant="primary">Super Admin</Badge>;
        case 'admin':
            return <Badge variant="success">Admin</Badge>;
        case 'operator':
            return <Badge variant="slate">Operator</Badge>;
        case 'support':
            return <Badge variant="outline">Support</Badge>;
        default:
            return <Badge variant="slate">{role}</Badge>;
    }
}

export function AdminUsers() {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('operator');

    const activeAdmins = adminUsers.filter((u) => u.status === 'active');
    const pendingAdmins = adminUsers.filter((u) => u.status === 'pending');

    return (
        <DashboardLayout isAdmin>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Admin Users</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Manage internal administrative users and permissions
                        </p>
                    </div>
                    <Button onClick={() => setShowInviteModal(true)}>
                        <Plus className="w-4 h-4" />
                        Invite Admin
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                    <Card className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Active Admins</p>
                            <p className="text-2xl font-bold text-slate-900">{activeAdmins.length}</p>
                        </div>
                    </Card>
                    <Card className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center">
                            <Mail className="w-6 h-6 text-warning-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Pending</p>
                            <p className="text-2xl font-bold text-slate-900">{pendingAdmins.length}</p>
                        </div>
                    </Card>
                    <Card className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <ShieldAlert className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Privileged Roles</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {activeAdmins.filter(a => a.role === 'super_admin').length}
                            </p>
                        </div>
                    </Card>
                </div>

                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-900">
                            Administrative Staff
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {activeAdmins.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100/80 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar name={user.name} size="md" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                            {getAdminRoleBadge(user.role)}
                                        </div>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Last Login</p>
                                        <p className="text-xs text-slate-900">{formatDateTime(user.lastLogin || '')}</p>
                                    </div>
                                    <Dropdown
                                        trigger={
                                            <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                                                <MoreVertical className="w-4 h-4 text-slate-500" />
                                            </button>
                                        }
                                    >
                                        <DropdownItem icon={<Shield className="w-4 h-4" />}>
                                            Manage Permissions
                                        </DropdownItem>
                                        <DropdownSeparator />
                                        <DropdownItem danger icon={<Trash2 className="w-4 h-4" />}>
                                            Deactivate
                                        </DropdownItem>
                                    </Dropdown>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {pendingAdmins.length > 0 && (
                    <Card>
                        <h3 className="text-sm font-medium text-slate-900 mb-4">
                            Pending Invitations
                        </h3>
                        <div className="space-y-4">
                            {pendingAdmins.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-4 border border-warning-100 bg-warning-50/30 rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-warning-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-slate-900">{user.email}</p>
                                                {getAdminRoleBadge(user.role)}
                                                <Badge variant="warning">Pending</Badge>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                Invited {formatDateTime(user.invitedAt || '')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="secondary" size="sm">
                                            Resend invite
                                        </Button>
                                        <Dropdown
                                            trigger={
                                                <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                                                    <MoreVertical className="w-4 h-4 text-slate-500" />
                                                </button>
                                            }
                                        >
                                            <DropdownItem danger icon={<Trash2 className="w-4 h-4" />}>
                                                Cancel invitation
                                            </DropdownItem>
                                        </Dropdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            <Modal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                title="Invite Admin User"
                description="Invite a new administrator to manage the platform"
            >
                <div className="space-y-4">
                    <Input
                        label="Email address"
                        type="email"
                        placeholder="admin@paygate.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Administrative Role
                        </label>
                        <div className="space-y-3">
                            {adminRoles.map((role) => (
                                <label
                                    key={role.value}
                                    className={`
                    flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${inviteRole === role.value
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }
                  `}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={role.value}
                                        checked={inviteRole === role.value}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{role.label}</p>
                                        <p className="text-xs text-slate-500">{role.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => setShowInviteModal(false)}>
                            Send invitation
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
