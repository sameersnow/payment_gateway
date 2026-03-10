from pydoc import doc
import frappe
import json
import hmac
import hashlib
import base64
from typing import Dict, Any, Tuple
from frappe import _
from frappe.utils import now, get_datetime
from decimal import Decimal
import tigerbeetle as tb
from iswitch.tigerbeetle_client import get_client
from iswitch.order_webhook_handlers import (
            handle_topup_success,
            handle_topup_failure,
            handle_refund_success,
            handle_refund_failure
        )

def stable_id(value: str) -> int:
    return int(hashlib.sha256(value.encode()).hexdigest()[:32], 16)

def handle_transaction_failure(name, status, error_message):
    """
    Void authorized (pending) transfer on failure webhook.
    """
    try:
        doc = frappe.db.get_value(
            "Order",
            name,
            ["name", "merchant_ref_id", "transaction_amount","client_ref_id"],
            as_dict=True
        )
        transaction = frappe.db.get_value("Transaction", {"order": name}, ["name","docstatus"], as_dict=True)
        
        if transaction.docstatus == 1:
            frappe.throw("Transaction already processed")

        # merchant = frappe.get_doc("Merchant", doc.merchant_ref_id)
        merchant_tb_id = frappe.db.get_value(
            "Merchant",
            doc.merchant_ref_id,
            "tigerbeetle_id"
        )

        if not merchant_tb_id:
            frappe.throw("Merchant TB account missing")

        # frappe.set_user(doc.merchant_ref_id)

        client = get_client()

        merchant_account_id = int(merchant_tb_id)
        system_account_id = 1
        amount = int(Decimal(doc.transaction_amount) * 100)

        # 🔹 1️⃣ Balance BEFORE void
        acc_before = client.lookup_accounts([merchant_account_id])[0]

        opening_balance = (
            acc_before.credits_posted
            - acc_before.debits_posted
            - acc_before.debits_pending
        ) / 100

        # 🔐 Deterministic IDs
        auth_transfer_id = stable_id(f"auth-{doc.name}")
        void_transfer_id = stable_id(f"void-{doc.name}")

        # 🔹 VOID pending transfer
        void_transfer = tb.Transfer(
            id=void_transfer_id,
            debit_account_id=merchant_account_id,
            credit_account_id=system_account_id,
            amount=amount,
            pending_id=auth_transfer_id,
            user_data_128=0,
            user_data_64=0,
            user_data_32=0,
            timeout=0,
            ledger=1,
            code=400,
            flags=tb.TransferFlags.VOID_PENDING_TRANSFER,
            timestamp=0,
        )

        errors = client.create_transfers([void_transfer])

        if errors:
            error = errors[0]
            if error.result != tb.CreateTransferResult.EXISTS:
                frappe.throw(f"Void failed: {error.result}")
        
        # 🔹 3️⃣ Balance AFTER void
        acc_after = client.lookup_accounts([merchant_account_id])[0]

        closing_balance = (
            acc_after.credits_posted
            - acc_after.debits_posted
            - acc_after.debits_pending
        ) / 100
        

        frappe.db.set_value(
            "Order",
            doc.name,
            "status",
            f"{status}",
            update_modified=False
        )

        frappe.db.set_value(
            "Transaction",
            {"order": doc.name},
            {
                "status": f"{status}",
                "docstatus": 1
            },
            update_modified=False
        )
        # 🔹 Update Order
        # doc.status = status
        # doc.reason = error_message[:100]
        # doc.save(ignore_permissions=True)

        # 🔹 Update Transaction
        # transaction = frappe.get_doc("Transaction", {"order": name})
        # transaction.status = status
        # transaction.save(ignore_permissions=True)
        # transaction.submit()
        
        ledger = frappe.get_doc({
            "doctype": 'Ledger',
            "order": doc.name,
            "transaction_type": 'Credit',
            'status': status,
            'transaction_id': transaction.name,
            'client_ref_id': doc.client_ref_id,
            'opening_balance': opening_balance,
            "closing_balance": closing_balance
        }).insert(ignore_permissions=True)
        ledger.submit()
        
    except Exception as e:
        # frappe.db.rollback(save_point="webhook_process")
        frappe.log_error("Void Error", str(e))
        raise

