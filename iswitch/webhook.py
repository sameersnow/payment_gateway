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
            handle_refund_failure,
            handle_transaction_failure,
            handle_transaction_success
        )

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

@frappe.whitelist(allow_guest=True)
def mockpay_webhook():
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
                "integration": "Dummy Processor"
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
def asianpay_webhook():
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
                "integration": "Asian Pay"
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
        elif integration == "Dummy Processor":
            process_mock_webhook(payload)
        elif integration == "Asian Pay":
            process_asianpay_webhook(payload)

    except Exception as e:
        frappe.db.rollback(save_point = "webhook_process")
        frappe.log_error("Error in processing webhook", str(e))
        
def process_onepesa_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        code = payload.get("code")
        data = payload.get("data") or {}

        order_id = data.get("clientRefId")
        status = data.get("status")
        
        if not order_id:
            frappe.log_error("Missing clientRefId in webhook", str(payload))
            return

        if code == "0x0200" and (status == "success" or status == "processed"):
            utr = data.get("utr")
            handle_transaction_success(order_id, "Success", utr)
                
        elif code == "0x0202" and status == "failed":
            remark = data.get("reason") or payload.get("message")
            handle_transaction_failure(order_id, "Failed", remark)
            
    except Exception as e:
        frappe.log_error("Error in processing onepesa webhook", str(e))
        raise

def process_asianpay_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        gateway_order_id = payload.get("order_id")
        status = payload.get("order_status")
        utr = payload.get("bank_reference")
        remark = payload.get("payment_message", "No remark provided")
        if not gateway_order_id:
            frappe.log_error("Missing order_id in Asian Pay webhook", "Asian Pay Webhook")
            return {"success": False, "error": "Missing order_id"}
        
        order_id = frappe.db.get_value("Transaction",{"crn":gateway_order_id},"order")
        
        if not order_id:
            frappe.log_error("AsianPay Webhook Error", f"Order not found for CRN: {gateway_order_id}")
            return
            
        if (status == "PAID" or status == "paid" or status == "Paid"):
            handle_topup_success(order_id, utr)
        
        elif (status == "FAILED" or status == "failed" or status == "Failed") or (status == "EXPIRED" or status == "expired" or status == "Expired"):
            handle_topup_failure(order_id, "Failed", remark)
        
    except Exception as e:
        frappe.log_error("Error in asianpay webhook handling",str(e))

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
        raise
    

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
        
    except Exception as e:
        frappe.log_error("Error processing mock webhook", str(e))
        raise

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