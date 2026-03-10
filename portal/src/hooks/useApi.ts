// Custom hook for fetching data with loading/error states
import { useState, useEffect } from 'react';

interface UseApiOptions {
    skip?: boolean;
}

interface UseApiResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useApi<T>(
    apiCall: () => Promise<T>,
    dependencies: any[] = [],
    options: UseApiOptions = {}
): UseApiResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        if (options.skip) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await apiCall();
            setData(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch data';
            setError(message);
            console.error('API Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...dependencies, options.skip]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
    };
}
