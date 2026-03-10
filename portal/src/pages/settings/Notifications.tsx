import { useState } from 'react';
import { Mail, Bell, Webhook, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Toggle } from '../../components/ui';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  email: boolean;
  push: boolean;
}

const defaultNotifications: NotificationSetting[] = [
  {
    id: 'payments',
    title: 'Successful payments',
    description: 'Get notified when you receive a payment',
    email: true,
    push: true,
  },
  {
    id: 'failed',
    title: 'Failed payments',
    description: 'Get notified when a payment fails',
    email: true,
    push: true,
  },
  {
    id: 'refunds',
    title: 'Refunds',
    description: 'Get notified when a refund is processed',
    email: true,
    push: false,
  },
  {
    id: 'settlements',
    title: 'Settlements',
    description: 'Get notified when funds are settled to your bank',
    email: true,
    push: false,
  },
  {
    id: 'disputes',
    title: 'Disputes and chargebacks',
    description: 'Get notified about payment disputes',
    email: true,
    push: true,
  },
  {
    id: 'weekly',
    title: 'Weekly summary',
    description: 'Receive a weekly summary of your business activity',
    email: true,
    push: false,
  },
  {
    id: 'security',
    title: 'Security alerts',
    description: 'Get notified about security events like new logins',
    email: true,
    push: true,
  },
  {
    id: 'product',
    title: 'Product updates',
    description: 'Learn about new features and improvements',
    email: false,
    push: false,
  },
];

export function Notifications() {
  const [notifications, setNotifications] = useState(defaultNotifications);

  const updateNotification = (id: string, type: 'email' | 'push', value: boolean) => {
    setNotifications(notifications.map((n) =>
      n.id === id ? { ...n, [type]: value } : n
    ));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose how you want to be notified about activity
          </p>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 pr-4">
                    <span className="text-xs font-medium text-slate-500 uppercase">
                      Notification
                    </span>
                  </th>
                  <th className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500 uppercase">
                        Email
                      </span>
                    </div>
                  </th>
                  <th className="py-3 pl-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Bell className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500 uppercase">
                        Push
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td className="py-4 pr-4">
                      <p className="text-sm font-medium text-slate-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {notification.description}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <Toggle
                          checked={notification.email}
                          onChange={(checked) => updateNotification(notification.id, 'email', checked)}
                        />
                      </div>
                    </td>
                    <td className="py-4 pl-4">
                      <div className="flex justify-center">
                        <Toggle
                          checked={notification.push}
                          onChange={(checked) => updateNotification(notification.id, 'push', checked)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
              <Webhook className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-slate-900">Webhook Notifications</h3>
              <p className="text-sm text-slate-500 mt-1">
                For programmatic notifications, configure webhooks to receive real-time events in your application.
              </p>
              <Button variant="secondary" size="sm" className="mt-3">
                Configure webhooks
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button>Save preferences</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
