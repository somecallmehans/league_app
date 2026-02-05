import secrets
import hashlib
from better_profanity import profanity

profanity.load_censor_words()

ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
MAX_ATTEMPTS = 5


def generate_code(length: int = 6) -> str:
    for _ in range(MAX_ATTEMPTS):
        code = "".join(secrets.choice(ALPHABET) for _ in range(length))
        if not profanity.contains_profanity(code):
            return code


def hash_code(raw_code: str) -> str:
    return hashlib.sha256(raw_code.encode("utf-8")).hexdigest()
