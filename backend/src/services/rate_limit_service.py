import hashlib
import logging

from redis.asyncio import Redis
from redis.exceptions import RedisError

from dataclasses import dataclass
from datetime import timedelta
from enum import StrEnum


logger = logging.getLogger(__name__)


class RateLimitScope(StrEnum):
    FORGOT_PASSWORD_IP = "forgot_password_ip"
    FORGOT_PASSWORD_EMAIL = "forgot_password_email"


@dataclass(frozen=True)
class RateLimitPolicy:
    scope: RateLimitScope
    limit: int
    window: timedelta
    silent: bool = False
    fail_open: bool = False

    def __post_init__(self):
        if self.limit < 1:
            raise ValueError("Rate limit must be at least 1")

        if self.window <= timedelta(0):
            raise ValueError("Rate limit window must be positive")


FORGOT_PASSWORD_EMAIL_LIMIT = RateLimitPolicy(
    scope=RateLimitScope.FORGOT_PASSWORD_EMAIL,
    limit=3,
    window=timedelta(hours=1),
    silent=True,
    fail_open=False,
)


FORGOT_PASSWORD_IP_LIMIT = RateLimitPolicy(
    scope=RateLimitScope.FORGOT_PASSWORD_IP,
    limit=10,
    window=timedelta(hours=1),
    silent=True,
    fail_open=False,
)


async def check_rate_limit(redis: Redis, policy: RateLimitPolicy, key: str) -> bool:
    window_sec = int(policy.window.total_seconds())
    digest = hashlib.sha256(f"{policy.scope}:{key}".encode()).hexdigest()

    redis_key = f"rl:{policy.scope}:{digest}"

    try:
        async with redis.pipeline(transaction=True) as pipe:
            pipe.incr(redis_key)
            pipe.expire(redis_key, window_sec, nx=True)
            count, _ = await pipe.execute()

        return count <= policy.limit

    except RedisError:
        logger.exception(
            "Redis rate-limit check failed for scope=%s",
            policy.scope,
        )

        return policy.fail_open
