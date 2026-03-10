"""
Monitoring utilities for iSwitch payment switch.
Provides health checks, error tracking, and alerting functionality.
"""

import frappe
from frappe.utils import now, add_days, get_datetime
import tigerbeetle as tb
from iswitch.tigerbeetle_client import get_client


@frappe.whitelist()
def check_tigerbeetle_health():
    """
    Check TigerBeetle connection health.
    Returns True if healthy, False otherwise.
    """
    try:
        client = get_client()
        # Try to lookup a known account (system account ID 1)
        accounts = client.lookup_accounts([1])
        return {
            "status": "healthy",
            "message": "TigerBeetle connection is working",
            "timestamp": now()
        }
    except Exception as e:
        frappe.log_error(
            title="TigerBeetle Health Check Failed",
            message=f"Health check failed: {str(e)}"
        )
        return {
            "status": "unhealthy",
            "message": f"TigerBeetle connection failed: {str(e)}",
            "timestamp": now()
        }


@frappe.whitelist()
def monitor_transaction_failures(hours=24):
    """
    Monitor failed transactions in the last N hours.
    Alerts if failure rate exceeds threshold.
    """
    try:
        from_time = add_days(now(), -1 * (hours / 24))
        
        # Get transaction statistics
        stats = frappe.db.sql("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) as success
            FROM `tabTransaction`
            WHERE creation >= %s
        """, (from_time,), as_dict=True)
        
        if not stats or not stats[0].total:
            return {
                "status": "ok",
                "message": "No transactions in the specified period",
                "total": 0,
                "failed": 0,
                "success": 0,
                "failure_rate": 0
            }
        
        total = stats[0].total
        failed = stats[0].failed or 0
        success = stats[0].success or 0
        failure_rate = (failed / total * 100) if total > 0 else 0
        
        # Alert if failure rate > 10%
        if failure_rate > 10:
            frappe.log_error(
                title="High Transaction Failure Rate",
                message=f"Failure rate: {failure_rate:.2f}% ({failed}/{total} transactions failed in last {hours} hours)"
            )
        
        return {
            "status": "alert" if failure_rate > 10 else "ok",
            "total": total,
            "failed": failed,
            "success": success,
            "failure_rate": round(failure_rate, 2),
            "threshold": 10,
            "period_hours": hours
        }
        
    except Exception as e:
        frappe.log_error(
            title="Transaction Monitoring Error",
            message=f"Failed to monitor transactions: {str(e)}"
        )
        return {"status": "error", "message": str(e)}


@frappe.whitelist()
def monitor_balance_discrepancies():
    """
    Check for balance discrepancies between TigerBeetle and Ledger.
    """
    try:
        discrepancies = []
        
        # Get all merchants with TigerBeetle accounts
        merchants = frappe.get_all(
            "Merchant",
            filters={"tigerbeetle_id": ["!=", ""]},
            fields=["name", "tigerbeetle_id", "company_name"]
        )
        
        client = get_client()
        
        for merchant in merchants:
            try:
                # Get TigerBeetle balance
                account_id = int(merchant.tigerbeetle_id)
                accounts = client.lookup_accounts([account_id])
                
                if not accounts:
                    discrepancies.append({
                        "merchant": merchant.name,
                        "issue": "TigerBeetle account not found"
                    })
                    continue
                
                account = accounts[0]
                tb_balance = (
                    account.credits_posted 
                    - account.debits_posted 
                    - account.debits_pending
                ) / 100
                
                # Get latest ledger balance
                latest_ledger = frappe.db.sql("""
                    SELECT closing_balance
                    FROM `tabLedger`
                    WHERE owner = %s AND docstatus = 1
                    ORDER BY creation DESC
                    LIMIT 1
                """, (merchant.name,), as_dict=True)
                
                ledger_balance = latest_ledger[0].closing_balance if latest_ledger else 0
                
                # Check for discrepancy (allow 0.01 difference for rounding)
                if abs(tb_balance - ledger_balance) > 0.01:
                    discrepancies.append({
                        "merchant": merchant.name,
                        "merchant_name": merchant.company_name,
                        "tigerbeetle_balance": tb_balance,
                        "ledger_balance": ledger_balance,
                        "difference": tb_balance - ledger_balance
                    })
                    
            except Exception as e:
                discrepancies.append({
                    "merchant": merchant.name,
                    "issue": f"Error checking balance: {str(e)}"
                })
        
        if discrepancies:
            frappe.log_error(
                title="Balance Discrepancies Detected",
                message=f"Found {len(discrepancies)} balance discrepancies:\n{frappe.as_json(discrepancies, indent=2)}"
            )
        
        return {
            "status": "alert" if discrepancies else "ok",
            "discrepancies": discrepancies,
            "total_checked": len(merchants),
            "timestamp": now()
        }
        
    except Exception as e:
        frappe.log_error(
            title="Balance Monitoring Error",
            message=f"Failed to monitor balances: {str(e)}"
        )
        return {"status": "error", "message": str(e)}


def log_critical_error(title, message, context=None):
    """
    Enhanced error logging with additional context.
    
    Args:
        title: Error title
        message: Error message
        context: Additional context (dict)
    """
    error_message = message
    
    if context:
        error_message += f"\n\nContext:\n{frappe.as_json(context, indent=2)}"
    
    frappe.log_error(title=title, message=error_message)
    
    # TODO: Integrate with external monitoring service (Sentry, etc.)
    # Example:
    # if frappe.conf.get("sentry_dsn"):
    #     import sentry_sdk
    #     sentry_sdk.capture_message(title, level="error", extras=context)


@frappe.whitelist()
def run_all_health_checks():
    """
    Run all health checks and return combined status.
    Useful for monitoring dashboards.
    """
    results = {
        "timestamp": now(),
        "overall_status": "healthy",
        "checks": {}
    }
    
    # TigerBeetle health
    tb_health = check_tigerbeetle_health()
    results["checks"]["tigerbeetle"] = tb_health
    if tb_health["status"] != "healthy":
        results["overall_status"] = "unhealthy"
    
    # Transaction failures
    tx_monitor = monitor_transaction_failures(hours=24)
    results["checks"]["transaction_failures"] = tx_monitor
    if tx_monitor["status"] == "alert":
        results["overall_status"] = "warning"
    
    # Balance discrepancies
    balance_monitor = monitor_balance_discrepancies()
    results["checks"]["balance_discrepancies"] = balance_monitor
    if balance_monitor["status"] == "alert":
        results["overall_status"] = "warning"
    
    return results
