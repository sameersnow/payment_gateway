import tigerbeetle as tb
import os
import frappe

_client = None

def get_client(retries=2):
    global _client
    for attempt in range(retries + 1):
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

        try:
            _client.lookup_accounts([])
            return _client
        except Exception as e:
            # Match eviction by error message string — avoids version-specific imports
            if "EVICTED" in str(e).upper() and attempt < retries:
                frappe.log_error(
                    title="TigerBeetle Client Evicted",
                    message=f"Client evicted on attempt {attempt + 1}, reconnecting..."
                )
                try:
                    _client.close()
                except Exception:
                    pass
                _client = None
                continue
            raise

    frappe.throw("Payment system is currently unavailable. Please try again later or contact support.")