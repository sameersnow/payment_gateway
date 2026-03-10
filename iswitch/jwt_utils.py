import base64
import gzip
import hashlib
import hmac as hmac_lib
import json
import time

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
API_SERVICE_ID = "externalDqrCodeGenerate"
JWT_SUBJECT    = "merchant-onboarding"


# ---------------------------------------------------------------------------
# Public function
# ---------------------------------------------------------------------------

def generate_jwt(mid: str, access_key: str, expiry_seconds: int) -> str:
    """
    Builds and returns a signed, GZIP-compressed HS256 JWT.

    Args:
        mid             : Merchant ID (placed in the MID claim)
        access_key      : Raw access key from Airtel onboarding
        expiry_seconds  : Token lifetime in seconds (e.g. 300 for 5 minutes)

    Returns:
        Compact JWT string:  <header_b64>.<payload_b64>.<signature_b64>
    """
    signing_key = _derive_signing_key(access_key)
    now         = int(time.time())

    claims = {
        "MID":          mid,
        "ApiServiceId": API_SERVICE_ID,
        "sub":          JWT_SUBJECT,
        "iat":          now,
        "exp":          now + expiry_seconds,
    }

    header = {"alg": "HS256", "zip": "GZIP"}

    return _build_token(header=header, claims=claims, key=signing_key)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _derive_signing_key(access_key: str) -> str:
    """
    Replicates Java getSHA256Key():
        MessageDigest("SHA-512").digest(accessKey.getBytes()) → lowercase hex

    Despite the Java method name, Airtel's implementation uses SHA-512.
    The resulting hex string is used directly as the HMAC key.
    """
    raw_digest = hashlib.sha512(access_key.encode("utf-8")).digest()
    return raw_digest.hex()


def _build_token(header: dict, claims: dict, key: str) -> str:
    """
    Constructs the three-part JWT manually to support GZIP payload compression,
    which JJWT's CompressionCodecs.GZIP produces but PyJWT cannot replicate.

    Structure:
        base64url(header_json)
        .
        base64url(gzip(claims_json))
        .
        base64url(hmac_sha256(header_b64 + "." + payload_b64))
    """
    header_b64  = _b64url(json.dumps(header,  separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url(gzip.compress(
                      json.dumps(claims, separators=(",", ":")).encode("utf-8")))

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    signature = hmac_lib.new(
        key.encode("utf-8"),
        signing_input,
        hashlib.sha256
    ).digest()

    return f"{header_b64}.{payload_b64}.{_b64url(signature)}"


def _b64url(data: bytes) -> str:
    """URL-safe base64 encoding without padding (RFC 7515 §2)."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")