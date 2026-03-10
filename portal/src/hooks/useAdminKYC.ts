import { useFrappePostCall } from 'frappe-react-sdk';
import { toast } from 'sonner';

/**
 * Hook for admin KYC approval/rejection actions
 * Uses custom backend methods because they handle notifications
 */
export function useAdminKYC() {
    // Keep custom methods for notification handling
    const { call: approveKYCCall, loading: approving } = useFrappePostCall('iswitch.admin_portal_api.approve_kyc');
    const { call: rejectKYCCall, loading: rejecting } = useFrappePostCall('iswitch.admin_portal_api.reject_kyc');

    const approveKYC = async (merchantId: string) => {
        try {
            const response = await approveKYCCall({ merchant_id: merchantId });

            if (response?.message?.success) {
                toast.success('KYC approved successfully');
                return response.message;
            } else {
                throw new Error(response?.message?.message || 'Failed to approve KYC');
            }
        } catch (err: any) {
            const errorMessage = err?.message || 'Failed to approve KYC';
            toast.error(errorMessage);
            throw err;
        }
    };

    const rejectKYC = async (
        merchantId: string,
        remark: string,
        documentsToReupload: string[]
    ) => {
        try {
            const response = await rejectKYCCall({
                merchant_id: merchantId,
                remark,
                documents_to_reupload: documentsToReupload
            });

            if (response?.message?.success) {
                toast.success('KYC rejected');
                return response.message;
            } else {
                throw new Error(response?.message?.message || 'Failed to reject KYC');
            }
        } catch (err: any) {
            const errorMessage = err?.message || 'Failed to reject KYC';
            toast.error(errorMessage);
            throw err;
        }
    };

    return {
        approveKYC,
        rejectKYC,
        approving,
        rejecting
    };
}
