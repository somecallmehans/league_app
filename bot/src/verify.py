import os
import nacl.signing
import nacl.exceptions

PUBLIC_KEY = os.getenv("DISCORD_PUBLIC_KEY")


def verify_signature(signature: str, timestamp: str, body: bytes) -> bool:
    breakpoint()
    try:
        vk = nacl.signing.VerifyKey(bytes.fromhex(PUBLIC_KEY))
        vk.verify(timestamp.encode() + body, bytes.fromhex(signature))
        return True
    except nacl.exceptions.BadSignatureError:
        return False
