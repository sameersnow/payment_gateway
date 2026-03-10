import { useFrappeAuth, useFrappeGetDocList, useFrappeCreateDoc, useFrappeDeleteDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';

interface WhitelistIP {
    name: string;
    whitelisted_ip: string;
    merchant: string;
    creation: string;
    modified: string;
}

interface AddIPData {
    ip_address: string; // Frontend uses ip_address, but we map to whitelisted_ip
}

export function useIPWhitelist() {
    const { currentUser } = useFrappeAuth();

    // Fetch whitelisted IPs for current merchant
    const { data, error, isLoading, mutate } = useFrappeGetDocList<WhitelistIP>(
        'Whitelist IP',
        {
            fields: ['name', 'whitelisted_ip', 'merchant', 'creation', 'modified'],
            filters: [['merchant', '=', currentUser]],
            orderBy: {
                field: 'creation',
                order: 'desc'
            }
        },
        currentUser ? 'whitelisted_ips' : null // Conditional fetching
    );

    const { createDoc } = useFrappeCreateDoc();
    const { deleteDoc } = useFrappeDeleteDoc();

    const addWhitelistedIP = async (data: AddIPData) => {
        try {
            // Map ip_address to whitelisted_ip to match DocType field
            await createDoc('Whitelist IP', {
                whitelisted_ip: data.ip_address, // ✅ Correct DocType field name
                merchant: currentUser
            });

            toast.success('IP address whitelisted successfully');
            mutate(); // Refresh the list
        } catch (err: any) {
            const errorMessage = err?.message || 'Failed to add IP address';
            toast.error(errorMessage);
            throw err;
        }
    };

    const deleteWhitelistedIP = async (ipName: string) => {
        try {
            await deleteDoc('Whitelist IP', ipName);
            toast.success('IP address removed successfully');
            mutate(); // Refresh the list
        } catch (err: any) {
            const errorMessage = err?.message || 'Failed to remove IP address';
            toast.error(errorMessage);
            throw err;
        }
    };

    return {
        whitelistedIPs: data || [],
        isLoading,
        error,
        addWhitelistedIP,
        deleteWhitelistedIP,
        refresh: mutate
    };
}
