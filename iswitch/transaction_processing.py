import frappe
import requests
import jwt
import json
from datetime import datetime as dt, timedelta as td
import hashlib
import base64
from .bank import JSONEncryptionDecryption
from frappe.utils import today, getdate
import tigerbeetle as tb
from iswitch.tigerbeetle_client import get_client
from Crypto.Hash import HMAC, SHA256
from decimal import Decimal
from iswitch.order_webhook_handlers import (
            handle_transaction_failure,
            handle_transaction_success
        )

def handle_transaction(order_name):
    try:
        order = frappe.get_doc("Order", order_name)
        if order.product =="UPI":
            upi_transaction_processing(order)
        else:
            other_transaction_processing(order)
            
    except Exception as e:
        frappe.log_error("Error in transaction handling",str(e))

def upi_transaction_processing(doc):
    try:
        doc.status = "Processing"
        doc.save(ignore_permissions=True)
        
        frappe.db.savepoint("process_transaction")

        processor = frappe.get_doc("Integration", doc.integration_id)
        
        frappe.set_user(doc.merchant_ref_id)
        status = "Pending"
        remark = ""
        utr = ""
        crn = ""

        if processor.name == "PAYPROCESS2602140315":
            payload = {
                "order_id": doc.name,
                "amount": str(doc.order_amount)
            }
            url = processor.api_endpoint.rstrip("/") + "/pay"
            api_response = requests.post(url, json = payload, timeout = 30)
            try:
                api_data = api_response.json()
                # frappe.log_error("API Response", api_data)
                status = api_data.get("status", "Pending")
                remark = api_data.get("message", "")
                crn = api_data.get("transaction_id", "")

            except Exception as e:
                frappe.log_error("API Response", api_response.text)

            
        if status == "Failed" or status == "Reversed":

            handle_transaction_failure(doc.name, status, remark)
        
        elif status == "Pending":
            frappe.db.set_value("Order", doc.name, {"utr": utr, "crn": crn})

        frappe.db.commit()
    except Exception as e:
        frappe.db.rollback(save_point="process_transaction", update_modified=False)
        frappe.log_error("Error in transaction processing",str(e))


def other_transaction_processing(doc):
    try:
        doc.status = "Processing"
        doc.save(ignore_permissions=True)
        
        frappe.db.savepoint("process_transaction")

        processor = frappe.get_doc("Integration", doc.integration_id)
        
        frappe.set_user(doc.merchant_ref_id)

        status = "Pending"
        remark = ""
        utr = ""
        crn = ""
        
        if processor.name == "Rabi Pay":
            
            payload = {
                "order_id": doc.name,
                "payment_method": doc.product,
                "account_holder_name": doc.customer_name,
                "bank_name": doc.bank,
                "account_number": doc.customer_account_number,
                "ifsc_code": doc.ifsc,
                "mobile": "9999999999",
                "amount": int(doc.order_amount),
                "account_type": "saving",
                "reason": "Payout"
            }
            
            # Step 1 & 2: Convert to JSON string without formatting (no spaces)
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
                "Content-Type": "application/json",  # No trailing space!
                "rabipay-client-id": processor.get_password("client_id"),
                "rabipay-signature": signature
            }

            url = processor.api_endpoint.rstrip("/") + "/payout"
            
            # Send request with raw body as bytes
            api_response = requests.post(
                url, 
                headers=headers, 
                data=raw_body.encode('utf-8'),
                timeout=30
            )

            try:
                api_data = api_response.json()
                frappe.log_error("API Response", api_data)
                txn_status = api_data.get("status")
                remark = api_data.get("message")

                if txn_status == "success":
                    status = "Success"
                elif txn_status == "failed":
                    status = "Failed"
                
            except Exception as e:
                frappe.log_error("API Response Error", api_response.text)
        elif processor.name == "PAYPROCESS2603090008":
            
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

            customer_id = get_or_create_customer(doc, processor, headers)

            api_response = create_payout_order(doc, processor, headers, customer_id)
            frappe.log_error("One Pesa Response", api_response)
            
            if api_response.get("code") == "0x0200":
                remark = api_response.get("message","")
                if api_response.get("status") == "SUCCESS":
                    crn = api_response.get("data",{}).get("orderRefId")
            else:
                status = "Failed"
                remark = api_response.get("message","")

        if status == "Failed" or status == "Reversed":
            handle_transaction_failure(doc.name, status, remark)
            
        elif status == "Pending":
            frappe.db.set_value("Order", doc.name, {"utr": utr, "crn": crn}, update_modified=False)
        
        frappe.db.commit()

    except Exception as e:
        frappe.db.rollback(save_point="process_transaction")
        frappe.log_error("Error in transaction processing",e)


