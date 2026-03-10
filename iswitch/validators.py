"""
Input validation utilities for iSwitch APIs
Prevents SQL injection and validates user inputs
"""

# Whitelist of allowed sort fields for Orders
ALLOWED_ORDER_SORT_FIELDS = [
    'creation', 'modified', 'order_amount', 'status', 
    'customer_name', 'merchant_ref_id', 'utr', 'name'
]

# Whitelist of allowed sort fields for Transactions
ALLOWED_TRANSACTION_SORT_FIELDS = [
    'creation', 'modified', 'amount', 'status', 
    'merchant', 'integration', 'transaction_date', 'name'
]

# Whitelist of allowed sort fields for Merchants
ALLOWED_MERCHANT_SORT_FIELDS = [
    'creation', 'modified', 'company_name', 'status', 
    'name', 'contact_detail'
]

# Whitelist of allowed sort fields for VAN Logs
ALLOWED_VAN_LOG_SORT_FIELDS = [
    'creation', 'modified', 'amount', 'status', 
    'account_number', 'transaction_type', 'name'
]

# Whitelist of allowed sort fields for Virtual Accounts
ALLOWED_VIRTUAL_ACCOUNT_SORT_FIELDS = [
    'creation', 'modified', 'account_number', 'status', 
    'merchant', 'name'
]

# Whitelist of allowed sort fields for Ledger
ALLOWED_LEDGER_SORT_FIELDS = [
    'creation', 'modified', 'transaction_amount', 'status', 
    'transaction_type', 'name'
]

# Whitelist of allowed sort orders
ALLOWED_SORT_ORDERS = ['ASC', 'DESC']


def validate_sort_field(field, allowed_fields, default='creation'):
    """
    Validate sort field against whitelist
    
    Args:
        field: The field name to validate
        allowed_fields: List of allowed field names
        default: Default field to return if validation fails
        
    Returns:
        Validated field name or default
    """
    if field and field in allowed_fields:
        return field
    return default


def validate_sort_order(order, default='DESC'):
    """
    Validate sort order against whitelist
    
    Args:
        order: The sort order to validate (ASC/DESC)
        default: Default order to return if validation fails
        
    Returns:
        Validated sort order or default
    """
    if order and order.upper() in ALLOWED_SORT_ORDERS:
        return order.upper()
    return default


def validate_page_number(page, default=1):
    """
    Validate and sanitize page number
    
    Args:
        page: Page number to validate
        default: Default page number if validation fails
        
    Returns:
        Validated page number as integer
    """
    try:
        page_num = int(page)
        return page_num if page_num > 0 else default
    except (ValueError, TypeError):
        return default


def validate_page_size(page_size, default=10, max_size=100):
    """
    Validate and sanitize page size
    
    Args:
        page_size: Page size to validate
        default: Default page size if validation fails
        max_size: Maximum allowed page size
        
    Returns:
        Validated page size as integer
    """
    try:
        size = int(page_size)
        if size <= 0:
            return default
        return min(size, max_size)  # Cap at max_size
    except (ValueError, TypeError):
        return default
