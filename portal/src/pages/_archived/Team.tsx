import { useState } from 'react';
import { Plus, MoreVertical, Mail, Trash2, Shield } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Badge, Avatar, Modal, Input, Select, Dropdown, DropdownItem, DropdownSeparator } from '../../components/ui';
import { teamMembers } from '../../data/mockData';
import { formatDateTime } from '../../utils/formatters';

const roles = [
  { value: 'admin', label: 'Admin', description: 'Full access to all settings and data' },
  { value: 'developer', label: 'Developer', description: 'Access to API keys, webhooks, and logs' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to dashboard and reports' },
];

function getRoleBadge(role: string) {
  switch (role) {
    case 'owner':
      return <Badge variant="primary">Owner</Badge>;
    case 'admin':
      return <Badge variant="success">Admin</Badge>;
    case 'developer':
      return <Badge variant="slate">Developer</Badge>;
    case 'viewer':
      return <Badge variant="outline">Viewer</Badge>;
    default:
      return <Badge variant="slate">{role}</Badge>;
  }
}

export function Team() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const activeMembers = teamMembers.filter((m) => m.status === 'active');
  const pendingMembers = teamMembers.filter((m) => m.status === 'pending');

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
          <Button onClick={() => setShowInviteModal(true)}>
            <Plus className="w-4 h-4" />
            Invite member
          </Button>
        </div>

        <Card>
          <h3 className="text-sm font-medium text-slate-900 mb-4">
            Team Members ({activeMembers.length})
          </h3>
          <div className="space-y-4">
            {activeMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Avatar name={member.name} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{member.name}</p>
                      {getRoleBadge(member.role)}
                    </div>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>
                {member.role !== 'owner' && (
                  <Dropdown
                    trigger={
                      <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-slate-500" />
                      </button>
                    }
                  >
                    <DropdownItem icon={<Shield className="w-4 h-4" />}>
                      Change role
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem danger icon={<Trash2 className="w-4 h-4" />}>
                      Remove
                    </DropdownItem>
                  </Dropdown>
                )}
              </div>
            ))}
          </div>
        </Card>

        {pendingMembers.length > 0 && (
          <Card>
            <h3 className="text-sm font-medium text-slate-900 mb-4">
              Pending Invitations ({pendingMembers.length})
            </h3>
            <div className="space-y-4">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{member.email}</p>
                        {getRoleBadge(member.role)}
                        <Badge variant="warning">Pending</Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        Invited {formatDateTime(member.invitedAt)}
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

        <Card className="bg-slate-50 border-slate-200">
          <h3 className="text-sm font-medium text-slate-900 mb-3">Role Permissions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 font-medium text-slate-500">Permission</th>
                  <th className="text-center py-2 font-medium text-slate-500">Owner</th>
                  <th className="text-center py-2 font-medium text-slate-500">Admin</th>
                  <th className="text-center py-2 font-medium text-slate-500">Developer</th>
                  <th className="text-center py-2 font-medium text-slate-500">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  { name: 'View dashboard', owner: true, admin: true, developer: true, viewer: true },
                  { name: 'View transactions', owner: true, admin: true, developer: true, viewer: true },
                  { name: 'Manage API keys', owner: true, admin: true, developer: true, viewer: false },
                  { name: 'Manage webhooks', owner: true, admin: true, developer: true, viewer: false },
                  { name: 'Issue refunds', owner: true, admin: true, developer: false, viewer: false },
                  { name: 'Manage team', owner: true, admin: true, developer: false, viewer: false },
                  { name: 'Billing settings', owner: true, admin: false, developer: false, viewer: false },
                ].map((perm) => (
                  <tr key={perm.name}>
                    <td className="py-2 text-slate-700">{perm.name}</td>
                    <td className="py-2 text-center">{perm.owner ? '✓' : '-'}</td>
                    <td className="py-2 text-center">{perm.admin ? '✓' : '-'}</td>
                    <td className="py-2 text-center">{perm.developer ? '✓' : '-'}</td>
                    <td className="py-2 text-center">{perm.viewer ? '✓' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Role
            </label>
            <div className="space-y-3">
              {roles.map((role) => (
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