def handle_transaction_success(name, status, transaction_reference_id):
    """
    Capture authorized (pending) transfer on success webhook.
    """
    try:
        doc = frappe.db.get_value("Order", name,["name", "merchant_ref_id", "transaction_amount","client_ref_id"], as_dict=True)
        transaction = frappe.db.get_value("Transaction", {"order": name}, ["name","docstatus"], as_dict=True)

        if transaction.docstatus == 1:
            frappe.throw("Transaction already processed")

        # merchant = frappe.get_doc("Merchant", doc.merchant_ref_id)
        merchant_tb_id = frappe.db.get_value(
            "Merchant",
            doc.merchant_ref_id,
            "tigerbeetle_id"
        )
        if not merchant_tb_id:
            frappe.throw("Merchant TB account missing")

        # frappe.set_user(doc.merchant_ref_id)

        client = get_client()

        merchant_account_id = int(merchant_tb_id)
        system_account_id = 1
        amount = int(Decimal(doc.transaction_amount) * 100)

        # 🔐 Deterministic IDs
        auth_transfer_id = stable_id(f"auth-{doc.name}")
        capture_transfer_id = stable_id(f"capture-{doc.name}")

        # 🔹 POST pending transfer (Capture)
        capture = tb.Transfer(
            id=capture_transfer_id,
            debit_account_id=merchant_account_id,
            credit_account_id=system_account_id,
            amount=amount,
            pending_id=auth_transfer_id,
            user_data_128=0,
            user_data_64=0,
            user_data_32=0,
            timeout=0,
            ledger=1,
            code=400,
            flags=tb.TransferFlags.POST_PENDING_TRANSFER,
            timestamp=0,
        )

        errors = client.create_transfers([capture])

        if errors:
            error = errors[0]
            if error.result != tb.CreateTransferResult.EXISTS:
                frappe.throw(f"Capture failed: {error.result}")

        frappe.db.set_value(
            "Transaction",
            {"order": doc.name},
            {
                "status": f"{status}",
                "transaction_reference_id": transaction_reference_id,
                "docstatus": 1
            },
            update_modified=False
        )
        status = "Processed" if status == "Success" else status
        frappe.db.set_value(
            "Order",
            doc.name,
            "status",
            f"{status}",
            update_modified=False
        )
        # 🔹 Update Order
        # doc.status = "Processed" if status == "Success" else status
        # doc.utr = transaction_reference_id
        # doc.save(ignore_permissions=True)

        # 🔹 Update Transaction
        # transaction = frappe.get_doc("Transaction", {"order": name})
        # transaction.status = status
        # transaction.transaction_reference_id = transaction_reference_id
        # transaction.save(ignore_permissions=True)
        # transaction.submit()

    except Exception as e:
        # frappe.db.rollback(save_point="webhook_process")
        frappe.log_error("Capture Error", str(e))
        raise


@frappe.whitelist(allow_guest=True)
def blinkpe_webhook():
    """
    Blinkpe webhook endpoint to handle payment notifications.
    """
    try:
        if frappe.request.method != "POST":
            return frappe.response.update({
                "http_status_code": 405,
                "message": "Only POST method allowed",
                "status": "failed"
            })

        # Parse JSON payload
        try:
            payload = json.loads(frappe.request.data)
            webhook = frappe.get_doc({
                "doctype":"Blinkpe Webhook",
                "webhook_data":payload,
                "integration": "Airtel Payment Bank"
            }).insert(ignore_permissions=True)
            webhook.submit()
            frappe.db.commit()

            return {"status": "success", "message": "Webhook processed"}
            
        except json.JSONDecodeError:
            frappe.log_error("Invalid JSON in webhook request", "Xettle Webhook")
            return frappe.response.update({
                "http_status_code": 400,
                "message": "Invalid JSON payload",
                "status": "failed"
            })

    except Exception as e:
        frappe.log_error("Webhook processing error", str(e))
        return {
            "http_status_code": 500,
            "message": "Internal server error",
            "status": "failed"
        }

