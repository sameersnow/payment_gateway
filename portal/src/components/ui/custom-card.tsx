import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddings = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-4 sm:p-6 lg:p-8',
};

export function Card({ children, className = '', padding = 'md', hover }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl border border-slate-200 shadow-card
        ${paddings[padding]}
        ${hover ? 'transition-shadow hover:shadow-soft cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
