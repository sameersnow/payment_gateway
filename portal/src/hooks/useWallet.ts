import { useFrappeGetDoc, useFrappeAuth } from 'frappe-react-sdk';

/**
 * Shared hook for wallet balance
 * 
 * Used across Dashboard and Wallet pages to avoid duplicate API calls
 * Replaces custom method: getWalletBalance -> useFrappeGetDoc('Wallet')
 * 
 * Benefits:
 * - Single source of truth for wallet balance
 * - Automatic caching via SWR
 * - Real-time updates across components
 */
export function useWallet() {
    const { currentUser } = useFrappeAuth();

    // Get merchant ID from current user
    // Note: This assumes merchant_id is stored in User doc or we need to fetch Merchant first
    // For now, using currentUser as merchant_id (adjust based on your data model)

    const { data: wallet, mutate, isLoading, error } = useFrappeGetDoc('Wallet', currentUser || undefined);

    return {
        // Data
        balance: wallet?.balance || 0,
        status: wallet?.status || 'Inactive',
        currency: wallet?.currency || 'INR',

        // Actions
        refresh: mutate,

        // States
        loading: isLoading,
        error,

        // Computed
        isActive: wallet?.status === 'Active',
        formattedBalance: new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: wallet?.currency || 'INR'
        }).format(wallet?.balance || 0)
    };
}
