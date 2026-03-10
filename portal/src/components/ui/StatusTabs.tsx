export interface StatusTab {
    label: string;
    value: string;
    count: number;
    color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
}

interface StatusTabsProps {
    tabs: StatusTab[];
    activeTab: string;
    onChange: (value: string) => void;
}

export function StatusTabs({ tabs, activeTab, onChange }: StatusTabsProps) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.value;

                return (
                    <button
                        key={tab.value}
                        onClick={() => onChange(tab.value)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                            transition-all whitespace-nowrap
                            ${isActive
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }
                        `}
                    >
                        <span>{tab.label}</span>
                        <span
                            className={`
                                px-2 py-0.5 rounded-full text-xs font-semibold
                                ${isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }
                            `}
                        >
                            {tab.count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
