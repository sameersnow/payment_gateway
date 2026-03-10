
// Common Data Models
// Extracted from legacy services

export interface User {
    name: string;
    email: string;
    full_name: string;
    user_image?: string;
    roles: string[];
}

export interface UserContext {
    user: User;
    merchant?: {
        name: string;
        company_name: string;
        status: string;
        balance: number;
        onboarding_completed?: number;
        kyc_status?: string;
        logo?: string;
        role?: string;
    };
    isAdmin: boolean;
    isMerchant: boolean;
    appName?: string;
    appLogo?: string;
}

export interface DashboardStats {
    wallet: {
        balance: number;
        status: string;
    };
    stats: {
        total_orders: number;
        processed_orders: number;
        pending_orders: number;
        cancelled_orders: number;
        total_processed_amount: number;
        total_pending_amount: number;
        total_cancelled_amount: number;
        total_orders_amount: number;
    };
    metric_trends?: {
        volume_change_pct: number;
        success_rate_change_pct: number;
        orders_this_week: number;
        aov_change_pct: number;
    };
}

export interface Order {
    id: string;
    customer: string;
    amount: number;
    transaction_amount: number;
    tax: number;
    fee: number;
    status: string;
    utr: string | null;
    date: string;
    modified: string;
    ledger_ids: string[];
}

export interface LedgerEntry {
    id: string;
    order_id: string;
    type: string;
    transaction_amount: number;
    opening_balance: number;
    closing_balance: number;
    date: string;
    customer_name?: string;
    order_status?: string;
    fee?: number;
    tax?: number;
    order_amount?: number;
    product?: string;
    completion_date?: string;
}

export interface VANLog {
    id: string;
    account_number: string;
    amount: number;
    type: string;
    utr: string;
    status: string;
    opening_balance: number;
    closing_balance: number;
    remitter_name: string;
    remitter_account_number: string;
    remitter_ifsc_code: string;
    date: string;
    merchant: string;
}

export interface VirtualAccount {
    account_number: string;
    bank_name: string;
    ifsc_code: string;
    pending_balance: number;
    name?: string; // Sometimes returned as name
    merchant?: string;
}

export interface MerchantProfile {
    name: string;
    company_name: string;
    company_email: string;
    contact_detail: string;
    website: string;
    director_pan: string;
    director_adhar: string;
    company_pan: string;
    company_gst: string;
    webhook: string;
    status: string;
    logo?: string;
    bank_accounts: Array<{
        account_holder_name: string;
        account_number: string;
        ifsc_code: string;
        bank_name: string;
        status: string;
        is_primary?: number;
        cancel_cheque: string;
    }>;
}

export interface APIKey {
    id: string;
    name: string;
    key: string;
    environment: 'test' | 'live';
    created_at: string;
    last_used: string | null;
    status: 'active' | 'inactive';
}

export interface AdminDashboardStats {
    wallet: {
        balance: number;
        status: string;
    };
    stats: {
        total_orders: number;
        processed_orders: number;
        pending_orders: number;
        cancelled_orders: number;
        total_processed_amount: number;
        total_pending_amount: number;
        total_cancelled_amount: number;
        total_orders_amount: number;
        pending_settlements?: number;
    };
    chart_data: {
        categories: string[];
        series: Array<{
            name: string;
            data: number[];
        }>;
    };
    merchant_stats?: {
        total: number;
        active: number;
        pending: number;
        suspended: number;
    };
}

export interface Transaction {
    id: string;
    order_id: string;
    merchant_name: string;
    product_name: string;
    amount: number;
    status: string;
    date: string;
    utr: string;
    integration: string;
    customer_name?: string;
    customer_email?: string;
    payment_method?: string;
    name?: string;
    creation?: string;
    created_at?: string;
}

export interface Merchant {
    name: string;
    company_name: string;
    company_logo?: string;
    company_email: string;
    contact_detail: string;
    status: string;
    webhook?: string;
    integration: string;
    creation: string;
    wallet_balance: number;
    product_pricing: Array<{
        product: string;
        fee_type: string;
        fee: number;
        tax_fee_type: string;
        tax_fee: number;
        start_value: number;
        end_value: number;
    }>;
}

export interface Processor {
    name: string;
    integration_name: string;
    integration_type: string;
    api_endpoint: string;
    client_id: string;
    _secret_key: string;
    balance: number;
    is_active: number;
    products: string[];
}

export interface Service {
    name: string;
    product_name: string;
    description?: string;
    is_active: number;
}

export interface OnboardingStatus {
    merchant_id: string;
    onboarding_completed: number;
    current_step: number;
    completion_percentage: number;
    steps: {
        business_type: boolean;
        business_info: boolean;
        address: boolean;
        bank_account: boolean;
        documents: number;
    };
    data: {
        business_type: string;
        business_name: string;
        industry: string;
        description: string;
        website: string;
        country: string;
        address1: string;
        address2: string;
        city: string;
        state: string;
        postalCode: string;
        phone: string;
    };
    documents: {
        director_pan: string;
        director_adhar: string;
        company_pan: string;
        company_gst: string;
    };
}
