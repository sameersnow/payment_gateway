import { useFrappeGetDocList, useFrappeUpdateDoc, useFrappeAuth } from 'frappe-react-sdk';
import { toast } from 'sonner';

/**
 * Hook for managing merchant notifications
 * 
 * Replaces custom methods:
 * - getNotifications -> useFrappeGetDocList('Notification Log')
 * - markNotificationsRead -> useFrappeUpdateDoc (batch)
 */
export function useNotifications() {
    const { currentUser } = useFrappeAuth();

    // Fetch notifications for current user
    const { data: notifications, mutate, isLoading, error } = useFrappeGetDocList('Notification Log', {
        fields: ['name', 'subject', 'email_content', 'document_type', 'document_name', 'from_user', 'read', 'creation'],
        filters: [['for_user', '=', currentUser || '']],
        orderBy: {
            field: 'creation',
            order: 'desc'
        },
        limit: 50
    });

    // Transform notifications to match expected format (email_content -> message, creation -> date)
    const transformedNotifications = notifications?.map(n => ({
        ...n,
        message: n.email_content,
        date: n.creation
    })) || [];

    const { updateDoc } = useFrappeUpdateDoc();

    /**
     * Mark single notification as read
     */
    const markAsRead = async (notificationId: string) => {
        try {
            await updateDoc('Notification Log', notificationId, { read: 1 });
            await mutate();
        } catch (err: any) {
            const errorMsg = err?.message || err?.exception || 'Failed to mark notification as read';
            toast.error(errorMsg);
            throw err;
        }
    };

    /**
     * Mark multiple notifications as read
     */
    const markMultipleAsRead = async (notificationIds: string[]) => {
        try {
            await Promise.all(
                notificationIds.map(id => updateDoc('Notification Log', id, { read: 1 }))
            );
            await mutate();
            toast.success(`${notificationIds.length} notification(s) marked as read`);
        } catch (err: any) {
            const errorMsg = err?.message || err?.exception || 'Failed to mark notifications as read';
            toast.error(errorMsg);
            throw err;
        }
    };

    /**
     * Mark all notifications as read
     */
    const markAllAsRead = async () => {
        if (!notifications || notifications.length === 0) return;

        const unreadIds = notifications
            .filter(n => !n.read)
            .map(n => n.name);

        if (unreadIds.length === 0) {
            toast.info('No unread notifications');
            return;
        }

        await markMultipleAsRead(unreadIds);
    };

    // Calculate unread count
    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    return {
        // Data
        notifications: transformedNotifications,
        unreadCount,

        // Actions
        markAsRead,
        markMultipleAsRead,
        markAllAsRead,
        refresh: mutate,

        // States
        loading: isLoading,
        error
    };
}