@frappe.whitelist(allow_guest=True)
def onepesa_webhook():
    try:
        if frappe.request.method != "POST":
            return frappe.response.update({
                "http_status_code": 405,
                "message": "Only POST method allowed",
                "status": "failed"
            })

        # Parse JSON payload
        try:
            payload = json.loads(frappe.request.data)
            webhook = frappe.get_doc({
                "doctype":"Blinkpe Webhook",
                "webhook_data":payload,
                "integration": "One Pesa"
            }).insert(ignore_permissions=True)
            webhook.submit()
            frappe.db.commit()
            frappe.enqueue("iswitch.webhook.process_webhook",
                doc=webhook,
                queue="short",
                timeout=300)
            
            return {"status": "success", "message": "Webhook processed"}
            
        except json.JSONDecodeError:
            frappe.log_error("Invalid JSON in webhook request", "Xettle Webhook")
            return frappe.response.update({
                "http_status_code": 400,
                "message": "Invalid JSON payload",
                "status": "failed"
            })

    except Exception as e:
        frappe.log_error("Webhook processing error", str(e))
        return {
            "http_status_code": 500,
            "message": "Internal server error",
            "status": "failed"
        }


@frappe.whitelist(allow_guest=True)
def tpipay_webhook():
    try:
        if frappe.request.method != "POST":
            return frappe.response.update({
                "http_status_code": 405,
                "message": "Only POST method allowed",
                "status": "failed"
            })

        # Parse JSON payload
        try:
            payload = json.loads(frappe.request.data)
            webhook = frappe.get_doc({
                "doctype":"Blinkpe Webhook",
                "webhook_data":payload,
                "integration": "TPI PAY"
            }).insert(ignore_permissions=True)
            webhook.submit()
            frappe.db.commit()
            frappe.enqueue("iswitch.webhook.process_webhook",
                doc=webhook,
                queue="short",
                timeout=300)
            
            return {"status": "success", "message": "Webhook processed"}
            
        except json.JSONDecodeError:
            frappe.log_error("Invalid JSON in webhook request", "Xettle Webhook")
            return frappe.response.update({
                "http_status_code": 400,
                "message": "Invalid JSON payload",
                "status": "failed"
            })

    except Exception as e:
        frappe.log_error("Webhook processing error", str(e))
        return {
            "http_status_code": 500,
            "message": "Internal server error",
            "status": "failed"
        }

def process_webhook(doc):
    frappe.db.savepoint("webhook_process")
    try:
        webhook_response, integration = frappe.db.get_value(
            "Blinkpe Webhook", doc.name, ["webhook_data", "integration"]
        )

        payload = json.loads(webhook_response)

        if integration == "Airtel Payment Bank":
            process_airtel_webhook(payload)
        elif integration == "One Pesa":
            process_onepesa_webhook(payload)
        elif integration == "TPI PAY":
            process_tpipay_webhook(payload)

    except Exception as e:
        frappe.db.rollback(save_point = "webhook_process")
        frappe.log_error("Error in processing webhook", str(e))
        
def process_onepesa_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        code = payload.get("code")
        if code == "0x0200":
            data = payload.get("data",{})
            if data.get("status","") == "SUCCESS":
                order_id = data.get("clientRefId")
                utr = data.get("utr")
                handle_transaction_success(order_id, "Success", utr)
                
        elif code == "0x0202":
            data = payload.get("data",{})
            if data.get("status","") == "FAILURE":
                order_id = data.get("clientRefId")
                remark = data.get("reason")
                handle_transaction_failure(order_id, "Failed", remark)

    except Exception as e:


