import frappe
import requests
from iswitch.order_webhook_handlers import handle_topup_failure
import base64
import gzip
import hashlib
import hmac as hmac_lib
import json
import time
from frappe.auth import validate_auth

from iswitch.payload_utils import encrypt_payload, decrypt_payload
from iswitch.jwt_utils import generate_jwt

def stable_numeric_id(value: str, digits: int = 18) -> str:
    return str(int(hashlib.sha256(value.encode()).hexdigest()[:16], 16))[:digits]

@frappe.whitelist()
def topup_order():
    data = frappe.request.get_json()

    ip_address = None
    user_id = None
    if frappe.request.headers.get('X-Real-Ip'):
        ip_address = frappe.request.headers.get('X-Real-Ip').split(',')[0]
    else:
        ip_address = frappe.request.remote_addr
    
    authorization_header = frappe.get_request_header("Authorization", "").split(" ")

    if not authorization_header:
        response = {
            "code": "0x0401",
            "status": "MISSING_HEADER",
            "message": "Authorization header is missing."
        }
        return response

    try:
        validate_auth()

    except frappe.AuthenticationError:
        response = {
            "code": "0x0401",
            "status": "MISSING_HEADER",
            "message": "Invalid Authorization Header"
        }
        return response

    auth_type, auth_token = authorization_header
    if auth_type.lower() == "basic":
        api_key, api_secret = frappe.safe_decode(base64.b64decode(auth_token)).split(":")
        user_id = frappe.db.get_value(doctype="User", filters={"api_key": api_key}, fieldname=["name"])
    elif auth_type.lower() == "token":
        api_key, api_secret = auth_token.split(":")
        user_id = frappe.db.get_value(doctype="User", filters={"api_key": api_key}, fieldname=["name"])

    if not user_id:
        response = {
            "code": "0x0401",
            "status": "Unauthorized",
            "message": f"Unauthorized user {user_id}"
        }
        return response

    frappe.set_user(user_id)

    request_response = frappe.get_doc({
        "doctype":"Request Response",
        "request": data,
        "method": "POST",
        "endpoint": "/api/method/payin",
        "header": json.dumps(authorization_header),
        "user": user_id,
        "ip_address": ip_address
    }).insert(ignore_permissions=True)

    if not frappe.db.exists("Whitelist IP",{'merchant':user_id,'whitelisted_ip':ip_address}):
        response = {
            "code": "0x0401",
            "status": "UNAUTHORIZED ACCESS", 
            "message": f"Originating IP {ip_address} is blocked by central firewall system. This incident will be reported."
        }

        return finalize_request_response(request_response, response, 401)

    if user_id == "Guest":
        response = {
            "code": "0x0401",
            "status": "UNAUTHORIZED", 
            "message": "Authentication required"
        }
        request_response = frappe.get_doc("Request Response", request_response.name)
        return finalize_request_response(request_response, response, 401)

    merchant = frappe.get_doc("Merchant", user_id)
    if merchant.status != "Approved":
        response =  {
            "code": "0x0404",
            "status": "VALIDATION_ERROR",
            "message": "Validation failed",
            "data": f"Your Account is in {merchant.status} stage. Please contact Admin"
        }
        request_response = frappe.get_doc("Request Response", request_response.name)
        return finalize_request_response(request_response, response, 404)
    
    if "mode" not in data:
        response = {
            "code": "0x0203",
            "status": "MISSING_PARAMETER",
            "message": "mode is required"
        }
        return finalize_request_response(request_response, response, 203)
    
    if data["mode"].upper() != "TOPUP":
        reponse = {
            "code": "0x0203",
            "status": "MISSING_PARAMETER",
            "message": "mode must be topup."
        }
        return finalize_request_response(request_response, response, 203)
    
    product = frappe.db.exists("Product", {"product_name": data["mode"].upper(), "is_active":1})
    if not product:
        response = {
            "code": "0x0500",
            "status": "SERVER_DOWN",
            "message":f"{data['mode']} payment mode is down. Please try again after sometime."
        }
        return finalize_request_response(request_response, response, 500)
    # wallet = frappe.get_doc("Wallet", merchant.name)
    # if wallet.status != "Active":
    #     response = {
    #             "code": "0x0404",
    #             "status": "VALIDATION_ERROR",
    #             "message": "Validation failed",
    #             "data": f"Your Wallet is {wallet.status}. Please contact Admin"
    #         }
    #     request_response = frappe.get_doc("Request Response", request_response.name)
    #     return finalize_request_response(request_response, response, 404)

    fields = ["amount", "clientRefId"]

    try:
        # Field validation
        for field in fields:
            if field not in data or not data[field]:

                response = {
                    "code": "0x0400",
                    "status": "MISSING_PARAMETER", 
                    "message": {f"{field}": [f"{field} is missing."]}
                }
                # request_response = frappe.get_doc("Request Response", request_response.name)
                return finalize_request_response(request_response, response, 400)
            
        # Check duplicate client ref id
        existing_order = frappe.db.exists("Order", {"client_ref_id": data["clientRefId"]})
        if existing_order:

            response = {
                "code": "0x0409",
                "status": "DUPLICATE_REFERENCE",
                "message": {"clientRefId": ["Client Ref Id already exists."]}
            }
            # request_response = frappe.get_doc("Request Response", request_response.name)
            return finalize_request_response(request_response, response, 409)
        integration_list = frappe.db.get_list("Integration",filters={"payin": 1}, pluck="name")
        
        if not integration_list:
            response = {
                "code": "0x0403",
                "status": "FORBIDDEN",
                "message": "Payin service is not enabled."
            }
            return finalize_request_response(request_response, response, 403)
        
        processor = frappe.get_doc("Integration", integration_list[0])
        order = frappe.get_doc({
            "doctype": "Order",
            "order_amount": data["amount"],
            "merchant_ref_id": merchant.name,
            "remark": data.get("remark", ""),
            "product": "TOPUP",
            "customer_name": merchant.company_name,
            "channel": "API",
            "integration_id": processor.name,
            "order_type": "Topup",
            "client_ref_id": data["clientRefId"],
            "transaction_amount": data["amount"]
        }).insert(ignore_permissions=True)


        # CREATE TRANSACTION
        transaction = frappe.get_doc({
            "doctype": 'Transaction',
            "order": order.name,
            "merchant": order.merchant_ref_id,
            "amount": order.order_amount,
            "integration": processor.name,
            "status": "Processing",
            "product": order.product,
            "transaction_date": frappe.utils.now()
        }).insert(ignore_permissions=True)
        
        
        # 🔹 CREATE PENDING TIGERBEETLE TRANSFER (Authorization Hold)
        # This prevents duplicate processing and will be POST/VOID based on webhook
        try:
            from iswitch.tigerbeetle_client import get_client
            import tigerbeetle as tb
            from decimal import Decimal
            import hashlib
            
            def stable_id(value: str) -> int:
                return int(hashlib.sha256(value.encode()).hexdigest()[:32], 16)
            
            client = get_client()
            
            # Get merchant TigerBeetle account
            if not merchant.tigerbeetle_id:
                frappe.throw("Merchant TigerBeetle account not configured")
            
            merchant_account_id = int(merchant.tigerbeetle_id)
            system_account_id = 1  # System account
            amount = int(Decimal(order.transaction_amount) * 100)  # Convert to cents
            
            # Deterministic transfer ID for topup
            topup_transfer_id = stable_id(f"topup-{order.name}")
            
            # Create PENDING transfer (authorization hold) - system → merchant credit
            transfer = tb.Transfer(
                id=topup_transfer_id,
                debit_account_id=system_account_id,  # System pays
                credit_account_id=merchant_account_id,  # Merchant receives
                amount=amount,
                pending_id=0,
                user_data_128=0,
                user_data_64=0,
                user_data_32=0,
                timeout=0,
                ledger=1,
                code=500,  # Code for topup
                flags=tb.TransferFlags.PENDING,
                timestamp=0,
            )
            
            errors = client.create_transfers([transfer])
            
            if errors:
                error = errors[0]
                if error.result == tb.CreateTransferResult.EXISTS:
                    # Transfer already exists - verify it matches
                    frappe.log_error(
                        f"Topup transfer already exists: {topup_transfer_id}",
                        "TigerBeetle Duplicate Prevention"
                    )
                    existing_transfers = client.lookup_transfers([topup_transfer_id])
                    if existing_transfers:
                        existing = existing_transfers[0]
                        if existing.amount != amount:
                            frappe.throw(f"Duplicate topup with different amount: expected {amount}, got {existing.amount}")
                else:
                    # Other errors are critical
                    frappe.log_error(
                        f"TigerBeetle transfer failed: {error.result}",
                        "TigerBeetle Error"
                    )
                    frappe.throw(f"Failed to create topup authorization: {error.result}")
        
        except Exception as e:
            frappe.log_error("Error creating topup PENDING transfer", frappe.get_traceback())
            frappe.throw(f"Failed to create topup authorization: {str(e)}")
        
        # 🔹 CREATE PENDING VIRTUAL ACCOUNT LOG
        # This will be marked as Success when webhook arrives
        try:
            # Get merchant's virtual account (if exists)
            virtual_account = None
            if frappe.db.exists("Virtual Account", {"merchant": merchant.name}):
                virtual_account = frappe.get_value("Virtual Account", {"merchant": merchant.name}, "name")
            
            van_log = frappe.get_doc({
                "doctype": "Virtual Account Logs",
                "account_number": virtual_account if virtual_account else None,  # Optional field
                "merchant": merchant.name,
                "merchant_email": merchant.name,  # Using merchant name as email field
                "amount": order.transaction_amount,
                "transaction_type": "Credit",
                "status": "Pending",
                "utr": order.name,  # Use order name as temporary UTR
            })
            van_log.insert(ignore_permissions=True)
            
            # frappe.log_error(f"Virtual Account Log created for topup: {order.name}", "Topup VAN Log")
        
        except Exception as e:
            frappe.log_error("Error creating virtual account log", frappe.get_traceback())
            # Don't throw - this is not critical for order processing
        
        # frappe.db.commit()
        crn = None
        qr = None
        status = None
        remark = None
        if processor.name == "PAYPROCESS2602280371":
            order.processor_order_id = stable_numeric_id(order.name)

            payload = {
                "api_token": processor.get_password("secret_key"),
                "mobile": "9999999999",
                "name": order.customer_name,
                "amount": order.transaction_amount,
                "email": "user@gmail.com",
                "order_id": order.processor_order_id
            }

            headers = {
                "Content-Type": "application/json"
            }
            url = processor.api_endpoint.rstrip("/") + "/createorder"

            response = requests.post(url, json=payload, headers=headers, timeout=10)
            # if response.status_code == 200:
            api_response = None
            try:
                api_response = response.json()

            except Exception as e:
                frappe.log_error("Error in TPI response parsing",response.text)
                frappe.throw("Error in topup processing")

            frappe.log_error("TPI Pay Response",api_response)
            
            if api_response.get("status") == "success":

                api_data = api_response.get("data",{})
                crn = api_data.get("gateway_order_id","")
                qr = api_data.get("qr_string","")
                status = "Success"
            elif api_response.get("status") == "failure" or api_response.get("status") == "failed":
                status = "Failed"
                remark = api_response.get("error")

        elif processor.name == "Airtel Payment Bank":
            pass
            # vpa = processor.vpa
            # mid = processor.get_password("client_id")
            # access_key = processor.get_password("secret_key")

            # token = generate_jwt(
            #     mid=mid,
            #     access_key=access_key,
            #     expiry_seconds=300,
            # )
            # headers = {
            #     "MID": mid,
            #     "Authorization": token, 
            #     "Content-Type": "application/json"
            # }

            # payload = {
            #     "data":{
            #         "payeeVpa": vpa,
            #         "hdnOrderId": order.name,                 # use the generated order ID
            #         "remarks": data.get("remark") or None,
            #         "txnAmount": str(order.transaction_amount),
            #         "minTxnAmount": str(order.transaction_amount),
            #         "flowType": "PAY",
            #         "qr": {
            #             "type": "STRING",
            #             "width": 240,
            #             "height": 240,
            #         },
            #         "expireIn": {
            #             "value": 5,
            #             "format": "MINUTE",
            #         },
            #         "customer":  None,
            #         "posDetail": None
            #     }
            # }
            # encrypted_body = encrypt_payload(plain_dict=payload, access_key=access_key)

            # url = processor.api_endpoint.rstrip("/") + "/merchant-onb-service/qr/code/generate"

            # frappe.log_error("Payout Payload", {"url": url, "headers": headers, "payload": payload, "encrypted_payload": encrypted_body})
            
            # response = None
            # try:
            #     response = requests.post(url, json=encrypted_body, headers=headers, timeout=10)
            #     api_response = response.json()

            #     if response.status_code == 200:
            #         decrypted_data = decrypt_payload(api_response.get("data"), access_key)
                    
            #         data = decrypted_data.get("meta")
            #         if data.get("status","") == "0":
            #             order.db_set("status", "Processing")
            #             transaction.db_set("status", "Pending")
            #             response = {
            #                 "code": "0x0200",
            #                 "status": "SUCCESS",
            #                 "message": "Order processed successfully.",
            #                 "qr": decrypted_data["data"]["data"]["qr"]["generatedQr"]
            #             }
            #             return finalize_request_response(request_response, response, 200)

            #         elif data.get("status","") == "1":
            #             # VOID the PENDING transfer before cancelling
            #             try:
            #                 void_transfer_id = stable_id(f"topup-void-{order.name}")
            #                 topup_transfer_id = stable_id(f"topup-{order.name}")
                            
            #                 void_transfer = tb.Transfer(
            #                     id=void_transfer_id,
            #                     debit_account_id=system_account_id,  # Match PENDING direction
            #                     credit_account_id=merchant_account_id,
            #                     amount=amount,
            #                     pending_id=topup_transfer_id,
            #                     user_data_128=0,
            #                     user_data_64=0,
            #                     user_data_32=0,
            #                     timeout=0,
            #                     ledger=1,
            #                     code=500,
            #                     flags=tb.TransferFlags.VOID_PENDING_TRANSFER,
            #                     timestamp=0,
            #                 )
                            
            #                 errors = client.create_transfers([void_transfer])
            #                 if errors:
            #                     error = errors[0]
            #                     if error.result != tb.CreateTransferResult.EXISTS:
            #                         frappe.log_error(f"Failed to VOID topup transfer: {error.result}", "Topup VOID Error")
            #             except Exception as e:
            #                 frappe.log_error(f"Error voiding topup transfer: {str(e)}", "Topup VOID Error")
                        
            #             order.db_set("status", "Cancelled")
            #             transaction.status = "Failed"
            #             transaction.save(ignore_permissions=True)
            #             transaction.submit()
            #             response = {
            #                 "code": "0x0500",
            #                 "status": "PROCESSING_ERROR",
            #                 "message": "Error processing the order. Please try again later."
            #             }
            #             return finalize_request_response(request_response, response, 500)
            #     else:
            #         # VOID the PENDING transfer before cancelling
            #         try:
            #             void_transfer_id = stable_id(f"topup-void-{order.name}")
            #             topup_transfer_id = stable_id(f"topup-{order.name}")
                        
            #             void_transfer = tb.Transfer(
            #                 id=void_transfer_id,
            #                 debit_account_id=system_account_id,  # Match PENDING direction
            #                 credit_account_id=merchant_account_id,
            #                 amount=amount,
            #                 pending_id=topup_transfer_id,
            #                 user_data_128=0,
            #                 user_data_64=0,
            #                 user_data_32=0,
            #                 timeout=0,
            #                 ledger=1,
            #                 code=500,
            #                 flags=tb.TransferFlags.VOID_PENDING_TRANSFER,
            #                 timestamp=0,
            #             )
                        
            #             errors = client.create_transfers([void_transfer])
            #             if errors:
            #                 error = errors[0]
            #                 if error.result != tb.CreateTransferResult.EXISTS:
            #                     frappe.log_error(f"Failed to VOID topup transfer: {error.result}", "Topup VOID Error")
            #         except Exception as e:
            #             frappe.log_error(f"Error voiding topup transfer: {str(e)}", "Topup VOID Error")
                    
            #         order.db_set("status", "Cancelled")
            #         transaction.status = "Failed"
            #         transaction.save(ignore_permissions=True)
            #         transaction.submit()
            #         response = {
            #             "code": "0x0500",
            #             "status": "PROCESSING_ERROR",
            #             "message": "Error processing the order. Please try again later."
            #         }
            #         return finalize_request_response(request_response, response, 500)

            # except requests.exceptions.Timeout:
            #     order.db_set("status", "Processing")
            #     transaction.db_set("status", "Pending")

            #     response = {
            #         "code": "0x0504",
            #         "status": "TIMEOUT",
            #         "message": "Request timed out. Please check order status later."
            #     }
            #     frappe.log_error("Airtel API Payin Timeout",response)
            #     return finalize_request_response(request_response, response, 504)

        if status == "Success":
            order.status = "Processing"
            order.save(ignore_permissions=True)

            transaction.status = "Pending"
            transaction.crn = crn
            transaction.remark = remark
            transaction.save(ignore_permissions=True)
            response = {
                "code":"0x0200",
                "status": "Success",
                "order_id": order.name,
                "qr": qr,
                "message": "Transaction initiated"
            }
            return finalize_request_response(request_response, response, 200)
        
        elif status == "Failed":
            handle_topup_failure(order.name,"Failed",remark)
            response = {
                "code": "0x0500",
                "status": "FAILED",
                "message": "Error in topup"
            }
            return finalize_request_response(request_response, response, 500)
        
    except Exception as e:
        frappe.log_error("Error in topup order processing", frappe.get_traceback())
        response = {
            "code": "0x0500",
            "status": "PROCESSING_ERROR",
            "message": "An error occurred while processing the order. Please try again later."
        }

        return finalize_request_response(request_response, response, 500)


def finalize_request_response(doc, response, status_code):
    doc.response = json.dumps(response)
    doc.status_code = str(status_code)
    doc.submit()
    frappe.local.response.http_status_code = int(status_code)
    frappe.db.commit()
    return response