import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export function Sheet({ isOpen, onClose, title, description, children, className, size = 'md' }: SheetProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                    <div
                        className={cn(
                            "pointer-events-auto w-screen transform transition ease-in-out duration-300 sm:duration-300 translate-x-0",
                            sizes[size],
                            className
                        )}
                    >
                        <div className="flex h-full flex-col overflow-y-auto bg-white shadow-2xl animate-slide-in-right">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
                                <div>
                                    {title && (
                                        <h2 className="text-lg font-semibold text-slate-900 leading-6">
                                            {title}
                                        </h2>
                                    )}
                                    {description && (
                                        <p className="mt-1 text-sm text-slate-500">
                                            {description}
                                        </p>
                                    )}
                                </div>
                                <div className="ml-3 flex h-7 items-center">
                                    <button
                                        type="button"
                                        className="relative rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="absolute -inset-2.5" />
                                        <span className="sr-only">Close panel</span>
                                        <X className="w-5 h-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                            <div className="relative flex-1 px-4 sm:px-6 pb-6 pt-0" style={{ paddingTop: 0 }}>
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
