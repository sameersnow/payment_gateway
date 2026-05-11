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
import random
from decimal import Decimal

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

    fields = ["amount", "mode", "clientRefId"]

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
        
        order_amount = Decimal(data["amount"])

        product_pricing = frappe.db.sql("""
            SELECT tax_fee_type, tax_fee, fee_type, fee
            FROM `tabProduct Pricing`
            WHERE parent = %s AND product = %s
            AND %s >= start_value AND %s <= end_value
        """, (merchant.name, data["mode"].upper(), order_amount, order_amount), as_dict=True)
        
        if not product_pricing:
            response = {
                "code": "0x0403",
                "status": "FORBIDDEN",
                "message": "Payment mode or transaction limit is not active for you. Please contact Admin"
            }
            return finalize_request_response(request_response, response, "403")

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

        if not merchant.payin_processor:
            response =  {
                "code": "0x0422",
                "status": "UNPROCESSIBLE_ENTITY",
                "message": "Processor isn't configured yet to process your order. Please try after sometime."
            }
            return finalize_request_response(request_response, response, "422")

        pricing = product_pricing[0]
        fee = Decimal(pricing.get("fee", 0))
        tax = Decimal(pricing.get("tax_fee", 0))

        if pricing["fee_type"] == "Percentage":
            fee = (order_amount * Decimal(pricing.get("fee", 0))) / 100

        if pricing["tax_fee_type"] == "Percentage":
            tax = (fee * Decimal(pricing.get("tax_fee", 0))) / 100

        total_amount = order_amount - fee - tax

        processor = frappe.get_doc("Integration", merchant.payin_processor)

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
            "tax": tax,
            "fee": fee,
            "transaction_amount": total_amount
        }).insert(ignore_permissions=True)


        # # CREATE TRANSACTION
        # transaction = frappe.get_doc({
        #     "doctype": 'Transaction',
        #     "order": order.name,
        #     "merchant": order.merchant_ref_id,
        #     "amount": order.transaction_amount,
        #     "integration": processor.name,
        #     "status": "Processing",
        #     "product": order.product,
        #     "transaction_date": frappe.utils.now()
        # }).insert(ignore_permissions=True)
        
        
        # 🔹 CREATE PENDING TIGERBEETLE TRANSFER (Authorization Hold)
        # This prevents duplicate processing and will be POST/VOID based on webhook
        try:
            from iswitch.tigerbeetle_client import get_client
            import tigerbeetle as tb
            import hashlib
            
            def stable_id(value: str) -> int:
                return int(hashlib.sha256(value.encode()).hexdigest()[:32], 16)
            
            client = get_client()
            
            # Get merchant Payin TigerBeetle account
            if not merchant.payin_tigerbeetle_id:
                cancel_order(order.name, "Merchant Payin wallet account not configured")
                return finalize_request_response(
                    request_response,
                    {
                        "code": "0x0500",
                        "status": "PROCESSING_ERROR",
                        "message": "Something went wrong. Please try again later."
                    },
                    500
                )
            
            merchant_account_id = int(merchant.payin_tigerbeetle_id)
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
                            cancel_order(order.name, "Duplicate topup with different amount")
                            return finalize_request_response(
                                request_response,
                                {
                                    "code": "0x0500",
                                    "status": "PROCESSING_ERROR",
                                    "message": "Something went wrong. Please try again later."
                                },
                                500
                            )
                else:
                    # Other errors are critical
                    cancel_order(order.name, "Topup initialization failed")
                    frappe.log_error(
                        f"TigerBeetle transfer failed: {error.result}",
                        "TigerBeetle Error"
                    )
                    return finalize_request_response(
                        request_response,
                        {
                            "code": "0x0500",
                            "status": "PROCESSING_ERROR",
                            "message": "Something went wrong. Please try again later."
                        },
                        500
                    )
        
        except Exception as e:
            frappe.log_error("Error creating topup PENDING transfer", frappe.get_traceback())
            cancel_order(order.name, "Error creating topup PENDING transfer")
            return finalize_request_response(
                request_response,
                {
                    "code": "0x0500",
                    "status": "PROCESSING_ERROR",
                    "message": "Something went wrong. Please try again later."
                },
                500
            )
        
        #frappe.db.commit()
        try:
            crn = None
            qr = None
            status = None
            remark = None
            if processor.name == "PAYPROCESS260228031":
                order.processor_order_id = stable_numeric_id(order.name)

                payload = {
                    "api_token": processor.get_password("secret_key"),
                    "mobile": "9999999999",
                    "name": order.customer_name,
                    "amount": order.order_amount,
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

            elif processor.name == "PAYPROCESS2603240022":
                status = random.choice(["Success", "Failed"])
                qr = f"upi://pay?pa=kdas2024@nsdlpbma&pn=KDAS%20TECHNOLOGIES%20OPC%20PRIVATE%20LIMITED&mc=7372&tr=536276781798654053&tn=SchedulerTest&am={order.order_amount}&cu=INR&mode=05&orgid=181046&purpose=00" if status == "Success" else None
            elif processor.name == "PAYPROCESS26040911519" or processor.name == "PAYPROCESS2603240032":
                mid = processor.get_password("client_id")
                headers = {
                    "Content-Type": "application/json",
                    "x-api-key": mid
                }
                payload = {
                    "merchantTransactionId": order.name,
                    "amount": order.order_amount,
                    "payment_for": "Payment",
                    "payment_mode": "INTENT", 
                    "callback_url": "https://setl.us/api/method/asianpay",
                    "customer_details": {
                        "customer_email": "customer@gmail.com",
                        "customer_phone": "9999990147"
                    }
                }
                url = processor.api_endpoint.rstrip("/") + "/Payment/CreateOrder"

                response = requests.post(url, headers=headers, json=payload, timeout = 10)
                api_response = None
                try:
                    api_response = response.json()
                    frappe.log_error("AsianPay Payin Response", api_response)
                except Exception as e:
                    frappe.log_error("AsianPay Payin Response",response.text)
                
                if api_response:
                    if api_response.get("success") is True:
                        status = "Success"

                        data = api_response.get("data", {})
                        qr = data.get("intent_url")   # UPI intent link
                        crn = data.get("order_id")  # Use as CRN
                        remark = api_response.get("message")

                    else:
                        status = "Failed"
                        remark = api_response.get("message", "API failed")
            elif processor.name == "PAYPROCESS26040711506":
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
                payload = {
                    "payerName": order.customer_name,
                    "email": "customer@gmail.com",
                    "mobile": "9999999999",
                    "amount": str(order.order_amount),
                    "clientRefId": order.name,
                    "remarks": "payin",
                    "redirectUrl":"https://example.com"
                }
                url = processor.api_endpoint.rstrip("/") + "/payin/pg"
                response = requests.post(url, headers=headers, json=payload, timeout=(3,10))
                api_response = None
                try:
                    api_response = response.json()
                    frappe.log_error("One Pesa Payin Response", api_response)
                except Exception as e:
                    frappe.log_error("One Pesa Invalid Payin Response",response.text)
                
                code = api_response.get("code")
                api_status = api_response.get("status", "")
                data = api_response.get("data", {})
                remark = api_response.get("message", "")
                if code == "0x0200" and api_status == "SUCCESS":
                    crn = data.get("clientRefId")
                    status = "Success"
                    qr = data.get("payment_url")
                else:
                    status = "Failed"

            if status == "Success":
                
                frappe.db.set_value("Order", order.name,{"status":"Processing", "crn": crn, "reason": remark})
                
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
                    "code": "0x0402",
                    "status": "Failed",
                    "order_id": order.name,
                    "qr": qr,
                    "message": "Order initialization failed. Please try again later."
                }
                return finalize_request_response(request_response, response, 402)
                
        except Exception as e:
            handle_topup_failure(order.name,"Failed", "Time Out")
            frappe.log_error("Error in topup order processing", frappe.get_traceback())
            response = {
                "code": "0x0500",
                "status": "PROCESSING_ERROR",
                "message": "An error occurred while generating qr. Please try again later."
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


def cancel_order(order_name, remark=None):
    try:
        frappe.db.set_value(
            "Order",
            order_name,
            {
                "status": "Cancelled",
                "remark": remark
            },
            update_modified=True
        )

    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            "Error in cancelling order"
        )