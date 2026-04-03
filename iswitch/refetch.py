import frappe
import requests
import jwt
import json
from datetime import datetime as dt, timedelta as td
import hashlib
from .bank import JSONEncryptionDecryption
import tigerbeetle as tb
import base64
from iswitch.tigerbeetle_client import get_client
from decimal import Decimal
from Crypto.Hash import HMAC, SHA256
from iswitch.order_webhook_handlers import (
            handle_topup_success,
            handle_topup_failure,
            handle_refund_success,
            handle_refund_failure,
            handle_transaction_success,
            handle_transaction_failure
        )

# def handle_transaction_failure(name, status, error_message):
#     """
#     Void authorized (pending) transfer on failure webhook.
#     """
#     try:
#         doc = frappe.get_doc("Order", name)

#         transaction = frappe.get_doc("Transaction", {"order": name})
#         if transaction.docstatus == 1:
#             frappe.throw("Transaction already processed")

#         merchant = frappe.get_doc("Merchant", doc.merchant_ref_id)

#         if not merchant.tigerbeetle_id:
#             frappe.throw("Merchant TB account missing")
        
#         frappe.set_user(doc.merchant_ref_id)  # Set user context to merchant for accurate permissions and logging

#         client = get_client()

#         merchant_account_id = int(merchant.tigerbeetle_id)
#         system_account_id = 1
#         amount = int(Decimal(doc.transaction_amount) * 100)

#         # 🔹 1️⃣ Balance BEFORE void
#         acc_before = client.lookup_accounts([merchant_account_id])[0]

#         opening_balance = (
#             acc_before.credits_posted
#             - acc_before.debits_posted
#             - acc_before.debits_pending
#         ) / 100

#         # 🔐 Deterministic IDs
#         auth_transfer_id = stable_id(f"auth-{doc.name}")
#         void_transfer_id = stable_id(f"void-{doc.name}")

#         # 🔹 VOID pending transfer
#         void_transfer = tb.Transfer(
#             id=void_transfer_id,
#             debit_account_id=merchant_account_id,
#             credit_account_id=system_account_id,
#             amount=amount,
#             pending_id=auth_transfer_id,
#             user_data_128=0,
#             user_data_64=0,
#             user_data_32=0,
#             timeout=0,
#             ledger=1,
#             code=400,
#             flags=tb.TransferFlags.VOID_PENDING_TRANSFER,
#             timestamp=0,
#         )

#         errors = client.create_transfers([void_transfer])

#         if errors:
#             error = errors[0]
#             if error.result != tb.CreateTransferResult.EXISTS:
#                 frappe.throw(f"Void failed: {error.result}")
        
#         # 🔹 3️⃣ Balance AFTER void
#         acc_after = client.lookup_accounts([merchant_account_id])[0]

#         closing_balance = (
#             acc_after.credits_posted
#             - acc_after.debits_posted
#             - acc_after.debits_pending
#         ) / 100
        
#         # 🔹 Update Order
#         doc.status = status
#         doc.reason = error_message[:100]
#         doc.save(ignore_permissions=True)

        
#         transaction.status = status
#         transaction.save(ignore_permissions=True)
#         transaction.submit()

#         ledger = frappe.get_doc({
#             "doctype": 'Ledger',
#             "order": doc.name,
#             "transaction_type": 'Credit',
#             'status': status,
#             'transaction_id': transaction.name,
#             'client_ref_id': doc.client_ref_id,
#             'opening_balance': opening_balance,
#             "closing_balance": closing_balance
#         }).insert(ignore_permissions=True)
#         ledger.submit()

        
#     except Exception as e:
#         # frappe.db.rollback(save_point="status_process")
#         frappe.log_error("Void Error", str(e))
#         raise

# def handle_transaction_success(name, transaction_reference_id):
#     """
#     Capture authorized (pending) transfer on success webhook.
#     """
#     try:
#         doc = frappe.get_doc("Order", name)

#         transaction = frappe.get_doc("Transaction", {"order": name})
#         if transaction.docstatus == 1:
#             frappe.throw("Transaction already processed")

#         merchant = frappe.get_doc("Merchant", doc.merchant_ref_id)

#         if not merchant.tigerbeetle_id:
#             frappe.throw("Merchant TB account missing")

#         frappe.set_user(doc.merchant_ref_id)  # Set user context to merchant for accurate permissions and logging

#         client = get_client()

#         merchant_account_id = int(merchant.tigerbeetle_id)
#         system_account_id = 1
#         amount = int(Decimal(doc.transaction_amount) * 100)

#         # 🔐 Deterministic IDs
#         auth_transfer_id = stable_id(f"auth-{doc.name}")
#         capture_transfer_id = stable_id(f"capture-{doc.name}")

#         # 🔹 POST pending transfer (Capture)
#         capture = tb.Transfer(
#             id=capture_transfer_id,
#             debit_account_id=merchant_account_id,
#             credit_account_id=system_account_id,
#             amount=amount,
#             pending_id=auth_transfer_id,
#             user_data_128=0,
#             user_data_64=0,
#             user_data_32=0,
#             timeout=0,
#             ledger=1,
#             code=400,
#             flags=tb.TransferFlags.POST_PENDING_TRANSFER,
#             timestamp=0,
#         )

