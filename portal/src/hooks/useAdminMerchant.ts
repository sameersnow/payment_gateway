import { useFrappeUpdateDoc, useFrappePostCall } from 'frappe-react-sdk';
import { toast } from 'sonner';

/**
 * Hook for admin merchant management operations
 * 
 * Provides:
 * - SDK-based suspend/reactivate (simple status updates)
 * - Custom methods for notifications and pricing (complex operations)
 */
export function useAdminMerchant() {
    const { updateDoc, loading: updating, error } = useFrappeUpdateDoc();

    // Keep custom methods for complex operations
    const { call: sendNotificationCall, loading: sendingNotification } = useFrappePostCall('iswitch.admin_portal_api.send_merchant_notification');
    const { call: adjustFundsCall, loading: adjustingFunds } = useFrappePostCall('iswitch.admin_portal_api.adjust_merchant_funds');

    /**
     * Suspend a merchant account
     * Uses SDK to update status and remark fields
     */
    const suspendMerchant = async (merchantId: string, reason: string) => {
        try {
            await updateDoc('Merchant', merchantId, {
                status: 'Suspended',
                remark: reason
            });
            toast.success('Merchant suspended successfully');
        } catch (err: any) {
            const errorMsg = err?.message || err?.exception || 'Failed to suspend merchant';
            toast.error(errorMsg);
            throw err;
        }
    };

    /**
     * Reactivate a suspended merchant account
     * Uses SDK to update status and clear remark
     */
    const reactivateMerchant = async (merchantId: string) => {
        try {
            await updateDoc('Merchant', merchantId, {
                status: 'Approved',
                remark: ''
            });
            toast.success('Merchant reactivated successfully');
        } catch (err: any) {
            const errorMsg = err?.message || err?.exception || 'Failed to reactivate merchant';
            toast.error(errorMsg);
            throw err;
        }
    };

    /**
     * Send notification to merchant
     * Uses custom method because it creates Notification Log and publishes real-time events
     */
    const sendMerchantNotification = async (
        merchantId: string,
        subject: string,
        message: string
    ) => {
        try {
            const result = await sendNotificationCall({
                merchant_id: merchantId,
                subject,
                message
            });

            if (result?.message?.success) {
                toast.success('Notification sent successfully');
            } else {
                throw new Error(result?.message?.message || 'Failed to send notification');
            }
        } catch (err: any) {
            const errorMsg = err?.message || err?.exception || 'Failed to send notification';
            toast.error(errorMsg);
            throw err;
        }
    };

    /**
     * Adjust merchant funds (Hold/Release)
     */
    const adjustFunds = async (
        merchantId: string,
        type: 'Hold' | 'Release',
        amount: number,
        remark: string
    ) => {
        try {
            const result = await adjustFundsCall({
                merchant: merchantId,
                type,
                amount,
                remark
            });

            if (result?.message?.success) {
                toast.success(result.message.message || 'Funds adjusted successfully');
                return true;
            } else {
                throw new Error(result?.message?.error || 'Failed to adjust funds');
            }
        } catch (err: any) {
            const errorMsg = err?.message || err?.exception || 'Failed to adjust funds';
            toast.error(errorMsg);
            throw err;
        }
    };

    return {
        // SDK-based methods
        suspendMerchant,
        reactivateMerchant,

        // Custom methods
        sendMerchantNotification,
        adjustFunds,

        // Loading states
        suspending: updating,
        reactivating: updating,
        sendingNotification,
        adjustingFunds,

        // Error state
        error
    };
}
