import { useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';

interface Service {
    name: string;
    product_name: string;
    is_active: number;
}

export function useAdminServices() {
    const { data: services, error, isLoading, mutate } = useFrappeGetDocList<Service>(
        'Product',
        {
            fields: ['name', 'product_name', 'is_active'],
            orderBy: {
                field: 'product_name',
                order: 'asc'
            }
        },
        'admin_services' // Cache key
    );

    const { updateDoc } = useFrappeUpdateDoc();

    const toggleServiceStatus = async (serviceName: string, isActive: boolean) => {
        try {
            await updateDoc('Product', serviceName, {
                is_active: isActive ? 1 : 0
            });
            toast.success(`Service ${isActive ? 'activated' : 'deactivated'}`);
            mutate(); // Refresh the list
        } catch (err: any) {
            const errorMessage = err?.message || 'Failed to update service';
            toast.error(errorMessage);
            throw err;
        }
    };

    return {
        services: services || [],
        isLoading,
        error,
        toggleServiceStatus,
        refresh: mutate
    };
}