#         errors = client.create_transfers([capture])

#         if errors:
#             error = errors[0]
#             if error.result != tb.CreateTransferResult.EXISTS:
#                 frappe.throw(f"Capture failed: {error.result}")

#         # 🔹 Update Order
#         doc.status = "Processed"
#         doc.utr = transaction_reference_id
#         doc.save(ignore_permissions=True)

        
#         transaction.status = "Success"
#         transaction.transaction_reference_id = transaction_reference_id
#         transaction.save(ignore_permissions=True)
#         transaction.submit()

#     except Exception as e:
#         # frappe.db.rollback(save_point="status_process")
#         frappe.log_error("Capture Error", str(e))
#         raise


def generate_hash(merchant_id, parameters, hashing_method, secret_key, key_order):
    hash_data = str(merchant_id)
    
    for key in key_order:
        value = parameters[key]
        # Convert to string in JavaScript-like manner
        if isinstance(value, float) and value.is_integer():
            # Convert Decimal like 10.0 to "10" (like JavaScript)
            value_str = str(int(value))
        else:
            value_str = str(value)
        hash_data += '|' + value_str
    
    hash_data += '|' + str(secret_key)
    
    if len(hash_data) > 0:
        # Create hash using the specified method
        hash_obj = hashlib.new(hashing_method)
        hash_obj.update(hash_data.encode('utf-8'))
        return hash_obj.hexdigest().lower()
    
    return None


