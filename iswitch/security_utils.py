"""
Security utilities for iSwitch payment switch.
Provides webhook validation, rate limiting, and request logging.
"""

import frappe
import hashlib
import hmac
import time
from functools import wraps
from frappe.utils import now


def validate_webhook_signature(payload, signature, secret_key, algorithm="sha256"):
    """
    Validate webhook signature to ensure authenticity.
    
    Args:
        payload: Request payload (string or dict)
        signature: Signature from webhook header
        secret_key: Secret key for validation
        algorithm: Hash algorithm (default: sha256)
    
    Returns:
        True if valid, False otherwise
    """
    try:
        if isinstance(payload, dict):
            payload = frappe.as_json(payload, indent=None)
        
        if isinstance(payload, str):
            payload = payload.encode('utf-8')
        
        # Calculate expected signature
        if algorithm == "sha256":
            expected_signature = hmac.new(
                secret_key.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()
        elif algorithm == "sha512":
            expected_signature = hmac.new(
                secret_key.encode('utf-8'),
                payload,
                hashlib.sha512
            ).hexdigest()
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        # Constant-time comparison to prevent timing attacks
        return hmac.compare_digest(signature, expected_signature)
        
    except Exception as e:
        frappe.log_error(
            title="Webhook Signature Validation Error",
            message=f"Failed to validate signature: {str(e)}"
        )
        return False


def rate_limit(max_requests=10, window_seconds=60, key_func=None):
    """
    Rate limiting decorator for API endpoints.
    
    Args:
        max_requests: Maximum requests allowed in window
        window_seconds: Time window in seconds
        key_func: Function to generate rate limit key (default: uses IP + endpoint)
    
    Usage:
        @rate_limit(max_requests=5, window_seconds=60)
        @frappe.whitelist(allow_guest=True)
        def my_api():
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate rate limit key
            if key_func:
                key = key_func()
            else:
                ip = frappe.local.request_ip or "unknown"
                endpoint = func.__name__
                key = f"rate_limit:{ip}:{endpoint}"
            
            # Get current request count
            cache_key = f"{key}:{int(time.time() // window_seconds)}"
            request_count = frappe.cache().get(cache_key) or 0
            
            if request_count >= max_requests:
                frappe.throw(
                    f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds.",
                    frappe.RateLimitExceededError
                )
            
            # Increment counter
            frappe.cache().setex(cache_key, window_seconds, request_count + 1)
            
            # Call original function
            return func(*args, **kwargs)
        
        return wrapper
    return decorator


def log_api_request(endpoint, method, params=None, response_status=None, error=None):
    """
    Log API request for audit trail.
    
    Args:
        endpoint: API endpoint name
        method: HTTP method
        params: Request parameters (will be sanitized)
        response_status: Response status code
        error: Error message if any
    """
    try:
        # Sanitize sensitive data
        sanitized_params = sanitize_sensitive_data(params) if params else {}
        
        log_entry = {
            "timestamp": now(),
            "endpoint": endpoint,
            "method": method,
            "ip": frappe.local.request_ip or "unknown",
            "user": frappe.session.user,
            "params": sanitized_params,
            "response_status": response_status,
            "error": error
        }
        
        # Log to custom doctype or file
        # For now, using Frappe's error log
        if error:
            frappe.log_error(
                title=f"API Request Failed: {endpoint}",
                message=frappe.as_json(log_entry, indent=2)
            )
        
        # TODO: Store in custom API Log doctype for better querying
        # frappe.get_doc({
        #     "doctype": "API Request Log",
        #     **log_entry
        # }).insert(ignore_permissions=True)
        
    except Exception as e:
        # Don't fail the request if logging fails
        frappe.log_error(
            title="API Request Logging Error",
            message=f"Failed to log request: {str(e)}"
        )


def sanitize_sensitive_data(data):
    """
    Remove sensitive fields from data before logging.
    
    Args:
        data: Dictionary to sanitize
    
    Returns:
        Sanitized dictionary
    """
    if not isinstance(data, dict):
        return data
    
    sensitive_fields = [
        "password",
        "secret_key",
        "api_key",
        "access_token",
        "refresh_token",
        "client_secret",
        "private_key",
        "card_number",
        "cvv",
        "pin"
    ]
    
    sanitized = data.copy()
    
    for field in sensitive_fields:
        if field in sanitized:
            sanitized[field] = "***REDACTED***"
    
    return sanitized


def verify_ip_whitelist(ip_address, merchant_id):
    """
    Verify if IP address is whitelisted for merchant.
    
    Args:
        ip_address: IP address to check
        merchant_id: Merchant ID
    
    Returns:
        True if whitelisted or no whitelist configured, False otherwise
    """
    try:
        # Get merchant IP whitelist
        whitelist = frappe.db.get_value(
            "Merchant",
            merchant_id,
            "ip_whitelist"
        )
        
        if not whitelist:
            # No whitelist configured - allow all
            return True
        
        # Parse whitelist (comma-separated IPs)
        allowed_ips = [ip.strip() for ip in whitelist.split(",")]
        
        return ip_address in allowed_ips
        
    except Exception as e:
        frappe.log_error(
            title="IP Whitelist Check Error",
            message=f"Failed to check IP whitelist: {str(e)}"
        )
        # Fail closed - deny access on error
        return False


def api_key_auth(require_merchant=True):
    """
    Decorator for API key authentication.
    
    Args:
        require_merchant: If True, validates merchant API key
    
    Usage:
        @api_key_auth(require_merchant=True)
        @frappe.whitelist(allow_guest=True)
        def my_api():
            merchant_id = frappe.local.merchant_id
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get API key from header
            api_key = frappe.get_request_header("X-API-Key")
            
            if not api_key:
                frappe.throw("API key required", frappe.AuthenticationError)
            
            if require_merchant:
                # Validate merchant API key
                merchant = frappe.db.get_value(
                    "Merchant",
                    {"api_key": api_key},
                    ["name", "status"],
                    as_dict=True
                )
                
                if not merchant:
                    frappe.throw("Invalid API key", frappe.AuthenticationError)
                
                if merchant.status != "Approved":
                    frappe.throw("Merchant account not active", frappe.PermissionError)
                
                # Check IP whitelist
                ip = frappe.local.request_ip
                if not verify_ip_whitelist(ip, merchant.name):
                    frappe.log_error(
                        title="IP Whitelist Violation",
                        message=f"IP {ip} not whitelisted for merchant {merchant.name}"
                    )
                    frappe.throw("IP address not authorized", frappe.PermissionError)
                
                # Store merchant ID in local context
                frappe.local.merchant_id = merchant.name
            
            # Call original function
            return func(*args, **kwargs)
        
        return wrapper
    return decorator
