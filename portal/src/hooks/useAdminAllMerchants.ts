import { useFrappeGetCall } from 'frappe-react-sdk';
import { adminMethods } from '../services/methods';

export interface MerchantSummary {
    name: string;
    company_name: string;
    company_email: string;
    status: string;
}

interface UseAdminMerchantsOptions {
    page?: number;
    pageSize?: number;
    search?: string;
}

export function useAdminMerchants(options: UseAdminMerchantsOptions = {}) {
    const { page = 1, pageSize = 100, search } = options;

    const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: { merchants: MerchantSummary[], total: number } }>(
        adminMethods.getMerchants,
        {
            page,
            page_size: pageSize,
            search_text: search
        },
        `admin-merchants-list-${page}-${pageSize}-${search || ''}`
    );

    return {
        merchants: data?.message?.merchants || [],
        total: data?.message?.total || 0,
        isLoading,
        error,
        refresh: mutate
    };
}
