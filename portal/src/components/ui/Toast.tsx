import { createContext, useContext, useState, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import notificationSound from '../../assets/notification.mp3';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    toast: (toast: Omit<Toast, 'id'>) => void;
    success: (title: string, message?: string, action?: { label: string; onClick: () => void }) => void;
    error: (title: string, message?: string, action?: { label: string; onClick: () => void }) => void;
    warning: (title: string, message?: string, action?: { label: string; onClick: () => void }) => void;
    info: (title: string, message?: string, action?: { label: string; onClick: () => void }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const addToast = (toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { ...toast, id }]);

        // Play notification sound
        try {
            const audio = new Audio(notificationSound);
            audio.volume = 0.5;
            audio.play().catch(() => {
                // Ignore auto-play errors silently
            });
        } catch (e) {
            // Ignore audio errors
        }

        if (toast.duration !== 0) {
            setTimeout(() => {
                removeToast(id);
            }, toast.duration || 5000);
        }
    };

    const helpers = {
        success: (title: string, message?: string, action?: { label: string; onClick: () => void }) => addToast({ type: 'success', title, message, action }),
        error: (title: string, message?: string, action?: { label: string; onClick: () => void }) => addToast({ type: 'error', title, message, action }),
        warning: (title: string, message?: string, action?: { label: string; onClick: () => void }) => addToast({ type: 'warning', title, message, action }),
        info: (title: string, message?: string, action?: { label: string; onClick: () => void }) => addToast({ type: 'info', title, message, action }),
    };

    return (
        <ToastContext.Provider value={{ toast: addToast, ...helpers }}>
            {children}
            <div className="fixed top-20 right-4 z-[99999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const icons = {
        success: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        error: <AlertCircle className="w-4 h-4 text-rose-600" />,
        warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
        info: <Info className="w-4 h-4 text-blue-600" />,
    };

    const styles = {
        success: 'bg-white border-emerald-100/50 shadow-sm ring-1 ring-emerald-500/10',
        error: 'bg-white border-rose-100/50 shadow-sm ring-1 ring-rose-500/10',
        warning: 'bg-white border-amber-100/50 shadow-sm ring-1 ring-amber-500/10',
        info: 'bg-white border-blue-100/50 shadow-sm ring-1 ring-blue-500/10',
    };

    return (
        <div className={`
      pointer-events-auto
      flex items-start gap-3 min-w-[280px] max-w-[360px] pl-3 pr-2 py-3 rounded-lg
      transform transition-all duration-300 animate-slide-in-right backdrop-blur-xl
      ${styles[toast.type]}
    `}>
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 py-1">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                    {toast.title}
                </span>
                {toast.message && (
                    <span className="text-xs text-slate-500 leading-tight">
                        {toast.message}
                    </span>
                )}
            </div>

            {/* Action Button */}
            {toast.action && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toast.action?.onClick();
                        onClose();
                    }}
                    className="flex-shrink-0 text-xs font-semibold text-primary-600 hover:text-primary-700 px-2 py-1 rounded-md hover:bg-primary-50 transition-colors bg-white/50 border border-primary-100"
                >
                    {toast.action.label}
                </button>
            )}

            {/* Vertical Divider */}
            <div className="h-4 w-px bg-slate-100 flex-shrink-0 mx-1" />

            {/* Close Button */}
            <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 mt-0.5"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