@frappe.whitelist(allow_guest=True)
def update_record():
    results = frappe.db.sql("""
        SELECT name, integration_id FROM `tabOrder`
        WHERE status = 'Processing'
    """, as_dict=True)
    frappe.log_error("Order to processed",results)
    
    for result in results:
        frappe.db.savepoint("status_process")
        try:
            txn_status = ""
            utr = ""
            remark = ""

            if result.integration_id == "Rabi Pays":
                processor = frappe.get_doc("Integration", result.integration_id)
                crn = frappe.db.get_value("Transaction",{"order":result.name},'crn')

                payload = {}
                
                raw_body = json.dumps(payload, separators=(',', ':'), ensure_ascii=False)
            
                # Step 3 & 4: Generate HMAC SHA-256 signature in HEX format
                secret_key = processor.get_password("secret_key")
                hmac_obj = HMAC.new(
                    secret_key.encode("utf-8"), 
                    raw_body.encode("utf-8"), 
                    SHA256
                )
                signature = hmac_obj.hexdigest()

                # Step 5: Pass signature in header
                headers = {
                    "rabipay-client-id": processor.get_password("client_id"),
                    "rabipay-signature": signature
                }

                url = processor.api_endpoint.rstrip("/") + f"/transaction/status/{crn}"
                api_response = requests.get(url, headers=headers, timeout=30)
                try:
                    api_data = api_response.json()
                    frappe.log_error(f"Rabi Pay Query API Response {result.name}", api_data)
                    status = api_data.get("status")
                    utr = api_data.get("utr", "")

                    if status == "success":
                        txn_status = "Success"
                    elif status == "failed":
                        txn_status = "Failed"
                    
                except Exception as e:
                    # frappe.db.rollback(save_point="status_process")
                    frappe.log_error(f"Error in Rabi Pay requery {result.name}", api_response.text)
                    raise
            
            elif result.integration_id == "PAYPROCESS2603090008":
                processor = frappe.get_doc("Integration", result.integration_id)
                crn = frappe.db.get_value("Transaction",{"order":result.name},'crn')

                url = processor.api_endpoint.rstrip("/") + f"/payout/orders/{crn}"
                username = processor.get_password("client_id")
                password = processor.get_password("secret_key")
                # Combine username and password
                credentials = f"{username}:{password}"
                # Encode to Base64
                encoded_credentials = base64.b64encode(credentials.encode()).decode()

                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Basic {encoded_credentials}"
                }
                response = requests.get(url, headers=headers, timeout=30)
                api_response = None
                try:
                    api_response = response.json()
                except Exception as e:
                    frappe.log_error("Error in onepesa requery",response.text)
                    frappe.throw("Error in onepesa requery")
                frappe.log_error("One Pesa requery response", api_response)
                code = api_response.get("code")
                data = api_response.get("data",{})
                if code == "0x0200" and (data.get("status", "") == "success" or data.get("status", "") == "processed"):
                    txn_status = "SUCCESS"
                    utr = data.get("utr","")
                    remark = api_response.get("message", "")
                elif code == "0x0202" and data.get("status", "") == "failed":
                    txn_status = "FAILED"
                    remark = (
                            data.get("failedMessage")
                            or data.get("reason")
                            or api_response.get("message")
                        )

                

            elif result.integration_id == "PAYPROCESS2602280371":
                processor = frappe.get_doc("Integration",result.integration_id)
                order = frappe.get_doc("Order", result.name)
                payload = {
                    "api_token": processor.get_password("secret_key"),
                    "order_id": order.processor_order_id
                }
                headers = {
                    "Content-Type": "application/v2+json"
                }
                url = processor.api_endpoint.rstrip("/") + "/check-trxn-status"
                response = requests.post(url, json = payload, headers=headers)

                api_response = None
                try:
                    api_response = response.json()
                    frappe.log_error("TPI requery response", api_response)
                except Exception as e:
                    frappe.log_error("Error in TPI requery", response.text)
                
                if api_response.get("status") == "success":
                    api_data = api_response.get("data",{})
                    if api_data.get("type") == "payin":
                        if api_data.get("status")=="credit":
                            txn_status = "SUCCESS"
                            utr = api_data.get("utr")

            elif result.integration_id == "PAYPROCESS260324003":
                processor = frappe.get_doc("Integration",result.integration_id)
                order_id = frappe.db.get_value("Transaction",{"order":result.name},'crn')

                mid = processor.get_password("client_id")
                headers = {
                    "Content-Type": "application/json",
                    "x-api-key": mid
                }
                url = processor.api_endpoint.rstrip("/") + f"/Payment/CheckStatus?order_id={order_id}"
                
                response = requests.post(url, headers=headers, timeout=30)
                api_response = None
                
                try:
                    api_response = response.json()
                except Exception as e:
                    frappe.log_error("Error in AsianPay requery", response.text)
                
                frappe.log_error("AsianPay requery response", api_response)

                if api_response:
                    if api_response.get("success") is True:
                        data = api_response.get("data", {})
                        status = data.get("order_status")
                        utr = data.get("bank_reference")  # Use as CRN
                        remark = api_response.get("payment_message","Remark not provided")
                        
                        if (status == "PAID" or status == "paid" or status == "Paid"):
                            txn_status = "SUCCESS"
                        
                        elif (status == "FAILED" or status == "failed" or status == "Failed") or (status == "EXPIRED" or status == "expired" or status == "Expired"):
                            txn_status = "FAILED"

            # if txn_status == "Success":
            #     handle_transaction_success(result.name, utr)
            #     frappe.db.commit()

            # elif txn_status == "Failed" or txn_status == "Reversed":
            #     handle_transaction_failure(result.name, txn_status, f"Transaction status is {txn_status}")
            #     frappe.db.commit()
            order_id = result.name
            if frappe.db.exists("Refund Request", order_id):
                refund_doc = frappe.get_doc("Refund Request", order_id)
                
                # Check if already processed
                if refund_doc.status == "Processed":
                    frappe.log_error(f"Refund already processed: {order_id}", "Duplicate Webhook")
                    return {"success": True, "message": f"Refund {order_id} already processed"}
                
                if txn_status == "SUCCESS":
                    handle_refund_success(order_id, utr)
                    frappe.db.commit()
                    return {"success": True, "message": f"Refund {order_id} processed successfully"}
                elif txn_status == "FAILED":
                    handle_refund_failure(order_id, "Failed", remark)
                    frappe.db.commit()
                    return {"success": True, "message": f"Refund {order_id} marked as failed"}
            
            # Otherwise, it's a regular order (Pay or Topup)
            else:
                order = frappe.get_doc("Order", order_id)
                
                # Route based on order type
                if order.order_type and order.order_type == "Topup":
                    # Topup order webhook
                    if txn_status == "SUCCESS":
                        handle_topup_success(order_id, utr)
                        frappe.db.commit()
                        # return {"success": True, "message": f"Topup {order_id} processed successfully"}
                    elif txn_status == "FAILED":
                        handle_topup_failure(order_id, "Failed", remark)
                        frappe.db.commit()
                        # return {"success": True, "message": f"Topup {order_id} marked as failed"}
                
                elif order.order_type and order.order_type == "Pay":
                    # Payout order webhook (existing logic)
                    if txn_status == "SUCCESS":
                        handle_transaction_success(order.name, "Success", utr)
                        frappe.db.commit()
                        # return {"success": True, "message": f"Payout {order_id} processed successfully"}
                    elif txn_status == "FAILED":
                        handle_transaction_failure(order.name, "Failed", remark)
                        frappe.db.commit()
                        # return {"success": True, "message": f"Payout {order_id} marked as failed"}
                
                # else:
                #     frappe.log_error(f"Unknown order type: {order.order_type}", "Webhook Error")
                #     return {"success": False, "error": f"Unknown order type: {order.order_type}"}

        except Exception as e:
            frappe.db.rollback(save_point = "status_process")
            frappe.log_error(frappe.get_traceback(), f"Error updating transaction for Order: {result.name}")


def get_hash_string(payload, secret_key):
    """
    Dynamically generate hash string from all payload fields.
    """
    try:
        # Get all payload values in the order they were defined
        hash_parts = [str(value) for value in payload.values()]
        
        # Add secret key at the end
        hash_parts.append(secret_key)
        
        # Join with # delimiter
        hash_string = "#".join(hash_parts)
        
        return hash_string
        
    except Exception as e:
        frappe.log_error("Error in hash string generation", str(e))
        raise


def stable_id(value: str) -> int:
    return int(hashlib.sha256(value.encode()).hexdigest()[:32], 16)