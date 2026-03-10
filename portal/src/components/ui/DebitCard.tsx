import { formatCurrency } from '../../utils/formatters';

interface DebitCardProps {
    balance: number;
    pendingBalance: number;
    merchantName: string;
    cardNumber?: string;
}

export function DebitCard({ balance, pendingBalance, merchantName, cardNumber = '****' }: DebitCardProps) {
    // Format card number to show last 4 digits
    const formattedCardNumber = cardNumber && cardNumber.length >= 4
        ? `**** **** **** ${cardNumber.slice(-4)}`
        : '**** **** **** ****';

    return (
        <div className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-300">
            {/* Background with multiple gradients and glassmorphism effect */}
            <div className="absolute inset-0 bg-[#0F172A]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600/30 via-transparent to-transparent"></div>
                <div className="absolute -top-1/2 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]"></div>
                <div className="absolute bottom-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            </div>

            {/* Decorative patterns */}
            <div className="absolute top-0 right-0 p-6 opacity-20">
                <div className="w-24 h-24 border-[16px] border-white rounded-full -mr-12 -mt-12"></div>
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col justify-between p-5 text-white">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Payout Account Balance</span>
                        <span className="text-xl sm:text-2xl font-bold mt-0.5 tabular-nums tracking-tight">
                            {formatCurrency(balance)}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center italic font-black text-xl sm:text-2xl tracking-tighter">
                            <span className="text-white">VISA</span>
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Debit</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-6 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md shadow-inner flex flex-col justify-around py-0.5">
                        <div className="w-full h-[1px] bg-yellow-600/20"></div>
                        <div className="w-full h-[1px] bg-yellow-600/20"></div>
                    </div>
                    <div className="text-xs sm:text-base font-mono tracking-[0.25em] text-slate-200">
                        {formattedCardNumber}
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div className="flex flex-col min-w-0 flex-1 mr-4">
                        <span className="text-[8px] font-medium uppercase tracking-widest text-slate-400">Card Holder</span>
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">
                            {merchantName}
                        </span>
                    </div>

                    <div className="flex flex-col items-end bg-black/20 backdrop-blur-md rounded-lg px-2 py-1.5 border border-white/5 shrink-0">
                        <div className="flex items-center gap-1 text-warning-400">
                            <div className="w-1 h-1 rounded-full bg-current animate-pulse"></div>
                            <span className="text-[8px] font-bold uppercase tracking-wider">Pending</span>
                        </div>
                        <span className="text-xs sm:text-sm font-semibold tabular-nums mt-0.5 leading-none">
                            {formatCurrency(pendingBalance)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
