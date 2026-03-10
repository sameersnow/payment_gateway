import { useState } from 'react';
import { Plus, MoreHorizontal, ShieldCheck, Code, Eye, UserCog, UserMinus } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Input, Badge, Modal, useToast, Dropdown, DropdownItem, Avatar } from '../../components/ui';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import { merchantMethods } from '../../services';

export function Team() {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({
        email: '',
        role: 'Viewer'
    });

    const { success, error: toastError } = useToast();

    const { data: { message: teamData } = {}, mutate: refetchTeam } = useFrappeGetCall(
        merchantMethods.getTeamMembers,
        undefined,
        'team-members'
    );

    const teamMembers = teamData?.team_members || [];
    const currentUserRole = teamData?.current_user_role || 'Viewer';

    const { call: inviteMember, loading: inviting } = useFrappePostCall(merchantMethods.inviteTeamMember);
    const { call: removeMember } = useFrappePostCall(merchantMethods.removeTeamMember);
    const { call: updateMember } = useFrappePostCall(merchantMethods.updateTeamMember);

    const handleInvite = async () => {
        try {
            if (!inviteData.email) {
                toastError('Error', 'Email is required');
                return;
            }

            const response = await inviteMember({
                email: inviteData.email,
                role: inviteData.role
            });

            if (response?.message?.success) {
                success('Success', 'Invitation sent successfully');
                setShowInviteModal(false);
                setInviteData({ email: '', role: 'Viewer' });
                refetchTeam();
            }
        } catch (err: any) {
            toastError('Error', err.message || 'Failed to invite member');
        }
    };

    const handleRemove = async (id: string) => {
        if (!confirm("Are you sure you want to remove this team member?")) return;

        try {
            const resp = await removeMember({ member_id: id });
            if (resp?.message?.success) {
                success('Success', 'Team member removed');
                refetchTeam();
            }
        } catch (err: any) {
            toastError('Error', err.message);
        }
    };

    const handleUpdateRole = async (id: string, newRole: string) => {
        try {
            const resp = await updateMember({ member_id: id, role: newRole });
            if (resp?.message?.success) {
                success('Success', 'Role updated');
                refetchTeam();
            }
        } catch (err: any) {
            toastError('Error', err.message);
        }
    };

    const RoleIcon = ({ role }: { role: string }) => {
        switch (role) {
            case 'Owner': return <ShieldCheck className="w-4 h-4 text-purple-600" />;

            case 'Developer': return <Code className="w-4 h-4 text-blue-600" />;
            default: return <Eye className="w-4 h-4 text-slate-600" />;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Team</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Manage team members and their permissions
                        </p>
                    </div>
                    {currentUserRole === 'Owner' && (
                        <Button onClick={() => setShowInviteModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Invite member
                        </Button>
                    )}
                </div>

                <Card className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-base font-medium text-slate-900">Team Members ({teamMembers.length})</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {teamMembers.length > 0 ? (
                            teamMembers.map((member: any) => (
                                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <Avatar name={member.full_name || member.email} src={member.avatar} size="md" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{member.full_name || member.email}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                {member.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-700">
                                            <RoleIcon role={member.role} />
                                            <span>{member.role}</span>
                                        </div>

                                        <Badge variant={member.status === 'Active' ? 'success' : 'slate'}>
                                            {member.status}
                                        </Badge>

                                        {currentUserRole === 'Owner' && member.role !== 'Owner' && (
                                            <Dropdown
                                                align="end"
                                                trigger={
                                                    <div className="p-2 hover:bg-slate-200 rounded-md transition-colors cursor-pointer">
                                                        <MoreHorizontal className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                }
                                            >
                                                <div className="p-1 space-y-1">

                                                    {member.role !== 'Developer' && (
                                                        <DropdownItem
                                                            icon={<Code className="w-4 h-4" />}
                                                            onClick={() => handleUpdateRole(member.id, 'Developer')}
                                                        >
                                                            Make Developer
                                                        </DropdownItem>
                                                    )}
                                                    {member.role !== 'Viewer' && (
                                                        <DropdownItem
                                                            icon={<Eye className="w-4 h-4" />}
                                                            onClick={() => handleUpdateRole(member.id, 'Viewer')}
                                                        >
                                                            Make Viewer
                                                        </DropdownItem>
                                                    )}
                                                    <DropdownItem
                                                        danger
                                                        icon={<UserMinus className="w-4 h-4" />}
                                                        onClick={() => handleRemove(member.id)}
                                                    >
                                                        Remove from Team
                                                    </DropdownItem>
                                                </div>
                                            </Dropdown>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-slate-500">
                                <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p>No team members found.</p>
                                {currentUserRole === 'Owner' && (
                                    <p className="text-sm mt-1">Invite your colleagues to collaborate.</p>
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Role Explainer based on screenshot */}
                <Card className="p-6">
                    <h3 className="text-sm font-medium text-slate-900 mb-4">Role Permissions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                <ShieldCheck className="w-4 h-4 text-purple-600" />
                                Owner
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Full access to all settings, team management, and financial data. Can transfer ownership.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                <Code className="w-4 h-4 text-blue-600" />
                                Developer
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Access to API keys, webhooks, and logs. Cannot invite members or view sensitive financial data.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                <Eye className="w-4 h-4 text-slate-600" />
                                Viewer
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Read-only access to dashboard statistics, reports, and transactions. Cannot make any changes.
                            </p>
                        </div>
                    </div>
                </Card>

            </div>

            <Modal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                title="Invite Team Member"
                description="Send an invitation to join your team"
            >
                <div className="space-y-4">
                    <Input
                        label="Email address"
                        type="email"
                        placeholder="colleague@company.com"
                        value={inviteData.email}
                        onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    />

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">Role</label>

                        {['Owner', 'Developer', 'Viewer'].map((role) => (
                            <div
                                key={role}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${inviteData.role === role
                                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                                    : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                onClick={() => setInviteData({ ...inviteData, role })}
                            >
                                <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${inviteData.role === role ? 'border-brand-600' : 'border-slate-300'
                                    }`}>
                                    {inviteData.role === role && <div className="w-2 h-2 rounded-full bg-brand-600" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{role}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {role === 'Owner' && 'Full access to all settings and data'}
                                        {role === 'Developer' && 'Access to API keys, webhooks, and logs'}
                                        {role === 'Viewer' && 'Read-only access to dashboard and reports'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                        <Button onClick={handleInvite} loading={inviting}>Send Invitation</Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
