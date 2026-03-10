import base64
import json
import os

import frappe

try:
    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives import hashes as crypto_hashes
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
except ImportError:
    AESGCM = None

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
PBKDF2_ITERATIONS = 65536   # matches Java: new PBEKeySpec(pass, salt, 65536, 256)
PBKDF2_KEY_LENGTH = 32      # 256-bit AES key
GCM_NONCE_LENGTH  = 12      # 96-bit nonce  (GCM standard / NIST SP 800-38D)
SALT_LENGTH       = 16      # 128-bit random salt


# ===========================================================================
# ENCRYPTION
# ===========================================================================

def encrypt_payload(plain_dict: dict, access_key: str) -> dict:
    """
    Serialises plain_dict to JSON, encrypts with AES-256-GCM, and returns
    the Airtel-formatted request body: {"data": "<base64_blob>"}.

    A fresh random salt and nonce are generated on every call (secure by design).

    Args:
        plain_dict  : The unencrypted request payload as a Python dict
        access_key  : Raw access key from Airtel onboarding

    Returns:
        {"data": "<base64-encoded blob>"}
    """
    _assert_crypto()

    plain_bytes = json.dumps(plain_dict, separators=(",", ":")).encode("utf-8")
    salt        = os.urandom(SALT_LENGTH)
    nonce       = os.urandom(GCM_NONCE_LENGTH)
    key         = _derive_aes_key(access_key=access_key, salt=salt)

    # encrypt() appends the 16-byte GCM authentication tag to the ciphertext
    ciphertext  = AESGCM(key).encrypt(nonce, plain_bytes, None)

    # Concatenate then base64-encode: [salt | nonce | ciphertext+tag]
    blob = base64.b64encode(salt + nonce + ciphertext).decode("utf-8")

    return {"data": blob}


# ===========================================================================
# DECRYPTION
# ===========================================================================

def decrypt_payload(encrypted_data: str, access_key: str) -> dict:
    """
    Decodes and decrypts the base64 blob returned by Airtel.

    Wire format expected:  [ salt (16 B) | nonce (12 B) | ciphertext + tag ]

    Args:
        encrypted_data : The value of response["data"] from Airtel
        access_key     : Raw access key from Airtel onboarding

    Returns:
        Decrypted response as a Python dict

    Raises:
        Exception on any decode, decryption, or parse failure
    """
    _assert_crypto()

    # --- base64 decode ---
    try:
        blob = base64.b64decode(encrypted_data)
    except Exception:
        raise Exception("Failed to base64-decode Airtel response blob.")

    # --- length sanity check (salt + nonce + min 16-byte GCM tag) ---
    min_len = SALT_LENGTH + GCM_NONCE_LENGTH + 16
    if len(blob) < min_len:
        raise Exception(
            f"Response blob too short ({len(blob)} B, expected ≥ {min_len} B)."
        )

    # --- split wire format ---
    salt       = blob[:SALT_LENGTH]
    nonce      = blob[SALT_LENGTH : SALT_LENGTH + GCM_NONCE_LENGTH]
    ciphertext = blob[SALT_LENGTH + GCM_NONCE_LENGTH :]

    # --- derive key using the same salt embedded in the blob ---
    key = _derive_aes_key(access_key=access_key, salt=salt)

    # --- AES-GCM decrypt (also verifies authentication tag) ---
    try:
        plain_bytes = AESGCM(key).decrypt(nonce, ciphertext, None)
    except Exception as exc:
        raise Exception(f"AES-GCM decryption failed: {exc}")

    # --- parse JSON ---
    try:
        return json.loads(plain_bytes.decode("utf-8"))
    except Exception as exc:
        raise Exception(f"Failed to JSON-parse decrypted response: {exc}")


# ===========================================================================
# PAYLOAD BUILDER
# ===========================================================================

def build_payload_from_doc(doc) -> dict:
    """
    Maps an "Airtel QR Request" Frappe document to the exact request shape
    expected by the Airtel Dynamic QR API.

    Optional nested objects (customer, posDetail, expireIn) are set to None
    when their constituent fields are all empty, matching Airtel's spec.

    Args:
        doc : A loaded "Airtel QR Request" frappe.Document instance

    Returns:
        Plain (unencrypted) request dict ready to pass to encrypt_payload()
    """
    # --- expireIn: include only when expire_value is set ---
    expire_in = None
    if doc.expire_value:
        expire_in = {
            "value":  int(doc.expire_value),
            "format": doc.expire_format or "MINUTE",
        }

    # --- customer: include only when at least one field is populated ---
    customer = None
    if doc.payer_name or doc.payer_vpa or doc.mobile_number:
        customer = {
            "payerName":    doc.payer_name    or None,
            "payerVpa":     doc.payer_vpa     or None,
            "mobileNumber": doc.mobile_number or None,
        }

    # --- posDetail: include only when at least one field is populated ---
    pos_detail = None
    if doc.terminal_id or doc.pos_name:
        pos_detail = {
            "terminalId": doc.terminal_id or None,
            "posName":    doc.pos_name    or None,
        }

    return {
        "data": {
            # --- mandatory ---
            "payeeVpa":   doc.payee_vpa,
            "hdnOrderId": doc.hdn_order_id,
            # --- optional scalars ---
            "remarks":      doc.remarks       or None,
            "txnAmount":    str(doc.txn_amount)     if doc.txn_amount     else None,
            "minTxnAmount": str(doc.min_txn_amount) if doc.min_txn_amount else None,
            "flowType":     doc.flow_type     or None,
            # --- qr object (mandatory) ---
            "qr": {
                "type":   doc.qr_type,
                "width":  int(doc.qr_width  or 240),
                "height": int(doc.qr_height or 240),
            },
            # --- optional objects ---
            "expireIn":  expire_in,
            "customer":  customer,
            "posDetail": pos_detail,
        }
    }


# ===========================================================================
# INTERNAL HELPERS
# ===========================================================================

def _derive_aes_key(access_key: str, salt: bytes) -> bytes:
    """
    Derives a 256-bit AES key from the access_key and salt using PBKDF2-HMAC-SHA256.
    Matches Java: new PBEKeySpec(password.toCharArray(), salt, 65536, 256)
    """
    kdf = PBKDF2HMAC(
        algorithm=crypto_hashes.SHA256(),
        length=PBKDF2_KEY_LENGTH,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
        backend=default_backend(),
    )
    return kdf.derive(access_key.encode("utf-8"))


def _assert_crypto():
    """Raises clearly if the cryptography package is not installed."""
    if AESGCM is None:
        raise Exception(
            "Python package 'cryptography' is not installed.\n"
            "Fix: bench pip install cryptography"
        )