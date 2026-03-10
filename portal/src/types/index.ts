export type UserRole = 'merchant' | 'admin' | 'super_admin';
export type MerchantStatus = 'pending' | 'under_review' | 'active' | 'suspended';
export type TransactionStatus = 'succeeded' | 'pending' | 'failed' | 'refunded';
export type SettlementStatus = 'scheduled' | 'processing' | 'paid' | 'failed';
export type KYCStatus = 'not_submitted' | 'pending_review' | 'verified' | 'rejected';

export interface MerchantProductConfig {
  payouts: boolean;
  upi: boolean;
  virtualAccounts: boolean;
}

export interface ProductFee {
  percentage: number;
  fixed: number;
}

export interface MerchantFeeConfig {
  payouts: ProductFee;
  upi: ProductFee;
  virtualAccounts: ProductFee;
}

export interface MerchantProcessorConfig {
  payouts: string;
  upi: string;
  virtualAccounts: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Merchant {
  id: string;
  userId: string;
  businessName: string;
  businessType: 'individual' | 'company';
  website?: string;
  industry: string;
  status: MerchantStatus;
  kycStatus: KYCStatus;
  kyc_status?: string; // API snake_case support
  onboarding_completed?: number; // Added based on usage checks
  isLive: boolean;
  balance: number;
  pendingBalance: number;
  totalVolume: number;
  products: MerchantProductConfig;
  fees: MerchantFeeConfig;
  processorConfig: MerchantProcessorConfig;
  createdAt: string;
}

export interface Transaction {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod: string;
  cardBrand?: string;
  cardLast4?: string;
  customerEmail: string;
  customerName: string;
  description?: string;
  orderId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  merchantId: string;
  transactionId?: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  createdAt: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Settlement {
  id: string;
  merchantId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: SettlementStatus;
  bankAccount: string;
  transactionCount: number;
  periodStart: string;
  periodEnd: string;
  expectedDate: string;
  paidDate?: string;
}

export interface LedgerEntry {
  id: string;
  merchantId: string;
  type: 'payment' | 'refund' | 'fee' | 'settlement' | 'adjustment';
  description: string;
  credit: number;
  debit: number;
  balance: number;
  transactionId?: string;
  settlementId?: string;
  createdAt: string;
}

export interface APIKey {
  id: string;
  merchantId: string;
  name: string;
  keyPrefix: string;
  type: 'publishable' | 'secret';
  environment: 'test' | 'live';
  lastUsed?: string;
  createdAt: string;
}

export interface Webhook {
  id: string;
  merchantId: string;
  url: string;
  events: string[];
  status: 'active' | 'disabled';
  secret: string;
  createdAt: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  status: 'delivered' | 'failed';
  responseCode?: number;
  payload: string;
  createdAt: string;
}

export interface KYCDocument {
  id: string;
  merchantId: string;
  type: 'id_proof' | 'business_registration' | 'bank_statement' | 'address_proof';
  fileName: string;
  fileUrl: string;
  status: KYCStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface TeamMember {
  id: string;
  merchantId: string;
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  status: 'active' | 'pending';
  invitedAt: string;
  joinedAt?: string;
}

export interface FundingAccount {
  id: string;
  merchantId: string;
  accountHolderName: string;
  accountNumber: string;
  accountNumberMasked: string;
  bankName: string;
  ifscCode: string;
  status: 'active' | 'pending' | 'removed';
  isPrimary: boolean;
  createdAt: string;
}

export interface VirtualAccount {
  id: string;
  merchantId: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  accountType: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type DepositStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DepositMethod = 'virtual_account' | 'manual';

export interface DepositTransaction {
  id: string;
  merchantId: string;
  amount: number;
  method: DepositMethod;
  status: DepositStatus;
  fundingAccountId?: string;
  virtualAccountId?: string;
  utrNumber?: string;
  transferDate?: string;
  remarks?: string;
  createdAt: string;
  completedAt?: string;
}
