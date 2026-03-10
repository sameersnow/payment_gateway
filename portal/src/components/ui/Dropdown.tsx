import { ReactNode, useState, useContext, createContext } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
}

const DropdownContext = createContext<{
  close: () => void;
} | undefined>(undefined);

export function Dropdown({ trigger, children, align = 'end' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownContext.Provider value={{ close: () => setIsOpen(false) }}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="cursor-pointer inline-flex">{trigger}</div>
        </PopoverTrigger>
        <PopoverContent align={align} className="p-1 w-56 animate-fade-in shadow-dropdown border-slate-200">
          {children}
        </PopoverContent>
      </Popover>
    </DropdownContext.Provider>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  icon?: ReactNode;
}

export function DropdownItem({ children, onClick, danger, icon }: DropdownItemProps) {
  const context = useContext(DropdownContext);

  const handleClick = () => {
    if (onClick) onClick();
    context?.close();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors rounded-md
        ${danger
          ? 'text-error-600 hover:bg-error-50'
          : 'text-slate-700 hover:bg-slate-50'
        }
      `}
    >
      {icon && <span className="text-slate-400 w-4 h-4 flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 border-t border-slate-100" />;
}
