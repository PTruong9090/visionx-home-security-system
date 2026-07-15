import re
import secrets

def generate_stream_key(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    suffix = secrets.token_hex(2)

    return f"{slug}_{suffix}"