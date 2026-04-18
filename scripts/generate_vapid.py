"""Generate a VAPID keypair for Web Push notifications.

Usage:
    python3 scripts/generate_vapid.py

Outputs the three env vars to paste into ~/docker/trip-planner/.env on butler:
    VAPID_PUBLIC_KEY=<url-safe base64 of uncompressed P-256 public point>
    VAPID_PRIVATE_KEY=<url-safe base64 of the 32-byte private scalar>
    VAPID_SUBJECT=mailto:<your-email>

Uses only stdlib + `cryptography`, which the backend already depends on.
Keys are standard VAPID format:
    - private = 32-byte private scalar, URL-safe b64 (no padding)
    - public  = 65-byte uncompressed EC point (0x04 || X(32) || Y(32)), URL-safe b64 (no padding)
"""

from __future__ import annotations

import base64
import sys

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def main() -> int:
    private_key = ec.generate_private_key(ec.SECP256R1())

    private_int = private_key.private_numbers().private_value
    private_bytes = private_int.to_bytes(32, "big")

    public_numbers = private_key.public_key().public_numbers()
    public_bytes = (
        b"\x04"
        + public_numbers.x.to_bytes(32, "big")
        + public_numbers.y.to_bytes(32, "big")
    )

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("ascii")

    print("# VAPID keypair — add to your .env (butler: ~/docker/trip-planner/.env)")
    print(f"VAPID_PRIVATE_KEY={_b64url(private_bytes)}")
    print(f"VAPID_PUBLIC_KEY={_b64url(public_bytes)}")
    print("VAPID_SUBJECT=mailto:narangwa@microsoft.com  # edit as needed")
    print()
    print("# Private key (PEM, for pywebpush): save as vapid_private.pem if preferred")
    print(private_pem)

    return 0


if __name__ == "__main__":
    sys.exit(main())
