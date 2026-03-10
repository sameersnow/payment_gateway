import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FilterPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    activeFilterCount?: number;
}

export function FilterPanel({ isOpen, onToggle, children, activeFilterCount = 0 }: FilterPanelProps) {
    return (
        <div className="space-y-4">
            {/* Filter Toggle Button */}
            <div className="flex items-center justify-end">
                <button
                    onClick={onToggle}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-semibold text-white bg-primary-600 rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                    {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Collapsible Filter Content */}
            <div
                className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}
            >
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
