import { useFrappeGetCall, useFrappePostCall, useFrappeAuth } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { merchantMethods } from '../services/methods';

/**
 * Hook for managing merchant API keys
 * 
 * Uses custom backend method because 'User' DocType standard API 
 * does not return api_key/api_secret for security reasons.
 * 
 * Caching: Uses SWR via useFrappeGetCall with stable key ['api-keys', currentUser]
 */
export function useAPIKeys() {
    const { currentUser } = useFrappeAuth();

    // Fetch API keys using custom method with Caching
    // Cache key includes currentUser to ensure data belongs to logged-in user
    // We use a conditional key to prevent fetching if user is not logged in
    const { data: response, mutate, isLoading, error } = useFrappeGetCall<{ message: { success: boolean, api_key: string, api_secret?: string } }>(
        merchantMethods.getAPIKeys,
        undefined,
        currentUser ? `api-keys-${currentUser}` : null
    );

    const { call: generateKeysCall, loading: generating } = useFrappePostCall(merchantMethods.generateAPIKeys);

    const keysData = response?.message;

    /**
     * Generate new API keys for the current user
     */
    const generateKeys = async () => {
        try {
            if (!currentUser) throw new Error('User not authenticated');

            const res = await generateKeysCall({});

            // Backend returns the new keys in the response
            // We refresh the cache to update the 'hasKeys' state
            await mutate();

            toast.success('API keys generated successfully');
            return res.message; // Return data so component can show secret
        } catch (err: any) {
            const errorMsg = err?.message || err?.exception || 'Failed to generate API keys';
            toast.error(errorMsg);
            throw err;
        }
    };

    return {
        // Data
        apiKey: keysData?.api_key || null,
        apiSecret: keysData?.api_secret || null,
        hasKeys: !!(keysData?.success && keysData?.api_key),

        // Actions
        generateKeys,
        refresh: mutate,

        // States
        loading: isLoading,
        generating,
        error
    };
}
