import { useState } from 'react';
import { Bell, ChevronDown, User, Settings, LogOut, HelpCircle, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownSeparator, Modal, useToast } from '../ui';
import { GlobalSearch } from '../GlobalSearch';
import { useAuth } from '../../hooks';
import { useFrappeEventListener, useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import { merchantMethods } from '../../services';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';

interface HeaderProps {
  isAdmin?: boolean;
  onMenuClick?: () => void;
}

export function Header({ isAdmin = false, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // const { error, warning, info } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Notification State
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch notifications using frappe-react-sdk
  const { data: notificationsResponse, mutate: refetchNotifications } = useFrappeGetCall(
    merchantMethods.getNotifications,
    { limit: 10 }
  );

  const notifications = notificationsResponse?.message?.notifications || [];
  const unreadCount = notificationsResponse?.message?.unread_count || 0;

  const { call: markNotificationsRead } = useFrappePostCall(merchantMethods.markNotificationsRead);

  const markAsRead = async (id: string) => {
    try {
      await markNotificationsRead({ notification_ids: JSON.stringify([id]) });
      refetchNotifications();
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);

    if (!notification.read) {
      markAsRead(notification.name);
    }
  };

  const markAllRead = async () => {
    try {
      await markNotificationsRead({});
      refetchNotifications();
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  // Listen to real-time merchant notifications using frappe-react-sdk
  useFrappeEventListener('merchant_notification', (data: any) => {
    if (isAdmin) return; // Only handle for merchants

    // Refresh notifications list when a new one arrives
    refetchNotifications();

    // Show realtime toast with enhanced styling
    const toastType = data.priority === 'urgent' ? 'error' : data.priority === 'warning' ? 'warning' : 'info';
    toast[toastType](data.title, {
      description: data.message,
      duration: data.priority === 'urgent' ? 10000 : 5000,
      action: {
        label: 'View',
        onClick: () => {
          setSelectedNotification({
            subject: data.title,
            message: data.message,
            date: new Date().toISOString(),
            read: 0
          });
          setShowDetailModal(true);
        }
      },
      className: 'group',
      classNames: {
        title: 'font-semibold',
        description: 'text-sm',
        actionButton: 'bg-primary-600 hover:bg-primary-700 text-white',
      }
    });
  });

  if (!user) return null;

  const displayName = user.user.full_name || user.user.name;
  const displayEmail = user.user.email;

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:block flex-1 max-w-xl">
              <GlobalSearch isAdmin={isAdmin} />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button className="hidden xs:flex p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Notification Bell for all users */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full ring-2 ring-white" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                  </div>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllRead} className="h-auto p-0 text-xs text-primary-600 hover:text-primary-700">
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500 text-sm">
                      No notifications
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((notification: any) => (
                        <div
                          key={notification.name}
                          className={cn(
                            "px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer",
                            !notification.read && "bg-blue-50/50"
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-2 h-2 mt-1.5 rounded-full shrink-0",
                              !notification.read ? "bg-primary-500" : "bg-slate-300"
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium text-slate-900", !notification.read && "font-semibold")}>
                                {notification.subject}
                              </p>
                              <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-100 p-2 text-center bg-slate-50/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-primary-600 hover:text-primary-700 h-auto py-1.5"
                    onClick={() => {
                      // Close popover logic typically handled by click outside, but navigating usually closes it
                      navigate('/notifications');
                    }}
                  >
                    View all notifications
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="w-px h-6 bg-slate-200 mx-1 sm:mx-2" />

            <Dropdown
              trigger={
                <button className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-medium text-slate-700">
                    {displayName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <ChevronDown className="hidden sm:block w-4 h-4 text-slate-400" />
                </button>
              }
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
              </div>
              <div className="py-1">
                <DropdownItem
                  icon={<User className="w-4 h-4" />}
                  onClick={() => navigate(isAdmin ? '/admin/settings' : '/settings/profile')}
                >
                  Your profile
                </DropdownItem>
                <DropdownItem
                  icon={<Settings className="w-4 h-4" />}
                  onClick={() => navigate(isAdmin ? '/admin/settings' : '/settings')}
                >
                  Settings
                </DropdownItem>
              </div>
              <DropdownSeparator />
              <div className="py-1">
                <DropdownItem icon={<LogOut className="w-4 h-4" />} onClick={handleLogout}>
                  Sign out
                </DropdownItem>
              </div>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Notification Details"
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-500">Subject</h4>
              <p className="text-base font-medium text-slate-900 mt-1">{selectedNotification.subject}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-500">Message</h4>
              <div className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedNotification.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(selectedNotification.date), { addSuffix: true })}
              </span>
              <Button onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
