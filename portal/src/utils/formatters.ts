import { format, formatDistanceToNow } from 'date-fns';

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format account number with masking
 */
export function formatAccountNumber(accountNumber: string, visibleDigits: number = 4): string {
  if (!accountNumber) return '-';
  if (accountNumber.length <= visibleDigits) return accountNumber;

  const masked = '*'.repeat(accountNumber.length - visibleDigits);
  const visible = accountNumber.slice(-visibleDigits);
  return masked + visible;
}

/**
 * Format IFSC code
 */
export function formatIFSC(ifsc: string): string {
  if (!ifsc) return '-';
  return ifsc.toUpperCase();
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '-';
  // Format as +91 XXXXX XXXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    return format(new Date(date), 'MMM d, yyyy');
  } catch (error) {
    return '-';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    return format(new Date(date), 'MMM d, yyyy, h:mm a');
  } catch (error) {
    return '-';
  }
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (error) {
    return '-';
  }
}

export function truncateId(id: string, length: number = 8): string {
  if (id.length <= length) return id;
  return `${id.slice(0, length)}...`;
}

export function maskCardNumber(last4: string): string {
  return `•••• ${last4}`;
}

export function maskBankAccount(account: string): string {
  return account;
}
