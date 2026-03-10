import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { cn } from '../../utils/cn';

interface DateTimePickerProps {
    value: string; // Format: YYYY-MM-DDTHH:mm:ss
    onChange: (value: string) => void;
    label?: string;
}

export function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
    const [open, setOpen] = useState(false);

    // Parse the datetime value
    const parseDateTime = (val: string) => {
        if (!val) {
            const now = new Date();
            return {
                date: now.toISOString().split('T')[0],
                hours: String(now.getHours()).padStart(2, '0'),
                minutes: String(now.getMinutes()).padStart(2, '0'),
                seconds: '00'
            };
        }

        const [datePart, timePart] = val.split('T');
        const [hours = '00', minutes = '00', seconds = '00'] = (timePart || '00:00:00').split(':');

        return {
            date: datePart,
            hours: hours.padStart(2, '0'),
            minutes: minutes.padStart(2, '0'),
            seconds: seconds.padStart(2, '0')
        };
    };

    const { date, hours, minutes, seconds } = parseDateTime(value);

    // Format display value
    const formatDisplay = () => {
        if (!value) return 'Select date & time';
        const dt = new Date(`${date}T${hours}:${minutes}:${seconds}`);
        return dt.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    // Update datetime
    const updateDateTime = (newDate?: string, newHours?: string, newMinutes?: string, newSeconds?: string) => {
        const finalDate = newDate || date;
        const finalHours = (newHours || hours).padStart(2, '0');
        const finalMinutes = (newMinutes || minutes).padStart(2, '0');
        const finalSeconds = (newSeconds || seconds).padStart(2, '0');

        onChange(`${finalDate}T${finalHours}:${finalMinutes}:${finalSeconds}`);
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
                            "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-left flex items-center justify-between",
                            open && "ring-2 ring-primary-500 border-primary-500"
                        )}
                    >
                        <span className="text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">{formatDisplay()}</span>
                        <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
                            <Calendar className="w-4 h-4" />
                            <Clock className="w-4 h-4" />
                        </div>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                    <div className="min-w-[320px]">
                        {/* Date Input */}
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => updateDateTime(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Time Inputs */}
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Time (HH:MM:SS)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {/* Hours */}
                                <div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={hours}
                                        onChange={(e) => {
                                            const val = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
                                            updateDateTime(undefined, String(val).padStart(2, '0'));
                                        }}
                                        className="w-full px-2 py-2 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="HH"
                                    />
                                    <div className="text-xs text-slate-400 text-center mt-1">Hours</div>
                                </div>

                                {/* Minutes */}
                                <div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={minutes}
                                        onChange={(e) => {
                                            const val = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                                            updateDateTime(undefined, undefined, String(val).padStart(2, '0'));
                                        }}
                                        className="w-full px-2 py-2 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="MM"
                                    />
                                    <div className="text-xs text-slate-400 text-center mt-1">Minutes</div>
                                </div>

                                {/* Seconds */}
                                <div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={seconds}
                                        onChange={(e) => {
                                            const val = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                                            updateDateTime(undefined, undefined, undefined, String(val).padStart(2, '0'));
                                        }}
                                        className="w-full px-2 py-2 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="SS"
                                    />
                                    <div className="text-xs text-slate-400 text-center mt-1">Seconds</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const now = new Date();
                                    updateDateTime(
                                        now.toISOString().split('T')[0],
                                        String(now.getHours()).padStart(2, '0'),
                                        String(now.getMinutes()).padStart(2, '0'),
                                        String(now.getSeconds()).padStart(2, '0')
                                    );
                                }}
                                className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Now
                            </button>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
