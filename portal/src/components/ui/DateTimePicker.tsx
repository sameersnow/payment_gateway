import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    isSameDay, 
    parseISO,
    isValid
} from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { cn } from '../../utils/cn';

interface DateTimePickerProps {
    value: string; // Format: YYYY-MM-DDTHH:mm:ss
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
}

export function DateTimePicker({ value, onChange, label, placeholder = 'Select date & time' }: DateTimePickerProps) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value ? parseISO(value) : new Date());

    // Update viewDate if value changes from outside
    useEffect(() => {
        if (value) {
            const dt = parseISO(value);
            if (isValid(dt)) {
                setViewDate(dt);
            }
        }
    }, [value]);

    const currentDate = value ? parseISO(value) : new Date();

    // Calendar generation
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd
    });

    const weekDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

    const handleDateSelect = (day: Date) => {
        const newDate = new Date(day);
        newDate.setHours(currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
        onChange(format(newDate, "yyyy-MM-dd'T'HH:mm:ss"));
    };

    const handleTimeChange = (type: 'hours' | 'minutes' | 'seconds', val: number) => {
        const newDate = new Date(currentDate);
        if (type === 'hours') newDate.setHours(val);
        if (type === 'minutes') newDate.setMinutes(val);
        if (type === 'seconds') newDate.setSeconds(val);
        onChange(format(newDate, "yyyy-MM-dd'T'HH:mm:ss"));
    };

    const formatDisplay = () => {
        if (!value) return placeholder;
        try {
            const dt = parseISO(value);
            if (!isValid(dt)) return placeholder;
            return format(dt, 'MMM d, yyyy, hh:mm:ss a');
        } catch (e) {
            return placeholder;
        }
    };

    return (
        <div className="relative">
            {label && (
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-1">
                    {label}
                </label>
            )}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-left flex items-center justify-between min-w-[220px] transition-all",
                            open && "ring-2 ring-primary-500 border-primary-500 shadow-sm"
                        )}
                    >
                        <span className="text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">{formatDisplay()}</span>
                        <CalendarIcon className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                    </button>
                </PopoverTrigger>
                <PopoverContent 
                    className="w-auto p-0 border-none shadow-2xl z-[100]" 
                    align="start" 
                    side="bottom"
                    sideOffset={2}
                    avoidCollisions={true}
                    collisionPadding={10}
                >
                    <div className="flex flex-col w-[240px] bg-white rounded-lg shadow-2xl ring-1 ring-slate-200 overflow-hidden">
                        {/* Calendar Header (Single line, ultra-compact) */}
                        <div className="p-2 bg-white border-b border-slate-50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">
                                    {format(viewDate, 'MMM yyyy')}
                                </span>
                                <div className="flex items-center gap-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setViewDate(subMonths(viewDate, 1))}
                                        className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewDate(addMonths(viewDate, 1))}
                                        className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Weekdays (Smaller) */}
                            <div className="grid grid-cols-7 gap-0.5 mt-2">
                                {weekDays.map(day => (
                                    <div key={day} className="h-5 flex items-center justify-center text-[9px] font-bold text-slate-400">
                                        {day.substring(0, 1)}
                                    </div>
                                ))}
                            </div>

                            {/* Days (Smaller buttons) */}
                            <div className="grid grid-cols-7 gap-0.5">
                                {days.map((day, idx) => {
                                    const isSelected = isSameDay(day, currentDate);
                                    const isCurrentMonth = isSameMonth(day, monthStart);
                                    const isToday = isSameDay(day, new Date());

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleDateSelect(day)}
                                            className={cn(
                                                "h-7 w-7 flex items-center justify-center rounded text-[11px] transition-all relative",
                                                !isCurrentMonth && "text-slate-100",
                                                isCurrentMonth && "text-slate-600 hover:bg-slate-100",
                                                isToday && !isSelected && "text-primary-600 font-bold",
                                                isSelected && "bg-primary-600 text-white font-bold transform scale-105 z-10"
                                            )}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Combined Time & Now (Ultra-compact) */}
                        <div className="p-2 bg-slate-50/50 space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-1.5 text-slate-900">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] font-bold">
                                        {format(currentDate, 'HH:mm:ss')}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const now = new Date();
                                        onChange(format(now, "yyyy-MM-dd'T'HH:mm:ss"));
                                        setViewDate(now);
                                    }}
                                    className="text-[9px] font-bold text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-widest"
                                >
                                    Now
                                </button>
                            </div>

                            <div className="space-y-2 px-1 pb-1">
                                {['hours', 'minutes', 'seconds'].map((type) => (
                                    <input 
                                        key={type}
                                        type="range" 
                                        min="0" 
                                        max={type === 'hours' ? 23 : 59} 
                                        value={type === 'hours' ? currentDate.getHours() : type === 'minutes' ? currentDate.getMinutes() : currentDate.getSeconds()}
                                        onChange={(e) => handleTimeChange(type as any, parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600 block"
                                    />
                                ))}
                            </div>
                        </div>

                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

