import { useFrappePostCall } from 'frappe-react-sdk';
import { toast } from 'sonner';

/**
 * Reusable hook for exporting data to Excel
 * Handles the export API call and automatic file download
 * 
 * @param method - The export method from adminMethods or merchantMethods
 * @returns Object with exportData function, loading state, and error
 * 
 * @example
 * const { exportData, loading } = useExportData(adminMethods.exportOrders);
 * await exportData({ status: 'completed' });
 */
export const useExportData = (method: string) => {
    const { call, loading, error } = useFrappePostCall(method);

    const exportData = async (filters?: any) => {
        try {
            const result = await call({
                filters: filters ? JSON.stringify(filters) : '{}'
            });

            if (result?.message?.file_url) {
                // Create a temporary link and trigger download
                const link = document.createElement('a');
                link.href = result.message.file_url;
                link.download = result.message.file_name || 'export.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success('Export completed successfully');
                return result.message;
            } else if (result?.data?.file_url) {
                // Alternative response structure
                const link = document.createElement('a');
                link.href = result.data.file_url;
                link.download = result.data.file_name || 'export.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success('Export completed successfully');
                return result.data;
            } else {
                throw new Error('No file URL in response');
            }
        } catch (err: any) {
            const errorMessage = err?.message || 'Export failed';
            toast.error('Export Failed', { description: errorMessage });
            throw err;
        }
    };

    return { exportData, loading, error };
};