def get_or_create_customer(doc, processor, headers):
    customer = frappe.db.get_value(
        "Customer",
        {"account_number": doc.customer_account_number},
        ["name","customer_id"],
        as_dict = True
    )

    if customer and customer.customer_id:
        return customer.customer_id

    if not customer:
        customer = frappe.get_doc({
            "doctype": "Customer",
            "customer_name": doc.customer_name,
            "account_number": doc.customer_account_number,
            "ifsc": doc.ifsc
        }).insert(ignore_permissions=True)
        frappe.db.commit()

    payload = {
        "firstName": doc.customer_name,
        "lastName": doc.customer_name,
        "email": "demo@gmail.com",
        "mobile": "9999999999",
        "type": "customer",
        "accountType": "bank_account",
        "accountNumber": doc.customer_account_number,
        "ifsc": doc.ifsc,
        "referenceId": customer.name
    }

    url = processor.api_endpoint.rstrip("/") + "/payout/contacts"

    response = requests.post(url, json=payload, headers=headers, timeout=30)

    try:
        data = response.json()
    except Exception:
        frappe.log_error(response.text, "Customer API error")
        raise Exception("Customer creation failed")

    if data.get("code") != "0x0200":
        frappe.log_error(str(data), "Customer API failed")
        raise Exception("Customer creation failed")

    customer_id = data.get("data", {}).get("contactId")

    if not customer_id:
        frappe.log_error(str(data), "Missing contactId in API response")
        raise Exception("Customer creation failed")

    frappe.db.set_value("Customer", customer.name, "customer_id", customer_id)

    return customer_id

def create_payout_order(doc, processor, headers, customer_id):

    payload = {
        "amount": str(doc.order_amount),
        "purpose": "others",
        "mode": doc.product,
        "contactId": customer_id,
        "clientRefId": doc.name,
        "udf1": "",
        "udf2": ""
    }

    url = processor.api_endpoint.rstrip("/") + "/payout/orders"

    response = requests.post(url, json=payload, headers=headers, timeout=30)

    try:
        data = response.json()
    except Exception:
        frappe.log_error(response.text, "Payout API error")
        raise Exception("Payout API failed")

    return data

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


def process_order(order_name):
    try:
        doc = frappe.get_doc("Order", order_name)
        merchant = frappe.get_doc("Merchant", doc.merchant_ref_id)

        if not merchant.tigerbeetle_id:
            cancel_order(doc.name)
            return

        client = get_client()

        merchant_account_id = int(merchant.tigerbeetle_id)
        system_account_id = 1

        amount = int(Decimal(doc.transaction_amount) * 100)

        # 🔐 Deterministic transfer ID (IMPORTANT)
        auth_transfer_id = stable_id(f"auth-{doc.name}")

        # 🔹 1️⃣ Check AVAILABLE balance (includes pending)
        accounts = client.lookup_accounts([merchant_account_id])
        if not accounts:
            cancel_order(doc.name)
            return

        acc = accounts[0]

        available_balance = (
            acc.credits_posted
            - acc.debits_posted
            - acc.debits_pending
        )

        if available_balance < amount:
            cancel_order(doc.name)
            return

        opening_balance = (
            acc.credits_posted
            - acc.debits_posted
            - acc.debits_pending
        ) / 100

        # 🔹 2️⃣ Create PENDING transfer (Authorization Hold)
        transfer = tb.Transfer(
            id=auth_transfer_id,
            debit_account_id=merchant_account_id,
            credit_account_id=system_account_id,
            amount=amount,
            pending_id=0,
            user_data_128=0,
            user_data_64=0,
            user_data_32=0,
            timeout=0,
            ledger=1,
            code=400,  # Authorization
            flags=tb.TransferFlags.PENDING,
            timestamp=0,
        )

        errors = client.create_transfers([transfer])

        if errors:
            error = errors[0]
            if error.result != tb.CreateTransferResult.EXISTS:
                cancel_order(doc.name)
                return

        # 🔹 3️⃣ Fetch updated balance (after pending hold)
        accounts_after = client.lookup_accounts([merchant_account_id])
        acc_after = accounts_after[0]

        closing_balance = (
            acc_after.credits_posted
            - acc_after.debits_posted
            - acc_after.debits_pending
        ) / 100

        ledger = frappe.get_doc({
            "doctype": "Ledger",
            "order": doc.name,
            "transaction_type": "Debit",
            "status": "Success",
            "client_ref_id": doc.client_ref_id,
            "opening_balance": opening_balance,
            "closing_balance": closing_balance
        }).insert(ignore_permissions=True)

        ledger.submit()

        frappe.db.commit()  # Commit before external call

        frappe.enqueue("iswitch.transaction_processing.handle_transaction",
            order_name = order_name,
            queue="long",
            timeout=300
        )

    except Exception as e:
        frappe.log_error("Authorization Error", str(e))


def cancel_order(order_name):
    
    try:
        frappe.db.sql("""
            UPDATE `tabOrder`
            SET status = 'Cancelled', modified = NOW()
            WHERE name = %s
        """, (order_name,))

    except Exception as e:
        frappe.log_error("Error in cancelling order", str(e))

def stable_id(value: str) -> int:
    return int(hashlib.sha256(value.encode()).hexdigest()[:32], 16)