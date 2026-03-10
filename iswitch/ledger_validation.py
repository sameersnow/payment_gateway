"""
Ledger consistency validation utilities for iSwitch.
Ensures data integrity between Orders, Transactions, Ledger, and TigerBeetle.
"""

import frappe
from frappe.utils import now, add_days
from iswitch.tigerbeetle_client import get_client


@frappe.whitelist()
def validate_ledger_consistency():
    """
    Main validation function - runs all consistency checks.
    Should be run daily via scheduler.
    """
    results = {
        "timestamp": now(),
        "status": "ok",
        "checks": {}
    }
    
    # Check 1: Missing ledger entries
    missing_ledgers = check_missing_ledger_entries()
    results["checks"]["missing_ledgers"] = missing_ledgers
    if missing_ledgers["count"] > 0:
        results["status"] = "issues_found"
    
    # Check 2: Balance consistency
    balance_issues = check_balance_consistency()
    results["checks"]["balance_consistency"] = balance_issues
    if balance_issues["count"] > 0:
        results["status"] = "issues_found"
    
    # Check 3: TigerBeetle vs Ledger reconciliation
    reconciliation = reconcile_tigerbeetle_ledger()
    results["checks"]["tigerbeetle_reconciliation"] = reconciliation
    if reconciliation["discrepancies_count"] > 0:
        results["status"] = "issues_found"
    
    # Log if issues found
    if results["status"] == "issues_found":
        frappe.log_error(
            title="Ledger Consistency Issues Found",
            message=frappe.as_json(results, indent=2)
        )
    
    return results


def check_missing_ledger_entries():
    """
    Find processed orders without ledger entries.
    """
    try:
        missing = frappe.db.sql("""
            SELECT 
                o.name as order_id,
                o.merchant_ref_id,
                o.status,
                o.order_amount,
                o.creation
            FROM `tabOrder` o
            LEFT JOIN `tabLedger` l ON o.name = l.order
            WHERE o.status IN ('Processed', 'Cancelled')
            AND l.name IS NULL
            ORDER BY o.creation DESC
        """, as_dict=True)
        
        if missing:
            frappe.log_error(
                title="Missing Ledger Entries",
                message=f"Found {len(missing)} orders without ledger entries:\n{frappe.as_json(missing, indent=2)}"
            )
        
        return {
            "status": "alert" if missing else "ok",
            "count": len(missing),
            "orders": missing[:10]  # Return first 10 for review
        }
        
    except Exception as e:
        frappe.log_error(
            title="Missing Ledger Check Error",
            message=f"Failed to check missing ledgers: {str(e)}"
        )
        return {"status": "error", "message": str(e)}


def check_balance_consistency():
    """
    Verify that ledger balances are sequential and consistent.
    Opening balance of entry N should equal closing balance of entry N-1.
    """
    try:
        issues = []
        
        # Get all merchants
        merchants = frappe.get_all("Merchant", pluck="name")
        
        for merchant in merchants:
            # Get ledger entries in chronological order
            ledgers = frappe.db.sql("""
                SELECT 
                    name,
                    order,
                    opening_balance,
                    closing_balance,
                    transaction_type,
                    creation
                FROM `tabLedger`
                WHERE owner = %s AND docstatus = 1
                ORDER BY creation ASC
            """, (merchant,), as_dict=True)
            
            for i in range(1, len(ledgers)):
                prev_closing = ledgers[i-1].closing_balance
                current_opening = ledgers[i].opening_balance
                
                # Allow 0.01 difference for rounding
                if abs(prev_closing - current_opening) > 0.01:
                    issues.append({
                        "merchant": merchant,
                        "ledger_id": ledgers[i].name,
                        "order": ledgers[i].order,
                        "expected_opening": prev_closing,
                        "actual_opening": current_opening,
                        "difference": current_opening - prev_closing
                    })
        
        if issues:
            frappe.log_error(
                title="Balance Consistency Issues",
                message=f"Found {len(issues)} balance inconsistencies:\n{frappe.as_json(issues, indent=2)}"
            )
        
        return {
            "status": "alert" if issues else "ok",
            "count": len(issues),
            "issues": issues[:10]  # Return first 10
        }
        
    except Exception as e:
        frappe.log_error(
            title="Balance Consistency Check Error",
            message=f"Failed to check balance consistency: {str(e)}"
        )
        return {"status": "error", "message": str(e)}