def process_mock_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    # This is a mock webhook processor for testing purposes
    try:
        order_id = payload.get("order_id")
        status = payload.get("status")
        utr = payload.get("utr","")
        remark = payload.get("remark", "No remark provided")
        # frappe.log_error(f"Mock Webhook Received: Order {order_id}, Status: {status}, UTR: {utr}, Remark: {remark}", "Mock Webhook")
        
        # Check if it's a refund request
        if frappe.db.exists("Refund Request", order_id):
            refund_doc = frappe.get_doc("Refund Request", order_id)
            
            # Check if already processed
            if refund_doc.status == "Processed":
                frappe.log_error(f"Refund already processed: {order_id}", "Duplicate Webhook")
                return {"success": True, "message": f"Refund {order_id} already processed"}
            
            if status == "SUCCESS":
                handle_refund_success(order_id, utr)
                frappe.db.commit()
                return {"success": True, "message": f"Refund {order_id} processed successfully"}
            elif status == "FAILED" or status == "INSUFFICIENT_FUNDS":
                handle_refund_failure(order_id, "Failed", remark)
                frappe.db.commit()
                return {"success": True, "message": f"Refund {order_id} marked as failed"}
        
        # Otherwise, it's a regular order (Pay or Topup)
        else:
            order = frappe.get_doc("Order", order_id)
            
            # Route based on order type
            if order.order_type == "Topup":
                # Topup order webhook
                if status == "SUCCESS":
                    handle_topup_success(order_id, utr)
                    frappe.db.commit()
                    return {"success": True, "message": f"Topup {order_id} processed successfully"}
                elif status == "FAILED":
                    handle_topup_failure(order_id, "Failed", remark)
                    frappe.db.commit()
                    return {"success": True, "message": f"Topup {order_id} marked as failed"}
            
            elif order.order_type == "Pay":
                # Payout order webhook (existing logic)
                if status == "SUCCESS":
                    handle_transaction_success(order.name, "Success", utr)
                    frappe.db.commit()
                    return {"success": True, "message": f"Payout {order_id} processed successfully"}
                elif status == "FAILED":
                    handle_transaction_failure(order.name, "Failed", remark)
                    frappe.db.commit()
                    return {"success": True, "message": f"Payout {order_id} marked as failed"}
            
            else:
                frappe.log_error(f"Unknown order type: {order.order_type}", "Webhook Error")
                return {"success": False, "error": f"Unknown order type: {order.order_type}"}
        
    except Exception as e:
        frappe.log_error("Error processing mock webhook", str(e))
        return {"success": False, "error": str(e)}
    

def process_tpipay_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    # This is a mock webhook processor for testing purposes
    try:
        order_type = "payin"
        order_id = payload.get("order_id")
        status = payload.get("status")
        utr = payload.get("utr","")
        remark = payload.get("message", "No remark provided")
        
        # Route based on order type
        if order_type == "payin":
            # Topup order webhook
            if status == "SUCCESS":
                handle_topup_success(order_id, utr)
                frappe.db.commit()
                return {"success": True, "message": f"Topup {order_id} processed successfully"}
            elif status == "FAILED":
                handle_topup_failure(order_id, "Failed", remark)
                frappe.db.commit()
                return {"success": True, "message": f"Topup {order_id} marked as failed"}
        
        elif order_type == "payout":
            # Payout order webhook (existing logic)
            if status == "SUCCESS":
                handle_transaction_success(order_id, "Success", utr)
                frappe.db.commit()
                return {"success": True, "message": f"Payout {order_id} processed successfully"}
            elif status == "FAILED":
                handle_transaction_failure(order_id, "Failed", remark)
                frappe.db.commit()
                return {"success": True, "message": f"Payout {order_id} marked as failed"}
        
        else:
            frappe.log_error(f"Unknown order type: {order.order_type}", "Webhook Error")
            return {"success": False, "error": f"Unknown order type: {order.order_type}"}
    
    except Exception as e:
        frappe.log_error("Error processing mock webhook", str(e))
        return {"success": False, "error": str(e)}

