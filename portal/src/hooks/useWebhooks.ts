import { useFrappeAuth, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc, useFrappeCreateDoc, useFrappeDeleteDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';

interface WebhookData {
    name: string;
    url: string;
    events: string; // Comma-separated string
    is_active: number; // 0 or 1
    creation: string;
}

interface CreateWebhookData {
    url: string;
    events: string; // Comma-separated string
    is_active?: number;
}

export function useWebhooks() {
    const { currentUser } = useFrappeAuth();

    // Fetch Merchant doc to get webhook URL
    const { data: merchantData, error: merchantError, isLoading: merchantLoading, mutate: mutateMerchant } = useFrappeGetDoc(
        'Merchant',
        currentUser || undefined,
        currentUser ? 'merchant_webhook' : undefined // Conditional fetching
    );

    // Fetch Frappe Webhook doc (named same as user email)
    // We use getDocList instead of getDoc to avoid 404 errors if it doesn't exist
    const { data: webhookList, error: webhookError, isLoading: webhookLoading, mutate: mutateWebhook } = useFrappeGetDocList(
        'Webhook',
        {
            filters: [['name', '=', currentUser]],
            fields: ['name', 'enabled', 'creation', 'request_url']
        },
        currentUser ? 'webhook_config_list' : undefined
    );

    const webhookDoc = webhookList?.[0];

    // Fetch webhook logs
    const { data: webhookLogs, mutate: mutateLogs, isLoading: logsLoading } = useFrappeGetDocList('Webhook Request Log', {
        fields: ['name', 'url', 'response', 'error', 'headers', 'data', 'creation', 'user'],
        filters: [['user', '=', currentUser || '']],
        orderBy: {
            field: 'creation',
            order: 'desc'
        },
        limit: 100
    });

    const { createDoc } = useFrappeCreateDoc();
    const { updateDoc } = useFrappeUpdateDoc();
    const { deleteDoc } = useFrappeDeleteDoc();

    // Transform data to match frontend expectations
    const webhooks: WebhookData[] = [];
    if (merchantData?.webhook) {
        webhooks.push({
            name: currentUser || '',
            url: merchantData.webhook,
            events: 'transaction.success,transaction.failed', // Default events
            is_active: webhookDoc?.enabled ? 1 : 0,
            creation: webhookDoc?.creation || new Date().toISOString()
        });
    }

    const createWebhook = async (data: CreateWebhookData) => {
        try {
            const webhookExists = !!webhookDoc;

            if (!webhookExists) {
                if (!currentUser) throw new Error('User not authenticated');

                // Create new Webhook DocType
                await createDoc('Webhook', {
                    __newname: currentUser,
                    webhook_doctype: 'Transaction',
                    webhook_docevent: 'on_submit',
                    condition: `(doc.merchant == '${currentUser}') and (doc.status in ['Success', 'Failed', 'Reversed'])`,
                    request_url: data.url,
                    request_method: 'POST',
                    request_structure: 'JSON',
                    background_jobs_queue: 'long',
                    enabled: data.is_active !== undefined ? data.is_active : 1,
                    webhook_json: `{
    "crn":"{{doc.order}}",
    "utr":"{{doc.transaction_reference_id}}",
    "status": "{{doc.status}}",
    "clientRefID": "{{doc.client_ref_id}}"
}`
                });
            } else {
                if (!currentUser) throw new Error('User not authenticated');

                // Update existing Webhook
                await updateDoc('Webhook', currentUser, {
                    request_url: data.url,
                    enabled: data.is_active !== undefined ? data.is_active : webhookDoc.enabled
                });
            }

            // Update Merchant doc
            await updateDoc('Merchant', currentUser, {
                webhook: data.url
            });

            toast.success('Webhook created successfully');
            mutateMerchant();
            mutateWebhook();
        } catch (err: any) {
            const errorMessage = err?.message || 'Failed to create webhook';
            toast.error(errorMessage);
            throw err;
        }
    };

    const deleteWebhook = async () => {
        try {
            if (!currentUser) throw new Error('User not authenticated');

            // Delete Webhook DocType
            if (webhookDoc) {
                await deleteDoc('Webhook', currentUser);
            }

            // Clear webhook URL from Merchant
            await updateDoc('Merchant', currentUser, {
                webhook: ''
            });

            toast.success('Webhook deleted successfully');
            mutateMerchant();
            mutateWebhook();
        } catch (err: any) {
            const errorMessage = err?.message || 'Failed to delete webhook';
            toast.error(errorMessage);
            throw err;
        }
    };

    const toggleWebhook = async (enabled: boolean) => {
        try {
            if (!currentUser) throw new Error('User not authenticated');
            if (!webhookDoc) throw new Error('Webhook not found');

            await updateDoc('Webhook', currentUser, {
                enabled: enabled ? 1 : 0
            });

            toast.success(`Webhook ${enabled ? 'enabled' : 'disabled'} successfully`);
            mutateWebhook();
        } catch (err: any) {
            const errorMessage = err?.message || 'Failed to update webhook status';
            toast.error(errorMessage);
            throw err;
        }
    };

    return {
        // Webhook data
        webhooks,

        // Webhook logs
        logs: webhookLogs || [],
        logsLoading,

        // States
        isLoading: merchantLoading || webhookLoading,
        error: merchantError || webhookError,

        // Actions
        createWebhook,
        deleteWebhook,
        toggleWebhook,
        refresh: () => {
            mutateMerchant();
            mutateWebhook();
            mutateLogs();
        },
        refreshLogs: mutateLogs
    };
}
