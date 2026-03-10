
import { useState, useEffect } from 'react';
import { useFrappeCreateDoc, useFrappeGetDocList } from 'frappe-react-sdk';
import { Button, Input, Modal, Select, useToast } from '../ui';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks';

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        customer: '',
        amount: '',
        product: '', // Payment Mode
        vpa: '',
        customerAccountNumber: '',
        ifsc: '',
        clientRefId: '',
    });

    const { createDoc } = useFrappeCreateDoc();

    // Fetch available products (Payment Modes)
    const { data: products } = useFrappeGetDocList('Product', {
        fields: ['name', 'product_name'],
        filters: [['is_active', '=', 1]]
    });

    // Helper to generate ID
    const generateId = () => `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Auto-generate Client Ref ID if empty on open
    // (Removed auto-generation on mount per user request)

    // Reset form on open
    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                customer: '',
                amount: '',
                product: '',
                vpa: '',
                customerAccountNumber: '',
                ifsc: '',
                clientRefId: ''
            }));
        }
    }, [isOpen]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customer || !formData.amount || !formData.product) {
            showError('Required', 'Please fill in all required fields');
            return;
        }

        // Validate Conditional Fields
        const isUPI = formData.product.toUpperCase().includes('UPI');
        if (isUPI && !formData.vpa) {
            showError('Required', 'VPA is required for UPI orders');
            return;
        }
        if (!isUPI && (!formData.customerAccountNumber || !formData.ifsc)) {
            showError('Required', 'Account Number and IFSC are required');
            return;
        }

        try {
            setLoading(true);

            const payload: any = {
                customer_name: formData.customer,
                order_amount: parseFloat(formData.amount),
                product: formData.product,
                client_ref_id: formData.clientRefId || generateId(), // Auto-generate if empty
                merchant_ref_id: user?.merchant?.name || user?.user.name,
                status: 'Queued', // Default status for new orders
                channel: 'Web', // Set channel to Web
                // Conditional Fields
                ...(isUPI ? { vpa: formData.vpa } : {
                    customer_account_number: formData.customerAccountNumber,
                    ifsc: formData.ifsc
                })
            };

            await createDoc('Order', payload);

            success('Success', 'Order created successfully');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Failed to create order:', err);

            let errorMessage = 'Failed to create order';

            // Helper to extract message from Frappe server messages
            // Safely parses nested JSON strings that Frappe sometimes returns
            const extractServerMessage = (serverMessages: string) => {
                try {
                    const messages = JSON.parse(serverMessages);
                    if (Array.isArray(messages) && messages.length > 0) {
                        const firstMessage = JSON.parse(messages[0]);
                        return firstMessage.message;
                    }
                } catch (e) {
                    console.warn('Failed to parse server messages:', e);
                }
                return null;
            };

            // 1. Check direct _server_messages (frappe-react-sdk might dump it here)
            if (err._server_messages) {
                const msg = extractServerMessage(err._server_messages);
                if (msg) errorMessage = msg;
            }
            // 2. Check nested response data (common in axios/fetch wrappers)
            else if (err.response?.data?._server_messages) {
                const msg = extractServerMessage(err.response.data._server_messages);
                if (msg) errorMessage = msg;
            }
            // 3. Check for specific exception message
            else if (err.exception || err.response?.data?.exception) {
                const exceptionStr = err.exception || err.response?.data?.exception;
                if (typeof exceptionStr === 'string') {
                    // Remove "frappe.exceptions.ValidationError: " prefix if present
                    const parts = exceptionStr.split(':');
                    errorMessage = parts.length > 1 ? parts.slice(1).join(':').trim() : exceptionStr;
                }
            }
            // 4. Fallback to standard message property
            else if (err.message && err.message !== 'Request failed with status code 417') {
                errorMessage = err.message;
            }

            // Fallback for "Request failed with status code 417" if no other info found
            if (errorMessage === 'Request failed with status code 417') {
                errorMessage = 'Validation failed. Please check your inputs.';
            }

            showError('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const isUPI = formData.product && formData.product.toUpperCase().includes('UPI');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Order"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Customer Name"
                    value={formData.customer}
                    onChange={(e) => handleChange('customer', e.target.value)}
                    placeholder="Enter customer name"
                    required
                />

                <Input
                    label="Amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                />

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Payment Mode</label>
                    <Select
                        value={formData.product}
                        onChange={(e) => handleChange('product', e.target.value)}
                        options={products?.map((p: any) => ({ value: p.name, label: p.product_name })) || []}
                        placeholder="Select Payment Mode"
                        required
                    />
                </div>

                {formData.product && (
                    <div className="p-4 bg-slate-50 rounded-lg space-y-4 border border-slate-200">
                        {isUPI ? (
                            <Input
                                label="VPA (Virtual Payment Address)"
                                value={formData.vpa}
                                onChange={(e) => handleChange('vpa', e.target.value)}
                                placeholder="customer@upi"
                                required
                            />
                        ) : (
                            <>
                                <Input
                                    label="Customer Account Number"
                                    value={formData.customerAccountNumber}
                                    onChange={(e) => handleChange('customerAccountNumber', e.target.value)}
                                    placeholder="Enter account number"
                                    required
                                />
                                <Input
                                    label="IFSC Code"
                                    value={formData.ifsc}
                                    onChange={(e) => handleChange('ifsc', e.target.value)}
                                    placeholder="Enter IFSC code"
                                    required
                                />
                            </>
                        )}
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Client Ref ID</label>
                    <div className="relative">
                        <Input
                            value={formData.clientRefId}
                            onChange={(e) => handleChange('clientRefId', e.target.value)}
                            placeholder="Enter ID or click generate"
                            className="pr-10" // Add padding for the icon
                        />
                        <button
                            type="button"
                            onClick={() => handleChange('clientRefId', generateId())}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors"
                            title="Generate new ID"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500">Unique reference ID for this order</p>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={loading}
                    >
                        Create Order
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
