import secrets
from better_profanity import profanity

profanity.load_censor_words()

ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
MAX_ATTEMPTS = 5


def generate_code(length: int = 6) -> str:
    for _ in range(MAX_ATTEMPTS):
        code = "".join(secrets.choice(ALPHABET) for _ in range(length))
        if not profanity.contains_profanity(code):
            return code
