import tigerbeetle as tb
import os
import frappe

_client = None

def get_client():
    global _client
    if not _client:
        try:
            _client = tb.ClientSync(
                cluster_id=0,
                replica_addresses=os.getenv("TB_ADDRESS", "3000")
            )
        except Exception as e:
            frappe.log_error(
                title="TigerBeetle Connection Failed",
                message=f"Failed to connect to TigerBeetle at {os.getenv('TB_ADDRESS', '3000')}: {str(e)}"
            )
            frappe.throw("Payment system is currently unavailable. Please try again later or contact support.")
    return _client