import { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { Modal } from '../ui';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { useFrappePostCall } from 'frappe-react-sdk';
import { adminMethods } from '../../services/methods';

interface BroadcastMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Priority = 'info' | 'warning' | 'urgent';

export function BroadcastMessageModal({ isOpen, onClose }: BroadcastMessageModalProps) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<Priority>('info');

    const { call: sendBroadcast, loading: isSubmitting } = useFrappePostCall(adminMethods.sendBroadcastNotification);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            const result = await sendBroadcast({ title, message, priority });

            if (result.message?.success) {
                toast.success('Broadcast sent successfully', {
                    description: 'All merchants will receive this notification'
                });

                // Reset form and close modal
                setTitle('');
                setMessage('');
                setPriority('info');
                onClose();
            } else {
                toast.error('Failed to send broadcast', {
                    description: result.message?.message || 'Please try again'
                });
            }

        } catch (error: any) {
            toast.error('Failed to send broadcast', {
                description: error.message || 'Please try again'
            });
        }
    };

    const priorityOptions = [
        { value: 'info' as Priority, label: 'Info', color: 'text-blue-600 bg-blue-50' },
        { value: 'warning' as Priority, label: 'Warning', color: 'text-yellow-600 bg-yellow-50' },
        { value: 'urgent' as Priority, label: 'Urgent', color: 'text-red-600 bg-red-50' }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send Broadcast Message">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title Input */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Scheduled Maintenance"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        maxLength={100}
                        required
                    />
                    <p className="text-xs text-slate-500 mt-1">{title.length}/100 characters</p>
                </div>

                {/* Message Textarea */}
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                        Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter your message to all merchants..."
                        rows={5}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                        maxLength={500}
                        required
                    />
                    <p className="text-xs text-slate-500 mt-1">{message.length}/500 characters</p>
                </div>

                {/* Priority Selector */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Priority
                    </label>
                    <div className="flex gap-3">
                        {priorityOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setPriority(option.value)}
                                className={`
                  flex-1 px-4 py-2 rounded-lg border-2 transition-all
                  ${priority === option.value
                                        ? `${option.color} border-current font-medium`
                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                    }
                `}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preview */}
                {(title || message) && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Preview
                        </p>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                            {title && <h4 className="font-semibold text-sm text-slate-900">{title}</h4>}
                            {message && <p className="text-sm text-slate-600 mt-1">{message}</p>}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !title.trim() || !message.trim()}
                        className="flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Send to All Merchants
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
