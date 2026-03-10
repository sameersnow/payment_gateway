import { useState } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';

import { DashboardLayout } from '../components/layout';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import { useNotifications } from '../hooks';

// import { useToast } from '../components/ui';
import { Modal, Button } from '../components/ui';

export function Notifications() {
    const [selectedNotification, setSelectedNotification] = useState<any>(null);

    // Use SDK hook for notifications
    const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

    const handleMarkAllRead = async () => {
        await markAllAsRead();
    };

    const handleMarkRead = async (id: string, isRead: number) => {
        if (isRead) return;
        await markAsRead(id);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            View and manage your account notifications
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button onClick={handleMarkAllRead} variant="secondary" size="sm" className="gap-2">
                            <Check className="w-4 h-4" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {loading && notifications.length === 0 ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-6 h-6 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">No notifications</h3>
                                <p className="text-slate-500 mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            <>
                                {notifications.map((notification: any) => (
                                    <div
                                        key={notification.name}
                                        className={cn(
                                            "group flex items-center px-4 py-3 hover:shadow-sm cursor-pointer transition-all gap-4",
                                            !notification.read ? "bg-white" : "bg-slate-50/50 hover:bg-white"
                                        )}
                                        onClick={() => {
                                            setSelectedNotification(notification);
                                            handleMarkRead(notification.name, notification.read);
                                        }}
                                    >
                                        {/* Status Icon */}
                                        <div className="shrink-0">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                !notification.read ? "bg-blue-600" : "bg-transparent border border-slate-300"
                                            )} />
                                        </div>

                                        {/* Content - Row Layout */}
                                        <div className="flex-1 flex items-center min-w-0 gap-4">
                                            {/* Sender/Title */}
                                            <span className={cn(
                                                "w-48 shrink-0 truncate text-sm text-slate-900",
                                                !notification.read ? "font-semibold" : "font-medium"
                                            )}>
                                                {notification.subject}
                                            </span>

                                            {/* Preview */}
                                            <span className={cn(
                                                "flex-1 truncate text-sm",
                                                !notification.read ? "text-slate-900 font-medium" : "text-slate-500"
                                            )}>
                                                <span className="text-slate-400 mr-2">-</span>
                                                {notification.message?.replace(/\n/g, ' ')}
                                            </span>

                                            {/* Date */}
                                            <span className={cn(
                                                "text-xs shrink-0 w-24 text-right",
                                                !notification.read ? "text-slate-900 font-medium" : "text-slate-500"
                                            )}>
                                                {notification.date ? format(new Date(notification.date), 'MMM d') : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Detail Modal */}
                <Modal
                    isOpen={!!selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                    title="Notification Details"
                    size="md"
                    showClose={true}
                >
                    {selectedNotification && (
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-500">Subject</label>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-semibold text-slate-900">
                                        {selectedNotification.subject}
                                    </h3>
                                    {/* Status Icon matching list view */}
                                    <div className={cn(
                                        "w-2 h-2 rounded-full shrink-0",
                                        !selectedNotification.read ? "bg-blue-600" : "bg-transparent border border-slate-300"
                                    )} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-500">Message</label>
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                                        {selectedNotification.message}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <span className="text-xs text-slate-400">
                                    {selectedNotification.date ? format(new Date(selectedNotification.date), 'MMM d, yyyy h:mm a') : 'Date not available'}
                                </span>
                                <Button variant="secondary" onClick={() => setSelectedNotification(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
}