def reconcile_tigerbeetle_ledger():
    """
    Compare TigerBeetle balances with latest ledger closing balances.
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
                        "merchant_name": merchant.company_name,
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
                    SELECT closing_balance, name, creation
                    FROM `tabLedger`
                    WHERE owner = %s AND docstatus = 1
                    ORDER BY creation DESC
                    LIMIT 1
                """, (merchant.name,), as_dict=True)
                
                if not latest_ledger:
                    # No ledger entries yet - balance should be 0
                    if abs(tb_balance) > 0.01:
                        discrepancies.append({
                            "merchant": merchant.name,
                            "merchant_name": merchant.company_name,
                            "tigerbeetle_balance": tb_balance,
                            "ledger_balance": 0,
                            "difference": tb_balance,
                            "issue": "No ledger entries but TigerBeetle has balance"
                        })
                    continue
                
                ledger_balance = latest_ledger[0].closing_balance
                
                # Check for discrepancy (allow 0.01 difference for rounding)
                if abs(tb_balance - ledger_balance) > 0.01:
                    discrepancies.append({
                        "merchant": merchant.name,
                        "merchant_name": merchant.company_name,
                        "tigerbeetle_balance": tb_balance,
                        "ledger_balance": ledger_balance,
                        "difference": tb_balance - ledger_balance,
                        "latest_ledger": latest_ledger[0].name,
                        "ledger_date": latest_ledger[0].creation
                    })
                    
            except Exception as e:
                discrepancies.append({
                    "merchant": merchant.name,
                    "merchant_name": merchant.get("company_name", ""),
                    "issue": f"Error: {str(e)}"
                })
        
        if discrepancies:
            frappe.log_error(
                title="TigerBeetle-Ledger Reconciliation Issues",
                message=f"Found {len(discrepancies)} discrepancies:\n{frappe.as_json(discrepancies, indent=2)}"
            )
        
        return {
            "status": "alert" if discrepancies else "ok",
            "discrepancies_count": len(discrepancies),
            "total_merchants": len(merchants),
            "discrepancies": discrepancies[:10]  # Return first 10
        }
        
    except Exception as e:
        frappe.log_error(
            title="TigerBeetle Reconciliation Error",
            message=f"Failed to reconcile: {str(e)}"
        )
        return {"status": "error", "message": str(e)}


@frappe.whitelist()
def fix_missing_ledger_entry(order_id):
    """
    Manually create missing ledger entry for an order.
    Use with caution - only for fixing data integrity issues.
    """
    try:
        order = frappe.get_doc("Order", order_id)
        
        # Check if ledger already exists
        existing = frappe.db.exists("Ledger", {"order": order_id})
        if existing:
            return {"status": "error", "message": "Ledger entry already exists"}
        
        # Get merchant TigerBeetle balance
        merchant = frappe.get_doc("Merchant", order.merchant_ref_id)
        if not merchant.tigerbeetle_id:
            return {"status": "error", "message": "Merchant has no TigerBeetle account"}
        
        client = get_client()
        account_id = int(merchant.tigerbeetle_id)
        accounts = client.lookup_accounts([account_id])
        
        if not accounts:
            return {"status": "error", "message": "TigerBeetle account not found"}
        
        account = accounts[0]
        current_balance = (
            account.credits_posted 
            - account.debits_posted 
            - account.debits_pending
        ) / 100
        
        # Get transaction
        transaction = frappe.get_doc("Transaction", {"order": order_id})
        
        # Create ledger entry
        ledger = frappe.get_doc({
            "doctype": "Ledger",
            "order": order.name,
            "transaction_type": "Debit" if order.status == "Processed" else "Credit",
            "status": "Success" if order.status == "Processed" else "Reversed",
            "transaction_id": transaction.name,
            "client_ref_id": order.client_ref_id,
            "opening_balance": current_balance,  # Current balance as opening
            "closing_balance": current_balance   # Same as closing (manual fix)
        }).insert(ignore_permissions=True)
        
        ledger.submit()
        
        return {
            "status": "success",
            "message": f"Created ledger entry {ledger.name}",
            "ledger_id": ledger.name
        }
        
    except Exception as e:
        frappe.log_error(
            title="Fix Missing Ledger Error",
            message=f"Failed to fix ledger for {order_id}: {str(e)}"
        )
        return {"status": "error", "message": str(e)}
