import { useFrappeGetDocList, useFrappeAuth } from 'frappe-react-sdk';

interface APILogFilters {
    status?: string;
    method?: string;
    from_date?: string;
    to_date?: string;
}

/**
 * Hook for fetching API request logs
 * 
 * Replaces custom method: getAPILogs -> useFrappeGetDocList('API Log')
 */
export function useAPILogs(filters?: APILogFilters) {
    const { currentUser } = useFrappeAuth();

    // Build filter array
    const filterArray: any[] = [
        ['user', '=', currentUser]
    ];

    if (filters?.status) {
        filterArray.push(['status', '=', filters.status]);
    }

    if (filters?.method) {
        filterArray.push(['method', '=', filters.method]);
    }

    if (filters?.from_date) {
        filterArray.push(['creation', '>=', filters.from_date]);
    }

    if (filters?.to_date) {
        filterArray.push(['creation', '<=', filters.to_date]);
    }

    const { data: logs, mutate, isLoading, error } = useFrappeGetDocList('API Log', {
        fields: [
            'name',
            'request_id',
            'method',
            'endpoint',
            'status',
            'status_code',
            'response_time',
            'ip_address',
            'user_agent',
            'creation'
        ],
        filters: filterArray,
        orderBy: {
            field: 'creation',
            order: 'desc'
        },
        limit: 100
    });

    // Calculate stats
    const stats = {
        total: logs?.length || 0,
        success: logs?.filter(log => log.status === 'Success').length || 0,
        failed: logs?.filter(log => log.status === 'Failed').length || 0,
        avgResponseTime: logs?.length
            ? logs.reduce((sum, log) => sum + (log.response_time || 0), 0) / logs.length
            : 0
    };

    return {
        // Data
        logs: logs || [],
        stats,

        // Actions
        refresh: mutate,

        // States
        loading: isLoading,
        error
    };
}