def process_airtel_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process Airtel Payment Bank webhook.
    Routes to appropriate handler based on order type (Pay, Topup, Refund).
    """
    try:
        
        utr = payload.get("rrn")
        order_id = payload.get("hdnOrderID")
        status = payload.get("txnStatus")
        remark = payload.get("messageText")
        
        frappe.log_error(f"Airtel webhook received: {order_id}, status: {status}", "Airtel Webhook")
        
        # Check if it's a refund request
        if frappe.db.exists("Refund Request", order_id):
            refund_doc = frappe.get_doc("Refund Request", order_id)
            
            # Check if already processed
            if refund_doc.status == "Processed":
                frappe.log_error(f"Refund already processed: {order_id}", "Duplicate Webhook")
                return {"success": True, "message": f"Refund {order_id} already processed"}
            
            if status == "SUCCESS":
                handle_refund_success(order_id, utr)
                frappe.db.commit()
                return {"success": True, "message": f"Refund {order_id} processed successfully"}
            elif status == "FAILURE":
                handle_refund_failure(order_id, "Failed", remark)
                frappe.db.commit()
                return {"success": True, "message": f"Refund {order_id} marked as failed"}
        
        # Otherwise, it's a regular order (Pay or Topup)
        else:
            order = frappe.get_doc("Order", order_id)
            
            # Route based on order type
            if order.order_type == "Topup":
                # Topup order webhook
                if status == "SUCCESS":
                    handle_topup_success(order_id, utr)
                    frappe.db.commit()
                    return {"success": True, "message": f"Topup {order_id} processed successfully"}
                elif status == "FAILURE":
                    handle_topup_failure(order_id, "Failed", remark)
                    frappe.db.commit()
                    return {"success": True, "message": f"Topup {order_id} marked as failed"}
            
            elif order.order_type == "Pay":
                # Payout order webhook (existing logic)
                if status == "SUCCESS":
                    handle_transaction_success(order.name, "Success", utr)
                    frappe.db.commit()
                    return {"success": True, "message": f"Payout {order_id} processed successfully"}
                elif status == "FAILURE":
                    handle_transaction_failure(order.name, "Failed", remark)
                    frappe.db.commit()
                    return {"success": True, "message": f"Payout {order_id} marked as failed"}
            
            else:
                frappe.log_error(f"Unknown order type: {order.order_type}", "Webhook Error")
                return {"success": False, "error": f"Unknown order type: {order.order_type}"}
            
    except Exception as e:
        frappe.log_error(f"Airtel webhook processing error: {str(e)}", frappe.get_traceback())
        return {"success": False, "error": str(e)}


@frappe.whitelist()
def update_webhook(webhook_url):
    try:
        user = frappe.session.user
        merchant = frappe.get_doc("Merchant", user)

        exists = frappe.db.exists("Webhook", user, cache=True)
        if not exists:
            frappe.get_doc({
                'doctype': 'Webhook',
                '__newname': user,
                'webhook_doctype': 'Transaction',
                'webhook_docevent': 'on_submit',
                'condition': f"(doc.merchant == '{user}') and (doc.status in ['Success', 'Failed', 'Reversed'])",
                'request_url': webhook_url,
                'request_method': 'POST',
                'request_structure': 'JSON',
                'background_jobs_queue': 'long',
                'webhook_json': 
                """{
                    "crn":"{{doc.order}}",
                    "utr":"{{doc.transaction_reference_id}}",
                    "status": "{{doc.status}}",
                    "clientRefID": "{{doc.client_ref_id}}"
                }"""
            }).insert(ignore_permissions=True)

            merchant.webhook = webhook_url
            merchant.save(ignore_permissions=True)
            frappe.db.commit()
            return {"status": "created"}

        elif merchant.webhook != webhook_url:
            webhook_doc = frappe.get_doc("Webhook", user)
            webhook_doc.request_url = webhook_url
            webhook_doc.save(ignore_permissions=True)

            merchant.webhook = webhook_url
            merchant.save(ignore_permissions=True)
            frappe.db.commit()
            return {"status": "updated"}
        
        else:
            # Webhook URL is the same, no update needed
            return {"status": "unchanged"}

    except Exception as e:
        frappe.log_error("Error in webhook updation", str(e))
        return {"status": "error", "message": str(e)}