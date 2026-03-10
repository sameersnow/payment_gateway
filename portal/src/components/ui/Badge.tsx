import { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'slate' | 'primary' | 'outline' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  error: 'bg-error-50 text-error-700',
  slate: 'bg-slate-100 text-slate-700',
  primary: 'bg-primary-50 text-primary-700',
  outline: 'bg-white border border-slate-200 text-slate-600',
  info: 'bg-blue-50 text-blue-700',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  slate: 'bg-slate-400',
  primary: 'bg-primary-500',
  outline: 'bg-slate-400',
  info: 'bg-blue-500',
};

export function Badge({ children, variant = 'slate', size = 'sm', dot }: BadgeProps) {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variants[variant]} ${sizeStyles}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
